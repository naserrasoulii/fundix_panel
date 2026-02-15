"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  listUsers,
  sendUserNotification,
  updateUserRole,
  updateUserStatus,
  type PaginatedResult,
  type AdminUser
} from "@/lib/admin-api";
import { formatDateTime, formatUsd } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const PAGE_SIZE = 20;

type NotificationDraft = {
  title: string;
  message: string;
  level: "info" | "warning" | "danger";
};

function statusBadge(status: AdminUser["status"]) {
  if (status === "active") {
    return "success";
  }
  if (status === "suspended" || status === "blocked") {
    return "warning";
  }
  return "muted";
}

function statusLabel(status: AdminUser["status"]) {
  if (status === "blocked") {
    return "suspended";
  }
  return status;
}

function roleBadge(role: AdminUser["role"]) {
  return role === "admin" ? "outline" : "muted";
}

function kycBadge(kycStatus: AdminUser["kycStatus"]) {
  switch (kycStatus) {
    case "verified":
      return "success";
    case "pending":
      return "warning";
    case "rejected":
      return "danger";
    default:
      return "muted";
  }
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [flash, setFlash] = React.useState<string | null>(null);
  const [selectedUser, setSelectedUser] = React.useState<AdminUser | null>(null);
  const [notifyOpen, setNotifyOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<NotificationDraft>({
    title: "",
    message: "",
    level: "info"
  });

  React.useEffect(() => {
    setPage(1);
  }, [search]);

  const usersQueryKey = React.useMemo(
    () => ["admin", "users", page] as const,
    [page]
  );

  const usersQuery = useQuery({
    queryKey: usersQueryKey,
    queryFn: () =>
      listUsers({
        page,
        limit: PAGE_SIZE
      })
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AdminUser["role"] }) =>
      updateUserRole(userId, role),
    onSuccess: (_result, variables) => {
      const cachedUsers = queryClient.getQueryData<PaginatedResult<AdminUser>>(usersQueryKey);
      const target = cachedUsers?.items.find((user) => user.id === variables.userId);
      queryClient.setQueryData<PaginatedResult<AdminUser>>(
        usersQueryKey,
        (old) =>
          old
            ? {
                ...old,
                items: old.items.map((user) =>
                  user.id === variables.userId ? { ...user, role: variables.role } : user
                )
              }
            : old
      );
      setFlash(`Role updated for ${target?.username ?? "user"}.`);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to update role";
      setFlash(message);
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({
      userId,
      status
    }: {
      userId: string;
      status: Extract<AdminUser["status"], "active" | "suspended">;
    }) => updateUserStatus(userId, status),
    onSuccess: (_result, variables) => {
      const cachedUsers = queryClient.getQueryData<PaginatedResult<AdminUser>>(usersQueryKey);
      const target = cachedUsers?.items.find((user) => user.id === variables.userId);
      queryClient.setQueryData<PaginatedResult<AdminUser>>(
        usersQueryKey,
        (old) =>
          old
            ? {
                ...old,
                items: old.items.map((user) =>
                  user.id === variables.userId
                    ? { ...user, status: variables.status }
                    : user
                )
              }
            : old
      );
      setFlash(`Status updated for ${target?.username ?? "user"}.`);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to update status";
      setFlash(message);
    }
  });

  const notifyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) {
        throw new Error("No user selected");
      }
      return sendUserNotification(selectedUser.id, draft);
    },
    onSuccess: () => {
      setFlash("Notification queued successfully.");
      setNotifyOpen(false);
      setSelectedUser(null);
      setDraft({ title: "", message: "", level: "info" });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to send notification";
      setFlash(message);
    }
  });

  React.useEffect(() => {
    if (!flash) {
      return;
    }
    const timeout = window.setTimeout(() => setFlash(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [flash]);

  const users = usersQuery.data?.items ?? [];
  const total = usersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const filteredUsers = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return users;
    }

    return users.filter((user) => {
      return (
        user.id.toLowerCase().includes(q) ||
        user.username.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q) ||
        statusLabel(user.status).toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  const canSend =
    Boolean(selectedUser) &&
    draft.title.trim().length > 0 &&
    draft.message.trim().length > 0 &&
    !notifyMutation.isPending;

  const roleChangingUserId = roleMutation.variables?.userId ?? null;
  const statusChangingUserId = statusMutation.variables?.userId ?? null;

  function handleRoleChange(user: AdminUser, role: AdminUser["role"]) {
    if (user.role === role) {
      return;
    }
    roleMutation.mutate({ userId: user.id, role });
  }

  function handleStatusChange(
    user: AdminUser,
    status: Extract<AdminUser["status"], "active" | "suspended">
  ) {
    if (statusLabel(user.status) === status) {
      return;
    }
    statusMutation.mutate({ userId: user.id, status });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Review accounts, manage roles, suspend users, and send notifications.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="text-xs text-muted-foreground">
            Data source: API
          </div>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by id, username, email, role..."
            className="w-full sm:w-72"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => usersQuery.refetch()}
            disabled={usersQuery.isFetching}
          >
            Refresh
          </Button>
        </div>
      </header>

      {flash ? (
        <div className="rounded-2xl border bg-muted/40 p-4 text-sm text-foreground">
          {flash}
        </div>
      ) : null}

      <div className="grid gap-3 lg:hidden">
        {usersQuery.isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-4 rounded-2xl border bg-background p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                  <div className="space-y-2">
                    <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-44 animate-pulse rounded bg-muted" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                  <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </div>
              <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
            </div>
          ))
        ) : usersQuery.isError ? (
          <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground shadow-sm">
            Failed to load users. Check API connectivity.
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground shadow-sm">
            No users found.
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="rounded-2xl border bg-background p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {user.username.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 leading-tight">
                    <p className="truncate font-medium text-foreground">{user.username}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{user.email}</p>
                    <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                      {user.id}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={roleBadge(user.role)} className="capitalize">
                    {user.role}
                  </Badge>
                  <Badge variant={statusBadge(user.status)} className="capitalize">
                    {statusLabel(user.status)}
                  </Badge>
                  <Badge variant={kycBadge(user.kycStatus)} className="capitalize">
                    {user.kycStatus}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Direct referrals</p>
                  <p className="font-medium text-foreground">{user.directReferrals}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="font-medium text-foreground">{formatUsd(user.balanceUsd)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-muted-foreground">{formatDateTime(user.createdAt)}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Select
                  value={user.role}
                  onValueChange={(value) =>
                    handleRoleChange(user, value as AdminUser["role"])
                  }
                  disabled={
                    roleMutation.isPending || statusMutation.isPending
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={statusLabel(user.status)}
                  onValueChange={(value) =>
                    handleStatusChange(
                      user,
                      value as Extract<AdminUser["status"], "active" | "suspended">
                    )
                  }
                  disabled={roleMutation.isPending || statusMutation.isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-2 space-y-2">
                {roleChangingUserId === user.id && roleMutation.isPending ? (
                  <p className="text-xs text-muted-foreground">Updating role...</p>
                ) : null}
                {statusChangingUserId === user.id && statusMutation.isPending ? (
                  <p className="text-xs text-muted-foreground">Updating status...</p>
                ) : null}
              </div>

              <div className="mt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSelectedUser(user);
                    setNotifyOpen(true);
                    setDraft({ title: "", message: "", level: "info" });
                  }}
                >
                  Notify
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden rounded-2xl border bg-background shadow-sm lg:block">
        <Table className="min-w-[980px] text-sm">
          <TableHeader className="bg-muted/40 text-left text-xs text-muted-foreground">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 py-3 font-medium">User</TableHead>
              <TableHead className="px-4 py-3 font-medium">Role</TableHead>
              <TableHead className="px-4 py-3 font-medium">Status</TableHead>
              <TableHead className="px-4 py-3 font-medium">KYC</TableHead>
              <TableHead className="px-4 py-3 font-medium">Direct referrals</TableHead>
              <TableHead className="px-4 py-3 font-medium">Balance</TableHead>
              <TableHead className="px-4 py-3 font-medium">Created</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersQuery.isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="px-4 py-4" colSpan={8}>
                    <div className="h-5 w-full animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : usersQuery.isError ? (
              <TableRow>
                <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={8}>
                  Failed to load users. Check API connectivity.
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={8}>
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {user.username.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="leading-tight">
                        <p className="font-medium text-foreground">{user.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email} • {user.id}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="space-y-2">
                      <Badge variant={roleBadge(user.role)} className="capitalize">
                        {user.role}
                      </Badge>
                      <Select
                        value={user.role}
                        onValueChange={(value) =>
                          handleRoleChange(user, value as AdminUser["role"])
                        }
                        disabled={roleMutation.isPending || statusMutation.isPending}
                      >
                        <SelectTrigger className="h-8 w-28 text-xs">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                      {roleChangingUserId === user.id && roleMutation.isPending ? (
                        <p className="text-[11px] text-muted-foreground">Updating...</p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="space-y-2">
                      <Badge variant={statusBadge(user.status)} className="capitalize">
                        {statusLabel(user.status)}
                      </Badge>
                      <Select
                        value={statusLabel(user.status)}
                        onValueChange={(value) =>
                          handleStatusChange(
                            user,
                            value as Extract<AdminUser["status"], "active" | "suspended">
                          )
                        }
                        disabled={roleMutation.isPending || statusMutation.isPending}
                      >
                        <SelectTrigger className="h-8 w-32 text-xs">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                      {statusChangingUserId === user.id && statusMutation.isPending ? (
                        <p className="text-[11px] text-muted-foreground">Updating...</p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Badge variant={kycBadge(user.kycStatus)} className="capitalize">
                      {user.kycStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4">{user.directReferrals}</TableCell>
                  <TableCell className="px-4 py-4 font-medium">{formatUsd(user.balanceUsd)}</TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">
                    {formatDateTime(user.createdAt)}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(user);
                        setNotifyOpen(true);
                        setDraft({ title: "", message: "", level: "info" });
                      }}
                    >
                      Notify
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-background p-4 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          Showing {rangeStart}-{rangeEnd} of {total} users
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || usersQuery.isFetching}
          >
            Previous
          </Button>
          <span className="px-2 text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages || usersQuery.isFetching}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog
        open={notifyOpen}
        onOpenChange={(open) => {
          setNotifyOpen(open);
          if (!open) {
            setSelectedUser(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser ? `Notify ${selectedUser.username}` : "Notify user"}</DialogTitle>
            <DialogDescription>
              Creates an in-app notification for the selected user.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Title</p>
              <Input
                value={draft.title}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Deposit confirmed"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Message</p>
              <Textarea
                value={draft.message}
                onChange={(event) => setDraft((prev) => ({ ...prev, message: event.target.value }))}
                placeholder="Your recent deposit has been confirmed and credited."
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Priority</p>
              <Select
                value={draft.level}
                onValueChange={(value) =>
                  setDraft((prev) => ({
                    ...prev,
                    level: value as NotificationDraft["level"]
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="danger">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {notifyMutation.isError ? (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-200">
                Failed to send notification. Try again.
              </div>
            ) : null}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setNotifyOpen(false)}
              disabled={notifyMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => notifyMutation.mutate()} disabled={!canSend}>
              {notifyMutation.isPending ? "Sending..." : "Send notification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

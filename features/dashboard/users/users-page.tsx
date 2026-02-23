"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  listUsers,
  sendUserNotification,
  type AdminUser
} from "@/lib/admin-api";
import { formatDateTime, formatUsd } from "@/lib/formatters";
import { useDebouncedValue } from "@/lib/use-debounced-value";
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

const PAGE_SIZE = 6;

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
  return role === "user" ? "muted" : "outline";
}

function roleLabel(role: AdminUser["role"]) {
  if (role === "finance-admin") {
    return "finance admin";
  }
  return role;
}

export function UsersPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [flash, setFlash] = React.useState<string | null>(null);
  const [selectedUser, setSelectedUser] = React.useState<AdminUser | null>(null);
  const [notifyOpen, setNotifyOpen] = React.useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);
  const [draft, setDraft] = React.useState<NotificationDraft>({
    title: "",
    message: "",
    level: "info"
  });

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const normalizedSearch = debouncedSearch.trim();
  const usersQueryKey = React.useMemo(
    () => ["admin", "users", { page, search: normalizedSearch }] as const,
    [page, normalizedSearch]
  );

  const usersQuery = useQuery({
    queryKey: usersQueryKey,
    queryFn: () =>
      listUsers({
        page,
        limit: PAGE_SIZE,
        search: normalizedSearch || undefined
      })
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

  const total = usersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const users = usersQuery.data?.items ?? [];

  const canSend =
    Boolean(selectedUser) &&
    draft.title.trim().length > 0 &&
    draft.message.trim().length > 0 &&
    !notifyMutation.isPending;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Review accounts and send notifications.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="text-xs text-muted-foreground">
            Data source: API
          </div>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by username or email..."
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

      <div className="rounded-2xl border bg-background shadow-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-[1240px] text-sm">
            <TableHeader className="bg-muted/40 text-left text-xs text-muted-foreground">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-3 font-medium">User</TableHead>
                <TableHead className="px-4 py-3 font-medium">Own referral code</TableHead>
                <TableHead className="px-4 py-3 font-medium">Registered with</TableHead>
                <TableHead className="px-4 py-3 font-medium">Role</TableHead>
                <TableHead className="px-4 py-3 font-medium">Status</TableHead>
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
                    <TableCell className="px-4 py-4" colSpan={9}>
                      <div className="h-5 w-full animate-pulse rounded bg-muted" />
                    </TableCell>
                  </TableRow>
                ))
              ) : usersQuery.isError ? (
                <TableRow>
                  <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={9}>
                    Failed to load users. Check API connectivity.
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={9}>
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {user.username.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="leading-tight">
                          <p className="font-medium text-foreground">{user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <span className="font-mono text-xs">{user.referralCode || "—"}</span>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <span className="font-mono text-xs">
                        {user.registeredWithReferralCode || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Badge variant={roleBadge(user.role)} className="capitalize">
                        {roleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Badge variant={statusBadge(user.status)} className="capitalize">
                        {statusLabel(user.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-4">{user.directReferrals}</TableCell>
                    <TableCell className="px-4 py-4 font-medium">{formatUsd(user.balanceUsd)}</TableCell>
                    <TableCell className="px-4 py-4 text-muted-foreground">
                      {formatDateTime(user.createdAt)}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button type="button" size="sm" variant="outline" asChild>
                          <Link href={`/${locale}/dashboard/users/${user.id}/manual-deposit`}>
                            Manual deposit
                          </Link>
                        </Button>
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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

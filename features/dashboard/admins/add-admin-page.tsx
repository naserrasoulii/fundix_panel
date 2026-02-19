"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";

import { listUsers, updateUserRole, type AdminUser } from "@/lib/admin-api";
import { formatDateTime } from "@/lib/formatters";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const PAGE_SIZE = 20;

function roleBadge(role: AdminUser["role"]) {
  return role === "user" ? "muted" : "outline";
}

function roleLabel(role: AdminUser["role"]) {
  if (role === "finance-admin") {
    return "finance admin";
  }
  return role;
}

function statusBadge(status: AdminUser["status"]) {
  if (status === "active") {
    return "success";
  }
  if (status === "suspended" || status === "blocked") {
    return "warning";
  }
  return "muted";
}

export function AddAdminPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [selectedRoles, setSelectedRoles] = React.useState<Record<string, AdminUser["role"]>>({});

  const normalizedSearch = debouncedSearch.trim();
  const usersQuery = useQuery({
    queryKey: ["admin", "users", "add-admin", { search: normalizedSearch }],
    queryFn: () =>
      listUsers({
        page: 1,
        limit: PAGE_SIZE,
        search: normalizedSearch || undefined
      })
  });

  const promoteMutation = useMutation({
    mutationFn: async (params: { user: AdminUser; role: AdminUser["role"] }) =>
      updateUserRole(params.user.id, params.role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    }
  });

  function getSelectedRole(userId: string) {
    return selectedRoles[userId] ?? "admin";
  }

  async function promoteToAdmin(user: AdminUser) {
    const selectedRole = getSelectedRole(user.id);
    if (selectedRole === user.role) return;

    const confirm = await Swal.fire({
      title: "Apply role to user?",
      text: `Set "${user.username}" role to "${roleLabel(selectedRole)}".`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, apply",
      cancelButtonText: "Cancel",
      reverseButtons: true
    });

    if (!confirm.isConfirmed) {
      return;
    }

    try {
      await promoteMutation.mutateAsync({ user, role: selectedRole });
      await Swal.fire({
        title: "Role updated",
        text: `${user.username} is now ${roleLabel(selectedRole)}.`,
        icon: "success",
        timer: 1400,
        showConfirmButton: false
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to promote user.";
      await Swal.fire({
        title: "Action failed",
        text: message,
        icon: "error"
      });
    }
  }

  const users = usersQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Add Admin</h1>
          <p className="text-sm text-muted-foreground">
            Search a user and set role to user, admin, or finance admin. This page is intentionally hidden from sidebar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/${locale}/dashboard/users`}>Back to users</Link>
          </Button>
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

      <div className="rounded-2xl border bg-background p-4 shadow-sm">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by username or email..."
        />
      </div>

      <div className="rounded-2xl border bg-background shadow-sm">
        <Table className="min-w-[980px] text-sm">
          <TableHeader className="bg-muted/40 text-left text-xs text-muted-foreground">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 py-3 font-medium">User</TableHead>
              <TableHead className="px-4 py-3 font-medium">Role</TableHead>
              <TableHead className="px-4 py-3 font-medium">Set role</TableHead>
              <TableHead className="px-4 py-3 font-medium">Status</TableHead>
              <TableHead className="px-4 py-3 font-medium">Created</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersQuery.isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="px-4 py-4" colSpan={6}>
                    <div className="h-5 w-full animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : usersQuery.isError ? (
              <TableRow>
                <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={6}>
                  Failed to load users.
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={6}>
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="px-4 py-4">
                    <p className="font-medium text-foreground">{user.username}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Badge variant={roleBadge(user.role)} className="capitalize">
                      {roleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Select
                      value={getSelectedRole(user.id)}
                      onValueChange={(value) =>
                        setSelectedRoles((prev) => ({
                          ...prev,
                          [user.id]: value as AdminUser["role"]
                        }))
                      }
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="finance-admin">Finance admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Badge variant={statusBadge(user.status)} className="capitalize">
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">
                    {formatDateTime(user.createdAt)}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-right">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void promoteToAdmin(user)}
                      disabled={promoteMutation.isPending || getSelectedRole(user.id) === user.role}
                    >
                      Apply role
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

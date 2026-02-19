"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  approveWithdrawRequest,
  listWithdrawRequests,
  rejectWithdrawRequest,
  type AdminWithdrawRequest,
  type PaginatedResult
} from "@/lib/admin-api";
import { formatDateTime, formatUsd, shortHash } from "@/lib/formatters";
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

function statusVariant(status: AdminWithdrawRequest["status"]) {
  switch (status) {
    case "approved":
      return "success";
    case "pending":
      return "warning";
    case "rejected":
      return "danger";
    default:
      return "muted";
  }
}

export function WithdrawsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState<AdminWithdrawRequest["status"] | "all">(
    "all"
  );
  const [flash, setFlash] = React.useState<string | null>(null);

  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectTarget, setRejectTarget] = React.useState<AdminWithdrawRequest | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");

  React.useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  const withdrawsQuery = useQuery({
    queryKey: ["admin", "withdraw-requests", { page, statusFilter }],
    queryFn: () =>
      listWithdrawRequests({
        page,
        limit: PAGE_SIZE,
        status: statusFilter
      })
  });

  const approveMutation = useMutation({
    mutationFn: (withdrawId: string) => approveWithdrawRequest(withdrawId),
    onSuccess: (_data, withdrawId) => {
      queryClient.setQueryData<PaginatedResult<AdminWithdrawRequest>>(
        ["admin", "withdraw-requests", { page, statusFilter }],
        (old) =>
          old
            ? {
                ...old,
                items: old.items.map((wd) =>
                  wd.id === withdrawId
                    ? {
                        ...wd,
                        status: "approved",
                        decidedAt: new Date().toISOString(),
                        rejectReason: null
                      }
                    : wd
                )
              }
            : old
      );
      setFlash("Withdraw request approved.");
    },
    onError: () => {
      setFlash("Failed to approve withdraw request.");
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ withdrawId, reason }: { withdrawId: string; reason: string }) =>
      rejectWithdrawRequest(withdrawId, reason),
    onSuccess: (_data, variables) => {
      queryClient.setQueryData<PaginatedResult<AdminWithdrawRequest>>(
        ["admin", "withdraw-requests", { page, statusFilter }],
        (old) =>
          old
            ? {
                ...old,
                items: old.items.map((wd) =>
                  wd.id === variables.withdrawId
                    ? {
                        ...wd,
                        status: "rejected",
                        decidedAt: new Date().toISOString(),
                        rejectReason: variables.reason
                      }
                    : wd
                )
              }
            : old
      );
      setFlash("Withdraw request rejected.");
      setRejectOpen(false);
      setRejectTarget(null);
      setRejectReason("");
    },
    onError: () => {
      setFlash("Failed to reject withdraw request.");
    }
  });

  React.useEffect(() => {
    if (!flash) {
      return;
    }
    const timeout = window.setTimeout(() => setFlash(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [flash]);

  const total = withdrawsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const filtered = React.useMemo(() => {
    const withdraws = withdrawsQuery.data?.items ?? [];
    const q = debouncedSearch.trim().toLowerCase();

    return withdraws.filter((wd) => {
      if (statusFilter !== "all" && wd.status !== statusFilter) {
        return false;
      }

      if (!q) {
        return true;
      }

      return (
        wd.id.toLowerCase().includes(q) ||
        wd.userLabel.toLowerCase().includes(q) ||
        wd.asset.toLowerCase().includes(q) ||
        wd.address.toLowerCase().includes(q)
      );
    });
  }, [withdrawsQuery.data?.items, debouncedSearch, statusFilter]);

  const canReject = rejectReason.trim().length >= 3 && !rejectMutation.isPending;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Withdrawals</h1>
          <p className="text-sm text-muted-foreground">
            Review withdrawal requests, approve, or reject with a reason.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="text-xs text-muted-foreground">
            Data source: API
          </div>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by id, user, address..."
            className="w-full sm:w-72"
          />
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            onClick={() => withdrawsQuery.refetch()}
            disabled={withdrawsQuery.isFetching}
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
        {withdrawsQuery.isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-4 rounded-2xl border bg-background p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2">
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-44 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
                <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
              </div>
            </div>
          ))
        ) : withdrawsQuery.isError ? (
          <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground shadow-sm">
            Failed to load withdrawal requests. Check API connectivity.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground shadow-sm">
            No withdrawal requests found.
          </div>
        ) : (
          filtered.map((wd) => (
            <div key={wd.id} className="rounded-2xl border bg-background p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{wd.id}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{wd.userLabel}</p>
                </div>
                <Badge variant={statusVariant(wd.status)} className="capitalize">
                  {wd.status}
                </Badge>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Asset</p>
                  <p className="font-medium text-foreground">{wd.asset}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Amount (USD)</p>
                  <p className="font-medium text-foreground">{formatUsd(wd.amountUsd)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Network</p>
                  <p className="text-muted-foreground">{wd.network}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Requested</p>
                  <p className="text-muted-foreground">{formatDateTime(wd.requestedAt)}</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="break-all font-mono text-xs text-muted-foreground">
                    {shortHash(wd.address, 10, 6)}
                  </p>
                </div>
              </div>

              {wd.status === "pending" ? (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => approveMutation.mutate(wd.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="w-full"
                  >
                    {approveMutation.isPending ? "Approving..." : "Approve"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRejectTarget(wd);
                      setRejectReason("");
                      setRejectOpen(true);
                    }}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="w-full"
                  >
                    Reject
                  </Button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      <div className="hidden rounded-2xl border bg-background shadow-sm lg:block">
        <Table className="min-w-[1120px] text-sm">
          <TableHeader className="bg-muted/40 text-left text-xs text-muted-foreground">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 py-3 font-medium">Request</TableHead>
              <TableHead className="px-4 py-3 font-medium">User</TableHead>
              <TableHead className="px-4 py-3 font-medium">Asset</TableHead>
              <TableHead className="px-4 py-3 font-medium">Amount (USD)</TableHead>
              <TableHead className="px-4 py-3 font-medium">Network</TableHead>
              <TableHead className="px-4 py-3 font-medium">Address</TableHead>
              <TableHead className="px-4 py-3 font-medium">Requested</TableHead>
              <TableHead className="px-4 py-3 font-medium">Status</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withdrawsQuery.isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="px-4 py-4" colSpan={9}>
                    <div className="h-5 w-full animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : withdrawsQuery.isError ? (
              <TableRow>
                <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={9}>
                  Failed to load withdrawal requests. Check API connectivity.
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={9}>
                  No withdrawal requests found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((wd) => (
                <TableRow key={wd.id}>
                  <TableCell className="px-4 py-4 font-medium text-foreground">{wd.id}</TableCell>
                  <TableCell className="px-4 py-4">{wd.userLabel}</TableCell>
                  <TableCell className="px-4 py-4">{wd.asset}</TableCell>
                  <TableCell className="px-4 py-4 font-medium">{formatUsd(wd.amountUsd)}</TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">{wd.network}</TableCell>
                  <TableCell className="px-4 py-4 font-mono text-xs text-muted-foreground">
                    {shortHash(wd.address, 10, 6)}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">
                    {formatDateTime(wd.requestedAt)}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Badge variant={statusVariant(wd.status)} className="capitalize">
                      {wd.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-right">
                    {wd.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => approveMutation.mutate(wd.id)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          {approveMutation.isPending ? "Approving..." : "Approve"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRejectTarget(wd);
                            setRejectReason("");
                            setRejectOpen(true);
                          }}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-background p-4 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          Showing {rangeStart}-{rangeEnd} of {total} withdrawals
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || withdrawsQuery.isFetching}
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
            disabled={page >= totalPages || withdrawsQuery.isFetching}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog
        open={rejectOpen}
        onOpenChange={(open) => {
          setRejectOpen(open);
          if (!open) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{rejectTarget ? `Reject ${rejectTarget.id}` : "Reject withdrawal"}</DialogTitle>
            <DialogDescription>
              Provide a reason that will be stored for auditing and user messaging.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            {rejectTarget ? (
              <div className="rounded-xl border bg-muted/40 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-foreground">{rejectTarget.userLabel}</p>
                  <Badge variant="outline">
                    {rejectTarget.asset} • {rejectTarget.network}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Amount: <span className="font-medium text-foreground">{formatUsd(rejectTarget.amountUsd)}</span>
                </p>
              </div>
            ) : null}

            <div className="space-y-2">
              <p className="text-sm font-medium">Reject reason</p>
              <Textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Example: Address risk score too high, please update KYC."
              />
              <p className="text-xs text-muted-foreground">
                Minimum 3 characters. Keep it clear and actionable.
              </p>
            </div>

            {rejectMutation.isError ? (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-200">
                Failed to reject withdraw request. Try again.
              </div>
            ) : null}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!rejectTarget) {
                  return;
                }
                rejectMutation.mutate({ withdrawId: rejectTarget.id, reason: rejectReason.trim() });
              }}
              disabled={!rejectTarget || !canReject}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Confirm reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

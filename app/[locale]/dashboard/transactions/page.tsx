"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { listTransactions, type AdminTransaction } from "@/lib/admin-api";
import { formatDateTime, formatUsd, shortHash } from "@/lib/formatters";
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

function statusVariant(status: AdminTransaction["status"]) {
  switch (status) {
    case "completed":
      return "success";
    case "pending":
      return "warning";
    case "failed":
      return "danger";
    default:
      return "muted";
  }
}

function typeVariant(type: AdminTransaction["type"]) {
  switch (type) {
    case "deposit":
      return "success";
    case "withdraw":
      return "warning";
    case "trade":
      return "outline";
    default:
      return "muted";
  }
}

export default function TransactionsPage() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState<AdminTransaction["status"] | "all">(
    "all"
  );

  React.useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const transactionsQuery = useQuery({
    queryKey: ["admin", "transactions", { page, statusFilter }],
    queryFn: () =>
      listTransactions({
        page,
        limit: PAGE_SIZE,
        status: statusFilter
      })
  });

  const total = transactionsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const filtered = React.useMemo(() => {
    const transactions = transactionsQuery.data?.items ?? [];
    const q = search.trim().toLowerCase();

    return transactions.filter((tx) => {
      if (statusFilter !== "all" && tx.status !== statusFilter) {
        return false;
      }

      if (!q) {
        return true;
      }

      return (
        tx.id.toLowerCase().includes(q) ||
        tx.userLabel.toLowerCase().includes(q) ||
        tx.asset.toLowerCase().includes(q) ||
        (tx.txHash ? tx.txHash.toLowerCase().includes(q) : false)
      );
    });
  }, [transactionsQuery.data?.items, search, statusFilter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Inspect deposits, withdrawals, and internal trades.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="text-xs text-muted-foreground">
            Data source: API
          </div>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by id, user, asset, hash..."
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
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            onClick={() => transactionsQuery.refetch()}
            disabled={transactionsQuery.isFetching}
          >
            Refresh
          </Button>
        </div>
      </header>

      <div className="grid gap-3 lg:hidden">
        {transactionsQuery.isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="space-y-4 rounded-2xl border bg-background p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2">
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-44 animate-pulse rounded bg-muted" />
                </div>
                <div className="flex gap-2">
                  <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                  <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))
        ) : transactionsQuery.isError ? (
          <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground shadow-sm">
            Failed to load transactions. Check API connectivity.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground shadow-sm">
            No transactions found.
          </div>
        ) : (
          filtered.map((tx) => (
            <div key={tx.id} className="rounded-2xl border bg-background p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{tx.id}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{tx.userLabel}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={typeVariant(tx.type)} className="capitalize">
                    {tx.type}
                  </Badge>
                  <Badge variant={statusVariant(tx.status)} className="capitalize">
                    {tx.status}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Asset</p>
                  <p className="font-medium text-foreground">{tx.asset}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Amount (USD)</p>
                  <p className="font-medium text-foreground">{formatUsd(tx.amountUsd)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Network</p>
                  <p className="text-muted-foreground">{tx.network ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-muted-foreground">{formatDateTime(tx.createdAt)}</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Hash</p>
                  <p className="break-all font-mono text-xs text-muted-foreground">
                    {tx.txHash ? shortHash(tx.txHash) : "—"}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden rounded-2xl border bg-background shadow-sm lg:block">
        <Table className="min-w-[1040px] text-sm">
          <TableHeader className="bg-muted/40 text-left text-xs text-muted-foreground">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 py-3 font-medium">Tx</TableHead>
              <TableHead className="px-4 py-3 font-medium">User</TableHead>
              <TableHead className="px-4 py-3 font-medium">Type</TableHead>
              <TableHead className="px-4 py-3 font-medium">Asset</TableHead>
              <TableHead className="px-4 py-3 font-medium">Amount (USD)</TableHead>
              <TableHead className="px-4 py-3 font-medium">Network</TableHead>
              <TableHead className="px-4 py-3 font-medium">Status</TableHead>
              <TableHead className="px-4 py-3 font-medium">Created</TableHead>
              <TableHead className="px-4 py-3 font-medium">Hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactionsQuery.isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="px-4 py-4" colSpan={9}>
                    <div className="h-5 w-full animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : transactionsQuery.isError ? (
              <TableRow>
                <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={9}>
                  Failed to load transactions. Check API connectivity.
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={9}>
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="px-4 py-4 font-medium text-foreground">{tx.id}</TableCell>
                  <TableCell className="px-4 py-4">{tx.userLabel}</TableCell>
                  <TableCell className="px-4 py-4">
                    <Badge variant={typeVariant(tx.type)} className="capitalize">
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4">{tx.asset}</TableCell>
                  <TableCell className="px-4 py-4 font-medium">{formatUsd(tx.amountUsd)}</TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">{tx.network ?? "—"}</TableCell>
                  <TableCell className="px-4 py-4">
                    <Badge variant={statusVariant(tx.status)} className="capitalize">
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">
                    {formatDateTime(tx.createdAt)}
                  </TableCell>
                  <TableCell className="px-4 py-4 font-mono text-xs text-muted-foreground">
                    {tx.txHash ? shortHash(tx.txHash) : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-background p-4 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          Showing {rangeStart}-{rangeEnd} of {total} transactions
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || transactionsQuery.isFetching}
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
            disabled={page >= totalPages || transactionsQuery.isFetching}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

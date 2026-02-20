"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { listDepositCreditsReport, type AdminDepositCreditItem } from "@/lib/admin-api";
import { formatDateTime, formatUsd, shortHash } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

const PAGE_SIZE = 12;

export function DepositCreditsPage() {
  const [page, setPage] = React.useState(1);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [userId, setUserId] = React.useState("");
  const [appliedFrom, setAppliedFrom] = React.useState("");
  const [appliedTo, setAppliedTo] = React.useState("");
  const [appliedUserId, setAppliedUserId] = React.useState("");

  React.useEffect(() => {
    setPage(1);
  }, [appliedFrom, appliedTo, appliedUserId]);

  const reportQuery = useQuery({
    queryKey: ["admin", "deposit-credits", { page, appliedFrom, appliedTo, appliedUserId }],
    queryFn: () =>
      listDepositCreditsReport({
        page,
        limit: PAGE_SIZE,
        from: appliedFrom || undefined,
        to: appliedTo || undefined,
        userId: appliedUserId || undefined
      })
  });

  const total = reportQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const applyFilters = () => {
    setAppliedFrom(from.trim());
    setAppliedTo(to.trim());
    setAppliedUserId(userId.trim());
  };

  const clearFilters = () => {
    setFrom("");
    setTo("");
    setUserId("");
    setAppliedFrom("");
    setAppliedTo("");
    setAppliedUserId("");
  };

  const summary = reportQuery.data?.summary;
  const periodLabel =
    summary?.from || summary?.to
      ? `${summary?.from ? formatDateTime(summary.from) : "Any"} → ${
          summary?.to ? formatDateTime(summary.to) : "Now"
        }`
      : "All time";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Deposit Credits</h1>
          <p className="text-sm text-muted-foreground">
            Credited USDT deposits to user wallets with filterable date range.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => reportQuery.refetch()}
          disabled={reportQuery.isFetching}
        >
          Refresh
        </Button>
      </header>

      <div className="rounded-2xl border bg-background p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            placeholder="From (YYYY-MM-DD)"
          />
          <Input
            value={to}
            onChange={(event) => setTo(event.target.value)}
            placeholder="To (YYYY-MM-DD)"
          />
          <Input
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="Filter by userId"
          />
          <div className="flex items-center gap-2">
            <Button type="button" onClick={applyFilters}>
              Apply
            </Button>
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Total Credited Amount</p>
          <p className="mt-2 text-xl font-semibold">
            {formatUsd(summary?.totalAmount ?? "0")}
          </p>
        </article>
        <article className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Total Credit Transactions</p>
          <p className="mt-2 text-xl font-semibold">
            {(summary?.totalCount ?? 0).toLocaleString("en-US")}
          </p>
        </article>
        <article className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Period</p>
          <p className="mt-2 text-sm font-medium text-muted-foreground">{periodLabel}</p>
        </article>
      </div>

      <div className="rounded-2xl border bg-background shadow-sm">
        <Table className="min-w-[1300px] text-sm">
          <TableHeader className="bg-muted/40 text-left text-xs text-muted-foreground">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 py-3 font-medium">Credited At</TableHead>
              <TableHead className="px-4 py-3 font-medium">User</TableHead>
              <TableHead className="px-4 py-3 font-medium">Amount (USDT)</TableHead>
              <TableHead className="px-4 py-3 font-medium">Tx Hash</TableHead>
              <TableHead className="px-4 py-3 font-medium">From</TableHead>
              <TableHead className="px-4 py-3 font-medium">To</TableHead>
              <TableHead className="px-4 py-3 font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportQuery.isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="px-4 py-4" colSpan={7}>
                    <div className="h-5 w-full animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : reportQuery.isError ? (
              <TableRow>
                <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={7}>
                  Failed to load deposit credits report.
                </TableCell>
              </TableRow>
            ) : (reportQuery.data?.items.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={7}>
                  No credited deposits found.
                </TableCell>
              </TableRow>
            ) : (
              reportQuery.data?.items.map((item: AdminDepositCreditItem) => (
                <TableRow key={item.id}>
                  <TableCell className="px-4 py-4 text-muted-foreground">
                    {item.creditedAt ? formatDateTime(item.creditedAt) : formatDateTime(item.detectedAt)}
                  </TableCell>
                  <TableCell className="px-4 py-4">{item.userLabel}</TableCell>
                  <TableCell className="px-4 py-4 font-medium">{formatUsd(item.amount)}</TableCell>
                  <TableCell className="px-4 py-4 font-mono text-xs text-muted-foreground">
                    {item.txHash ? shortHash(item.txHash, 12, 8) : "-"}
                  </TableCell>
                  <TableCell className="px-4 py-4 font-mono text-xs text-muted-foreground">
                    {item.fromAddress ? shortHash(item.fromAddress, 10, 6) : "-"}
                  </TableCell>
                  <TableCell className="px-4 py-4 font-mono text-xs text-muted-foreground">
                    {item.toAddress ? shortHash(item.toAddress, 10, 6) : "-"}
                  </TableCell>
                  <TableCell className="px-4 py-4">{item.status}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between rounded-2xl border bg-background p-4 text-sm shadow-sm">
        <p className="text-muted-foreground">
          {(reportQuery.data?.total ?? 0).toLocaleString("en-US")} total credited deposits
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || reportQuery.isFetching}
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
            disabled={page >= totalPages || reportQuery.isFetching}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { listSweepLogs, type AdminSweepLog } from "@/lib/admin-api";
import { formatDateTime, formatUsd, shortHash } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

const PAGE_SIZE = 12;

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

export function ErrorLogsPage() {
  const [page, setPage] = React.useState(1);

  const sweepErrorLogsQuery = useQuery({
    queryKey: ["admin", "logs", "sweep-errors", { page }],
    queryFn: () =>
      listSweepLogs({
        page,
        limit: PAGE_SIZE,
        status: "FAILED",
        network: "BSC"
      })
  });

  const total = sweepErrorLogsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Error Logs</h1>
          <p className="text-sm text-muted-foreground">
            Failed sweep operations and related error details.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => sweepErrorLogsQuery.refetch()}
          disabled={sweepErrorLogsQuery.isFetching}
        >
          Refresh errors
        </Button>
      </header>

      <div className="rounded-2xl border bg-background shadow-sm">
        <Table className="min-w-[1220px] text-sm">
          <TableHeader className="bg-muted/40 text-left text-xs text-muted-foreground">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 py-3 font-medium">Created</TableHead>
              <TableHead className="px-4 py-3 font-medium">Status</TableHead>
              <TableHead className="px-4 py-3 font-medium">User</TableHead>
              <TableHead className="px-4 py-3 font-medium">Amount</TableHead>
              <TableHead className="px-4 py-3 font-medium">From</TableHead>
              <TableHead className="px-4 py-3 font-medium">To</TableHead>
              <TableHead className="px-4 py-3 font-medium">Error</TableHead>
              <TableHead className="px-4 py-3 font-medium">Tx hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sweepErrorLogsQuery.isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="px-4 py-4" colSpan={8}>
                    <div className="h-5 w-full animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : sweepErrorLogsQuery.isError ? (
              <TableRow>
                <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={8}>
                  Failed to load error logs.
                </TableCell>
              </TableRow>
            ) : (sweepErrorLogsQuery.data?.items.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={8}>
                  No error logs found.
                </TableCell>
              </TableRow>
            ) : (
              sweepErrorLogsQuery.data?.items.map((item: AdminSweepLog) => (
                <TableRow key={item.id}>
                  <TableCell className="px-4 py-4 text-muted-foreground">{formatDateTime(item.createdAt)}</TableCell>
                  <TableCell className="px-4 py-4">
                    <Badge variant="danger">{item.status}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">{item.userLabel}</TableCell>
                  <TableCell className="px-4 py-4">{formatUsd(item.amount)}</TableCell>
                  <TableCell className="px-4 py-4 font-mono text-xs text-muted-foreground">
                    {shortHash(item.fromAddress, 10, 6)}
                  </TableCell>
                  <TableCell className="px-4 py-4 font-mono text-xs text-muted-foreground">
                    {shortHash(item.toAddress, 10, 6)}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-rose-700 dark:text-rose-300">
                    {item.errorMessage ?? "-"}
                  </TableCell>
                  <TableCell className="px-4 py-4 font-mono text-xs text-muted-foreground">
                    {item.txHash ? shortHash(item.txHash, 10, 6) : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between rounded-2xl border bg-background p-4 text-sm shadow-sm">
        <p className="text-muted-foreground">{formatCount(total)} total error logs</p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || sweepErrorLogsQuery.isFetching}
          >
            Previous
          </Button>
          <span className="px-2 text-muted-foreground">Page {page} of {totalPages}</span>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages || sweepErrorLogsQuery.isFetching}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

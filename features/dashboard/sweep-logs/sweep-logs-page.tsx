"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { listSweepLogs, type AdminSweepLog } from "@/lib/admin-api";
import { formatDateTime, shortHash } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const PAGE_SIZE = 6;

function sweepStatusVariant(status: string) {
  if (status === "SUCCESS") return "success" as const;
  if (status === "FAILED") return "danger" as const;
  if (status === "TRANSFERRING") return "warning" as const;
  return "muted" as const;
}

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

export function SweepLogsPage() {
  const [page, setPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState("all");

  React.useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const sweepLogsQuery = useQuery({
    queryKey: ["admin", "logs", "sweep", { page, statusFilter }],
    queryFn: () =>
      listSweepLogs({
        page,
        limit: PAGE_SIZE,
        status: statusFilter === "all" ? undefined : statusFilter,
        network: "BSC"
      })
  });

  const total = sweepLogsQuery.data?.total ?? 0;
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
          <h1 className="text-xl font-semibold tracking-tight">Sweep Logs</h1>
          <p className="text-sm text-muted-foreground">
            Transfer and gas-topup activity for sweep operations.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="TRANSFERRING">TRANSFERRING</SelectItem>
              <SelectItem value="SUCCESS">SUCCESS</SelectItem>
              <SelectItem value="FAILED">FAILED</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            onClick={() => sweepLogsQuery.refetch()}
            disabled={sweepLogsQuery.isFetching}
          >
            Refresh
          </Button>
        </div>
      </header>

      <div className="rounded-2xl border bg-background shadow-sm">
        <Table className="min-w-[1320px] text-sm">
          <TableHeader className="bg-muted/40 text-left text-xs text-muted-foreground">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 py-3 font-medium">Created</TableHead>
              <TableHead className="px-4 py-3 font-medium">Status</TableHead>
              <TableHead className="px-4 py-3 font-medium">User</TableHead>
              <TableHead className="px-4 py-3 font-medium">Amount</TableHead>
              <TableHead className="px-4 py-3 font-medium">From</TableHead>
              <TableHead className="px-4 py-3 font-medium">To</TableHead>
              <TableHead className="px-4 py-3 font-medium">Tx Hash</TableHead>
              <TableHead className="px-4 py-3 font-medium">Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sweepLogsQuery.isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="px-4 py-4" colSpan={8}>
                    <div className="h-5 w-full animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : sweepLogsQuery.isError ? (
              <TableRow>
                <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={8}>
                  Failed to load sweep logs.
                </TableCell>
              </TableRow>
            ) : (sweepLogsQuery.data?.items.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={8}>
                  No sweep logs found.
                </TableCell>
              </TableRow>
            ) : (
              sweepLogsQuery.data?.items.map((item: AdminSweepLog) => (
                <TableRow key={item.id}>
                  <TableCell className="px-4 py-4 text-muted-foreground">{formatDateTime(item.createdAt)}</TableCell>
                  <TableCell className="px-4 py-4">
                    <Badge variant={sweepStatusVariant(item.status)}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">{item.userLabel}</TableCell>
                  <TableCell className="px-4 py-4">{item.amount}</TableCell>
                  <TableCell className="px-4 py-4 font-mono text-xs text-muted-foreground">
                    {shortHash(item.fromAddress, 10, 6)}
                  </TableCell>
                  <TableCell className="px-4 py-4 font-mono text-xs text-muted-foreground">
                    {shortHash(item.toAddress, 10, 6)}
                  </TableCell>
                  <TableCell className="px-4 py-4 font-mono text-xs text-muted-foreground">
                    {item.txHash ? shortHash(item.txHash, 10, 6) : "-"}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-xs text-muted-foreground">{item.errorMessage ?? "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between rounded-2xl border bg-background p-4 text-sm shadow-sm">
        <p className="text-muted-foreground">{formatCount(total)} total sweep logs</p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || sweepLogsQuery.isFetching}
          >
            Previous
          </Button>
          <span className="px-2 text-muted-foreground">Page {page} of {totalPages}</span>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages || sweepLogsQuery.isFetching}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

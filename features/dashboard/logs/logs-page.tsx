"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { listDepositScanLogs, type AdminDepositScanLog } from "@/lib/admin-api";
import { formatDateTime } from "@/lib/formatters";
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

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

export function LogsPage() {
  const [depositPage, setDepositPage] = React.useState(1);
  const [depositReasonFilter, setDepositReasonFilter] = React.useState("all");

  React.useEffect(() => {
    setDepositPage(1);
  }, [depositReasonFilter]);

  const depositLogsQuery = useQuery({
    queryKey: ["admin", "logs", "deposit-scan", { depositPage, depositReasonFilter }],
    queryFn: () =>
      listDepositScanLogs({
        page: depositPage,
        limit: PAGE_SIZE,
        reason: depositReasonFilter === "all" ? undefined : depositReasonFilter,
        network: "BSC"
      })
  });

  const depositTotal = depositLogsQuery.data?.total ?? 0;
  const depositTotalPages = Math.max(1, Math.ceil(depositTotal / PAGE_SIZE));
  React.useEffect(() => {
    if (depositPage > depositTotalPages) {
      setDepositPage(depositTotalPages);
    }
  }, [depositPage, depositTotalPages]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Logs</h1>
          <p className="text-sm text-muted-foreground">
            Scanner windows, detected credits, and scanned block totals.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={depositReasonFilter} onValueChange={setDepositReasonFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All reasons" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All reasons</SelectItem>
              <SelectItem value="SCAN_COMPLETE">SCAN_COMPLETE</SelectItem>
              <SelectItem value="UP_TO_DATE">UP_TO_DATE</SelectItem>
              <SelectItem value="NO_DEPOSIT_ADDRESSES">NO_DEPOSIT_ADDRESSES</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            onClick={() => depositLogsQuery.refetch()}
            disabled={depositLogsQuery.isFetching}
          >
            Refresh scans
          </Button>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Deposit Scan Logs</h2>
        <div className="rounded-2xl border bg-background shadow-sm">
          <Table className="min-w-[1220px] text-sm">
            <TableHeader className="bg-muted/40 text-left text-xs text-muted-foreground">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-3 font-medium">Created</TableHead>
                <TableHead className="px-4 py-3 font-medium">Reason</TableHead>
                <TableHead className="px-4 py-3 font-medium">Range</TableHead>
                <TableHead className="px-4 py-3 font-medium">Scanned Blocks</TableHead>
                <TableHead className="px-4 py-3 font-medium">Detected</TableHead>
                <TableHead className="px-4 py-3 font-medium">Credited</TableHead>
                <TableHead className="px-4 py-3 font-medium">Reorg</TableHead>
                <TableHead className="px-4 py-3 font-medium">ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {depositLogsQuery.isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="px-4 py-4" colSpan={8}>
                      <div className="h-5 w-full animate-pulse rounded bg-muted" />
                    </TableCell>
                  </TableRow>
                ))
              ) : depositLogsQuery.isError ? (
                <TableRow>
                  <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={8}>
                    Failed to load deposit scan logs.
                  </TableCell>
                </TableRow>
              ) : (depositLogsQuery.data?.items.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={8}>
                    No deposit scan logs found.
                  </TableCell>
                </TableRow>
              ) : (
                depositLogsQuery.data?.items.map((item: AdminDepositScanLog) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-4 py-4 text-muted-foreground">{formatDateTime(item.createdAt)}</TableCell>
                    <TableCell className="px-4 py-4">
                      <Badge variant="outline">{item.reason}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-4 font-mono text-xs text-muted-foreground">
                      {formatCount(item.fromBlock)} - {formatCount(item.toBlock)}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="leading-tight">
                        <p className="font-medium text-foreground">{formatCount(item.scannedBlocks)}</p>
                        <p className="text-xs text-muted-foreground">
                          Planned: {formatCount(item.plannedScanBlocks)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">{formatCount(item.detected)}</TableCell>
                    <TableCell className="px-4 py-4">{formatCount(item.credited)}</TableCell>
                    <TableCell className="px-4 py-4">{item.reorgDetected ? "Yes" : "No"}</TableCell>
                    <TableCell className="px-4 py-4 font-mono text-xs text-muted-foreground">{item.id}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between rounded-2xl border bg-background p-4 text-sm shadow-sm">
          <p className="text-muted-foreground">{formatCount(depositTotal)} total scan logs</p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDepositPage((current) => Math.max(1, current - 1))}
              disabled={depositPage <= 1 || depositLogsQuery.isFetching}
            >
              Previous
            </Button>
            <span className="px-2 text-muted-foreground">Page {depositPage} of {depositTotalPages}</span>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDepositPage((current) => Math.min(depositTotalPages, current + 1))}
              disabled={depositPage >= depositTotalPages || depositLogsQuery.isFetching}
            >
              Next
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

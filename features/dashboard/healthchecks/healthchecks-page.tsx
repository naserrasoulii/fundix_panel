"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { listHealthchecks, type AdminHealthcheck } from "@/lib/admin-api";
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

function statusVariant(status: string) {
  if (status === "READY") {
    return "success" as const;
  }
  if (status === "NOT_READY") {
    return "danger" as const;
  }
  return "muted" as const;
}

function boolVariant(value: boolean) {
  return value ? "success" : "danger";
}

export function HealthchecksPage() {
  const [page, setPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [sourceFilter, setSourceFilter] = React.useState<string>("all");

  React.useEffect(() => {
    setPage(1);
  }, [statusFilter, sourceFilter]);

  const query = useQuery({
    queryKey: ["admin", "healthchecks", { page, statusFilter, sourceFilter }],
    queryFn: () =>
      listHealthchecks({
        page,
        limit: PAGE_SIZE,
        status: statusFilter === "all" ? undefined : statusFilter,
        source: sourceFilter === "all" ? undefined : sourceFilter
      })
  });

  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Healthchecks</h1>
          <p className="text-sm text-muted-foreground">
            Monitor `dbUp`, email readiness, and runtime source for every healthcheck run.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="READY">READY</SelectItem>
              <SelectItem value="NOT_READY">NOT_READY</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="api">api</SelectItem>
              <SelectItem value="cron">cron</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
          >
            Refresh
          </Button>
        </div>
      </header>

      <div className="rounded-2xl border bg-background shadow-sm">
        <Table className="min-w-[1020px] text-sm">
          <TableHeader className="bg-muted/40 text-left text-xs text-muted-foreground">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 py-3 font-medium">Time</TableHead>
              <TableHead className="px-4 py-3 font-medium">Status</TableHead>
              <TableHead className="px-4 py-3 font-medium">DB</TableHead>
              <TableHead className="px-4 py-3 font-medium">Email</TableHead>
              <TableHead className="px-4 py-3 font-medium">Source</TableHead>
              <TableHead className="px-4 py-3 font-medium">Error</TableHead>
              <TableHead className="px-4 py-3 font-medium">ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="px-4 py-4" colSpan={7}>
                    <div className="h-5 w-full animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : query.isError ? (
              <TableRow>
                <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={7}>
                  Failed to load healthchecks.
                </TableCell>
              </TableRow>
            ) : (query.data?.items.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={7}>
                  No healthchecks found.
                </TableCell>
              </TableRow>
            ) : (
              query.data?.items.map((item: AdminHealthcheck) => (
                <TableRow key={item.id}>
                  <TableCell className="px-4 py-4 text-muted-foreground">
                    {formatDateTime(item.createdAt)}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Badge variant={boolVariant(item.dbUp)}>{item.dbUp ? "UP" : "DOWN"}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Badge variant={boolVariant(item.emailReady)}>
                      {item.emailReady ? "UP" : "DOWN"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">{item.source ?? "-"}</TableCell>
                  <TableCell className="px-4 py-4 text-xs text-muted-foreground">
                    {item.errorMessage ?? "-"}
                  </TableCell>
                  <TableCell className="px-4 py-4 font-mono text-xs text-muted-foreground">{item.id}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-background p-4 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          Showing {rangeStart}-{rangeEnd} of {total} healthchecks
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || query.isFetching}
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
            disabled={page >= totalPages || query.isFetching}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

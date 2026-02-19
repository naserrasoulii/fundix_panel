"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { listAuditLogs, type AdminAuditLog } from "@/lib/admin-api";
import { formatDateTime } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
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

function stringifyMetadata(metadata: Record<string, unknown> | null) {
  if (!metadata) {
    return "-";
  }

  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return "-";
  }
}

export function AdminActivityLogsPage() {
  const [page, setPage] = React.useState(1);
  const [selectedItem, setSelectedItem] = React.useState<AdminAuditLog | null>(null);

  const auditLogsQuery = useQuery({
    queryKey: ["admin", "logs", "audit", { page }],
    queryFn: () =>
      listAuditLogs({
        page,
        limit: PAGE_SIZE
      })
  });

  const total = auditLogsQuery.data?.total ?? 0;
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
          <h1 className="text-xl font-semibold tracking-tight">Admin Activity Logs</h1>
          <p className="text-sm text-muted-foreground">
            All admin actions including approvals, rejections, and entity updates.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => auditLogsQuery.refetch()}
          disabled={auditLogsQuery.isFetching}
        >
          Refresh activity
        </Button>
      </header>

      <div className="rounded-2xl border bg-background shadow-sm">
        <Table className="min-w-[920px] text-sm">
          <TableHeader className="bg-muted/40 text-left text-xs text-muted-foreground">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 py-3 font-medium">Created</TableHead>
              <TableHead className="px-4 py-3 font-medium">Admin</TableHead>
              <TableHead className="px-4 py-3 font-medium">Action</TableHead>
              <TableHead className="px-4 py-3 font-medium">Target</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogsQuery.isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="px-4 py-4" colSpan={5}>
                    <div className="h-5 w-full animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : auditLogsQuery.isError ? (
              <TableRow>
                <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={5}>
                  Failed to load admin activity logs.
                </TableCell>
              </TableRow>
            ) : (auditLogsQuery.data?.items.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={5}>
                  No admin activity logs found.
                </TableCell>
              </TableRow>
            ) : (
              auditLogsQuery.data?.items.map((item: AdminAuditLog) => (
                <TableRow key={item.id}>
                  <TableCell className="px-4 py-4 text-muted-foreground">{formatDateTime(item.createdAt)}</TableCell>
                  <TableCell className="px-4 py-4">{item.actorLabel}</TableCell>
                  <TableCell className="px-4 py-4">
                    <Badge variant="outline">{item.action}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">{item.targetLabel ?? "-"}</TableCell>
                  <TableCell className="px-4 py-4 text-right">
                    <Button type="button" size="sm" variant="outline" onClick={() => setSelectedItem(item)}>
                      View detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between rounded-2xl border bg-background p-4 text-sm shadow-sm">
        <p className="text-muted-foreground">{formatCount(total)} total activity logs</p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || auditLogsQuery.isFetching}
          >
            Previous
          </Button>
          <span className="px-2 text-muted-foreground">Page {page} of {totalPages}</span>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages || auditLogsQuery.isFetching}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog
        open={Boolean(selectedItem)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedItem(null);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Activity detail</DialogTitle>
            <DialogDescription>
              Full metadata and audit context for the selected admin action.
            </DialogDescription>
          </DialogHeader>

          {selectedItem ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDateTime(selectedItem.createdAt)}</p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Action</p>
                  <div className="mt-1">
                    <Badge variant="outline">{selectedItem.action}</Badge>
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Admin</p>
                  <p className="font-medium">{selectedItem.actorLabel}</p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="font-medium">{selectedItem.targetLabel ?? "-"}</p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Entity type</p>
                  <p className="font-medium">{selectedItem.entityType ?? "-"}</p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Entity ID</p>
                  <p className="break-all font-mono text-xs">{selectedItem.entityId ?? "-"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Metadata JSON</p>
                <pre className="max-h-[360px] overflow-auto rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed">
                  {stringifyMetadata(selectedItem.metadata)}
                </pre>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

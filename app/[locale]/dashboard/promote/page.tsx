"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { listPromotions, type AdminPromotion } from "@/lib/admin-api";
import { formatDateTime, formatUsd } from "@/lib/formatters";
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

function statusVariant(status: AdminPromotion["status"]) {
  switch (status) {
    case "active":
      return "success";
    case "scheduled":
      return "warning";
    case "ended":
      return "muted";
    default:
      return "muted";
  }
}

export default function PromotePage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState<AdminPromotion["status"] | "all">("all");

  React.useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const promotionsQuery = useQuery({
    queryKey: ["admin", "promotions", { page, statusFilter }],
    queryFn: () =>
      listPromotions({
        page,
        limit: PAGE_SIZE,
        status: statusFilter
      })
  });

  const total = promotionsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const filtered = React.useMemo(() => {
    const promotions = promotionsQuery.data?.items ?? [];
    const q = search.trim().toLowerCase();

    return promotions.filter((promo) => {
      if (statusFilter !== "all" && promo.status !== statusFilter) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        promo.id.toLowerCase().includes(q) ||
        promo.title.toLowerCase().includes(q) ||
        promo.status.toLowerCase().includes(q)
      );
    });
  }, [promotionsQuery.data?.items, search, statusFilter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Promotions</h1>
          <p className="text-sm text-muted-foreground">
            Review and monitor referral promotion campaigns.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="text-xs text-muted-foreground">Data source: API</div>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by id, title, status..."
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
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            onClick={() => promotionsQuery.refetch()}
            disabled={promotionsQuery.isFetching}
          >
            Refresh
          </Button>
          <Button asChild>
            <Link href={`/${locale}/dashboard/promote/create`}>Create promotion</Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-3 lg:hidden">
        {promotionsQuery.isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-4 rounded-2xl border bg-background p-4 shadow-sm">
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-20 animate-pulse rounded-full bg-muted" />
            </div>
          ))
        ) : promotionsQuery.isError ? (
          <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground shadow-sm">
            Failed to load promotions. Check API connectivity.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground shadow-sm">
            No promotions found.
          </div>
        ) : (
          filtered.map((promo) => (
            <div key={promo.id} className="rounded-2xl border bg-background p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{promo.title}</p>
                  <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{promo.id}</p>
                </div>
                <Badge variant={statusVariant(promo.status)} className="capitalize">
                  {promo.status}
                </Badge>
              </div>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Reward</p>
                  <p className="font-medium text-foreground">{formatUsd(promo.rewardAmountUsd)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Min referrals</p>
                  <p className="font-medium text-foreground">{promo.minDirectReferrals}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Starts</p>
                  <p className="text-muted-foreground">{formatDateTime(promo.startAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ends</p>
                  <p className="text-muted-foreground">
                    {promo.endAt ? formatDateTime(promo.endAt) : "No end date"}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden rounded-2xl border bg-background shadow-sm lg:block">
        <Table className="min-w-[1100px] text-sm">
          <TableHeader className="bg-muted/40 text-left text-xs text-muted-foreground">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 py-3 font-medium">Promotion</TableHead>
              <TableHead className="px-4 py-3 font-medium">Status</TableHead>
              <TableHead className="px-4 py-3 font-medium">Reward</TableHead>
              <TableHead className="px-4 py-3 font-medium">Min referrals</TableHead>
              <TableHead className="px-4 py-3 font-medium">Min deposit</TableHead>
              <TableHead className="px-4 py-3 font-medium">Starts</TableHead>
              <TableHead className="px-4 py-3 font-medium">Ends</TableHead>
              <TableHead className="px-4 py-3 font-medium">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotionsQuery.isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="px-4 py-4" colSpan={8}>
                    <div className="h-5 w-full animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : promotionsQuery.isError ? (
              <TableRow>
                <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={8}>
                  Failed to load promotions. Check API connectivity.
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={8}>
                  No promotions found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell className="px-4 py-4">
                    <p className="font-medium text-foreground">{promo.title}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{promo.id}</p>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Badge variant={statusVariant(promo.status)} className="capitalize">
                      {promo.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 font-medium">
                    {formatUsd(promo.rewardAmountUsd)}
                  </TableCell>
                  <TableCell className="px-4 py-4">{promo.minDirectReferrals}</TableCell>
                  <TableCell className="px-4 py-4">{formatUsd(promo.minReferralDepositUsd)}</TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">
                    {formatDateTime(promo.startAt)}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">
                    {promo.endAt ? formatDateTime(promo.endAt) : "No end date"}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">
                    {formatDateTime(promo.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-background p-4 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          Showing {rangeStart}-{rangeEnd} of {total} promotions
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || promotionsQuery.isFetching}
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
            disabled={page >= totalPages || promotionsQuery.isFetching}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

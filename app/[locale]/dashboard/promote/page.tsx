"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { ADMIN_API_MODE, listPromotions, type AdminPromotion } from "@/lib/admin-api";
import { formatDateTime, formatUsd } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
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

function statusVariant(status: AdminPromotion["status"]) {
  switch (status) {
    case "active":
      return "success";
    case "scheduled":
      return "warning";
    case "ended":
      return "muted";
    default:
      return "outline";
  }
}

export default function PromotePage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";

  const [search, setSearch] = React.useState("");

  const promotionsQuery = useQuery({
    queryKey: ["admin", "promotions"],
    queryFn: listPromotions
  });

  const promotions = promotionsQuery.data ?? [];
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return promotions;
    }
    return promotions.filter((promo) => promo.title.toLowerCase().includes(q));
  }, [promotions, search]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Promotions</h1>
          <p className="text-sm text-muted-foreground">
            Define referral promotions and reward rules for user growth.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="text-xs text-muted-foreground">
            Data source: {ADMIN_API_MODE === "mock" ? "Mock" : "API"}
          </div>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search promotions..."
            className="w-full sm:w-72"
          />
          <Button asChild className="gap-2">
            <Link href={`/${locale}/dashboard/promote/create`}>
              <Plus className="h-4 w-4" />
              Create promotion
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-3 lg:hidden">
        {promotionsQuery.isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-4 rounded-2xl border bg-background p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-52 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </div>
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
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{promo.title}</p>
                  {promo.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {promo.description}
                    </p>
                  ) : null}
                </div>
                <Badge variant={statusVariant(promo.status)} className="capitalize">
                  {promo.status}
                </Badge>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Start</p>
                  <p className="text-muted-foreground">{formatDateTime(promo.startAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">End</p>
                  <p className="text-muted-foreground">
                    {promo.endAt ? formatDateTime(promo.endAt) : "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Eligibility</p>
                  <p className="text-foreground">{promo.minDirectReferrals}+ direct referrals</p>
                  <p className="text-xs text-muted-foreground">
                    Min deposit: {formatUsd(promo.minReferralDepositUsd)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Reward</p>
                  <p className="font-medium text-foreground">{formatUsd(promo.rewardAmountUsd)}</p>
                  <p className="text-xs text-muted-foreground">
                    Max grants: {promo.maxGrantsPerUser ? promo.maxGrantsPerUser : "—"}
                  </p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-muted-foreground">{formatDateTime(promo.createdAt)}</p>
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
              <TableHead className="px-4 py-3 font-medium">Title</TableHead>
              <TableHead className="px-4 py-3 font-medium">Status</TableHead>
              <TableHead className="px-4 py-3 font-medium">Start</TableHead>
              <TableHead className="px-4 py-3 font-medium">End</TableHead>
              <TableHead className="px-4 py-3 font-medium">Eligibility</TableHead>
              <TableHead className="px-4 py-3 font-medium">Reward</TableHead>
              <TableHead className="px-4 py-3 font-medium">Max grants</TableHead>
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
                    {promo.description ? (
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {promo.description}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Badge variant={statusVariant(promo.status)} className="capitalize">
                      {promo.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">{formatDateTime(promo.startAt)}</TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">
                    {promo.endAt ? formatDateTime(promo.endAt) : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <p className="text-sm text-foreground">
                      {promo.minDirectReferrals}+ direct referrals
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Min deposit: {formatUsd(promo.minReferralDepositUsd)}
                    </p>
                  </TableCell>
                  <TableCell className="px-4 py-4 font-medium text-foreground">
                    {formatUsd(promo.rewardAmountUsd)}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">
                    {promo.maxGrantsPerUser ? promo.maxGrantsPerUser : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">{formatDateTime(promo.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-2xl border bg-muted/40 p-4 text-sm text-muted-foreground">
        DTO reminder: `CreatePromoDto` expects ISO strings for dates and number-strings for USD fields.
      </div>
    </div>
  );
}

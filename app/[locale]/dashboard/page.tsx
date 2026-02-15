"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  CircleAlert,
  Database,
  Flame,
  Layers3,
  TrendingUp,
  Users,
  Wallet
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getDashboardOverview } from "@/lib/admin-api";
import { formatUsd } from "@/lib/formatters";

type MetricCard = {
  id: string;
  title: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
};

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

function formatTokenBalance(value: string | null, symbol: string) {
  if (!value) {
    return "Not configured";
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return `${value} ${symbol}`;
  }

  const maximumFractionDigits = symbol === "BNB" ? 6 : 2;
  return `${numericValue.toLocaleString("en-US", {
    maximumFractionDigits
  })} ${symbol}`;
}

function shortAddress(value: string | null) {
  if (!value) {
    return "Address not configured";
  }

  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export default function DashboardPage() {
  const overviewQuery = useQuery({
    queryKey: ["admin", "dashboard", "overview"],
    queryFn: getDashboardOverview
  });

  const cards = React.useMemo<MetricCard[]>(() => {
    const overview = overviewQuery.data;
    if (!overview) {
      return [];
    }

    return [
      {
        id: "total-revenue",
        title: "Total Revenue",
        value: formatUsd(overview.totalRevenue),
        detail: "All-time package sales",
        icon: TrendingUp
      },
      {
        id: "paid-user-wallet",
        title: "Paid to User Wallet",
        value: formatUsd(overview.totalPaidToUserWallet),
        detail: "Completed wallet payouts",
        icon: Database
      },
      {
        id: "paid-withdraw",
        title: "Paid Withdrawals",
        value: formatUsd(overview.totalPaidToWithdraw),
        detail: "Completed withdraw payouts",
        icon: ArrowLeftRight
      },
      {
        id: "withdraw-requests",
        title: "Withdraw Requests",
        value: formatCount(overview.withdrawalRequestsCount),
        detail: "Total requests",
        icon: CircleAlert
      },
      {
        id: "hot-wallet",
        title: "Hot Wallet Balance",
        value: formatTokenBalance(overview.hotWallet.balance, overview.hotWallet.asset),
        detail: shortAddress(overview.hotWallet.address),
        icon: Wallet
      },
      {
        id: "gas-wallet",
        title: "Gas Wallet Balance",
        value: formatTokenBalance(overview.gasWallet.balance, overview.gasWallet.asset),
        detail: shortAddress(overview.gasWallet.address),
        icon: Flame
      },
      {
        id: "users-count",
        title: "Users",
        value: formatCount(overview.usersCount),
        detail: "Total non-deleted users",
        icon: Users
      },
      {
        id: "active-packages",
        title: "Active Packages",
        value: formatCount(overview.activePackagesCount),
        detail: "Currently active user packages",
        icon: Layers3
      }
    ];
  }, [overviewQuery.data]);

  const errorMessage =
    overviewQuery.error instanceof Error
      ? overviewQuery.error.message
      : "Failed to load dashboard overview.";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">
            Real-time admin KPIs for revenue, payouts, wallets, users, and active packages.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => overviewQuery.refetch()}
          disabled={overviewQuery.isFetching}
        >
          Refresh
        </Button>
      </header>

      {overviewQuery.isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewQuery.isLoading
          ? Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border bg-background p-5 shadow-sm"
              >
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                <div className="mt-4 h-8 w-40 animate-pulse rounded bg-muted" />
                <div className="mt-3 h-3 w-full animate-pulse rounded bg-muted" />
              </div>
            ))
          : cards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.id} className="rounded-2xl border bg-background p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <div className="rounded-md bg-primary/10 p-2 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                    {card.value}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">{card.detail}</p>
                </article>
              );
            })}
      </section>
    </div>
  );
}

"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
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
import { getBlockchainSummary, getDashboardOverview } from "@/lib/admin-api";
import { formatUsd } from "@/lib/formatters";

type MetricCard = {
  id: string;
  title: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
};

const metricCardClassName =
  "group relative min-h-[172px] overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md";

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

function formatTokenBalance(value: string | null, symbol: string, decimals: number) {
  if (!value) {
    return "Not configured";
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return `${value} ${symbol}`;
  }

  const maximumFractionDigits = Math.min(Math.max(decimals, 0), 6);
  const minimumFractionDigits =
    Math.abs(numericValue) > 0 && Math.abs(numericValue) < 1 ? 2 : 0;
  return `${numericValue.toLocaleString("en-US", {
    minimumFractionDigits,
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

export function DashboardOverviewPage() {
  const overviewQuery = useQuery({
    queryKey: ["admin", "dashboard", "overview"],
    queryFn: getDashboardOverview
  });

  const blockchainQuery = useQuery({
    queryKey: ["admin", "dashboard", "blockchain-summary"],
    queryFn: getBlockchainSummary
  });

  const overviewCards = React.useMemo<MetricCard[]>(() => {
    const overview = overviewQuery.data;
    const result: MetricCard[] = [];

    if (overview) {
      result.push(
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
          detail: "Open requests (pending)",
          icon: CircleAlert
        },
        {
          id: "hot-wallet",
          title: "Hot Wallet Balance",
          value: formatTokenBalance(
            overview.hotWallet.balance,
            overview.hotWallet.asset,
            overview.hotWallet.decimals
          ),
          detail: shortAddress(overview.hotWallet.address),
          icon: Wallet
        },
        {
          id: "gas-wallet",
          title: "Gas Wallet Balance",
          value: formatTokenBalance(
            overview.gasWallet.balance,
            overview.gasWallet.asset,
            overview.gasWallet.decimals
          ),
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
      );
    }

    return result;
  }, [overviewQuery.data]);

  const blockchainCards = React.useMemo<MetricCard[]>(() => {
    const blockchain = blockchainQuery.data;
    const result: MetricCard[] = [];

    if (blockchain) {
      result.push(
        {
          id: "deposits-credited",
          title: "Credited Deposits",
          value: formatUsd(blockchain.deposits.creditedTotal),
          detail: "Total on-chain deposits credited",
          icon: Activity
        },
        {
          id: "deposits-detected",
          title: "Detected Deposits",
          value: formatUsd(blockchain.deposits.detectedTotal),
          detail: "Detected but not yet credited",
          icon: Activity
        },
        {
          id: "sweep-in-progress",
          title: "Sweeps In Progress",
          value: formatCount(blockchain.sweeps.inProgress),
          detail: `Failed: ${formatCount(blockchain.sweeps.failed)}`,
          icon: ArrowLeftRight
        },
        {
          id: "sweep-unswept-wallets",
          title: "Unswept Wallets",
          value: formatCount(blockchain.sweeps.unsweptWallets),
          detail: "Wallets with credited deposits pending sweep",
          icon: Wallet
        }
      );
    }

    return result;
  }, [blockchainQuery.data]);

  const sections = [
    {
      id: "overview",
      title: "Core Metrics",
      description: "Revenue, wallets, user growth, and payout totals.",
      cards: overviewCards,
      isLoading: overviewQuery.isLoading,
      skeletonCount: 8
    },
    {
      id: "blockchain",
      title: "Blockchain Activity",
      description: "Deposit lifecycle and sweeping operations.",
      cards: blockchainCards,
      isLoading: blockchainQuery.isLoading,
      skeletonCount: 4
    }
  ] as const;

  const combinedError = overviewQuery.error ?? blockchainQuery.error;
  const errorMessage =
    combinedError instanceof Error
      ? combinedError.message
      : "Failed to load dashboard overview.";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/80 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time admin KPIs for revenue, payouts, wallets, users, and active packages.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="shrink-0 rounded-xl"
          onClick={() => {
            void Promise.all([overviewQuery.refetch(), blockchainQuery.refetch()]);
          }}
          disabled={overviewQuery.isFetching || blockchainQuery.isFetching}
        >
          Refresh
        </Button>
      </header>

      {overviewQuery.isError || blockchainQuery.isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {sections.map((section) => (
        <section
          key={section.id}
          className="space-y-4 rounded-2xl border border-border/60 bg-background/80 p-4 sm:p-5"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {section.title}
              </p>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </div>
            {!section.isLoading && section.cards.length > 0 ? (
              <p className="text-xs text-muted-foreground">{formatCount(section.cards.length)} metrics</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {section.isLoading ? (
              Array.from({ length: section.skeletonCount }).map((_, index) => (
                <div key={`${section.id}-loading-${index}`} className={metricCardClassName}>
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="mt-4 h-8 w-40 animate-pulse rounded bg-muted" />
                  <div className="mt-3 h-3 w-full animate-pulse rounded bg-muted" />
                </div>
              ))
            ) : section.cards.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed bg-muted/20 p-5 text-sm text-muted-foreground">
                No metrics available for this section.
              </div>
            ) : (
              section.cards.map((card) => {
                const Icon = card.icon;
                return (
                  <article key={card.id} className={metricCardClassName}>
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-primary/10 to-transparent" />
                    <div className="relative">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">{card.title}</p>
                        <div className="rounded-xl bg-primary/10 p-2 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                      <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
                        {card.value}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {card.detail}
                      </p>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

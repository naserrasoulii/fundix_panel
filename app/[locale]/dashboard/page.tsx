import Link from "next/link";
import {
  Activity,
  ArrowLeftRight,
  ArrowUpRight,
  CircleAlert,
  Clock3,
  Database,
  Flame,
  Layers3,
  Megaphone,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "warning";

type SummaryCard = {
  title: string;
  value: string;
  detail: string;
  hint: string;
  icon: LucideIcon;
  tone: Tone;
};

type HealthCard = {
  title: string;
  value: string;
  detail: string;
  progress: number;
  icon: LucideIcon;
  tone: Tone;
};

const toneStyles: Record<Tone, { soft: string; icon: string; bar: string }> = {
  primary: {
    soft: "border-primary/20 bg-primary/5",
    icon: "bg-primary/15 text-primary",
    bar: "bg-primary"
  },
  success: {
    soft: "border-emerald-500/25 bg-emerald-500/10",
    icon: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    bar: "bg-emerald-500"
  },
  warning: {
    soft: "border-amber-500/25 bg-amber-500/10",
    icon: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    bar: "bg-amber-500"
  }
};

const summaryCards: SummaryCard[] = [
  {
    title: "Total Revenue",
    value: "$482,300",
    detail: "Lifetime gross revenue",
    hint: "+12.4% vs last month",
    icon: TrendingUp,
    tone: "primary"
  },
  {
    title: "Total Paid to Users",
    value: "$311,940",
    detail: "All completed payouts",
    hint: "Payout success rate: 98.7%",
    icon: ArrowLeftRight,
    tone: "success"
  },
  {
    title: "Total Users",
    value: "3,481",
    detail: "Registered platform users",
    hint: "+184 this month",
    icon: Users,
    tone: "primary"
  },
  {
    title: "Active Packages",
    value: "14",
    detail: "Currently active plans",
    hint: "2 scheduled this week",
    icon: Layers3,
    tone: "primary"
  },
  {
    title: "Gas Fees Paid",
    value: "$9,870",
    detail: "Total on-chain gas cost",
    hint: "Mainly TRC20 and ERC20",
    icon: Flame,
    tone: "warning"
  },
  {
    title: "Hot Wallet Balance",
    value: "$1.86M",
    detail: "Current hot wallet liquidity",
    hint: "Within configured thresholds",
    icon: Wallet,
    tone: "success"
  }
];

const healthCards: HealthCard[] = [
  {
    title: "Pending Withdrawals",
    value: "9",
    detail: "Needs operator review",
    progress: 62,
    icon: CircleAlert,
    tone: "warning"
  },
  {
    title: "Approvals in 24h",
    value: "42",
    detail: "Manual + automated approvals",
    progress: 84,
    icon: ShieldCheck,
    tone: "success"
  },
  {
    title: "Risk Flags",
    value: "3",
    detail: "Open AML/KYT alerts",
    progress: 36,
    icon: Activity,
    tone: "warning"
  },
  {
    title: "System Uptime",
    value: "99.97%",
    detail: "Last 30 days",
    progress: 99,
    icon: TrendingUp,
    tone: "success"
  }
];

const portfolioRows = [
  {
    name: "USDT withdrawal queue",
    manager: "TRC20",
    allocation: "$42,180",
    eta: "14 min avg",
    status: "Needs review"
  },
  {
    name: "BTC withdrawals",
    manager: "Bitcoin",
    allocation: "0.84 BTC",
    eta: "6 min avg",
    status: "On track"
  },
  {
    name: "ETH withdrawals",
    manager: "Ethereum",
    allocation: "12.3 ETH",
    eta: "11 min avg",
    status: "On track"
  }
];

const hotWalletRows = [
  {
    asset: "USDT",
    network: "TRC20",
    balance: "$1,120,000",
    threshold: "$750,000",
    utilization: 72,
    status: "Healthy"
  },
  {
    asset: "BTC",
    network: "Bitcoin",
    balance: "$412,000",
    threshold: "$250,000",
    utilization: 68,
    status: "Healthy"
  },
  {
    asset: "ETH",
    network: "Ethereum",
    balance: "$328,000",
    threshold: "$200,000",
    utilization: 91,
    status: "Watch"
  }
];

const actionItems = [
  {
    title: "Review large pending withdrawals",
    detail: "3 requests over $10k require manual confirmation",
    eta: "Due in 18 min"
  },
  {
    title: "Rebalance ETH hot wallet",
    detail: "Move buffer from treasury to maintain payout speed",
    eta: "Planned in next cycle"
  },
  {
    title: "Publish new package campaign",
    detail: "Growth team prepared March acquisition copy",
    eta: "Ready to launch"
  }
];

export default async function DashboardPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [featuredCard, ...remainingCards] = summaryCards;

  return (
    <>
      <section className="relative overflow-hidden rounded-3xl border bg-background p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-6 h-52 w-52 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 top-1/4 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              Platform operations are stable
            </p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Fundix Operations Overview
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              A live command center for performance, liquidity, user growth, and
              operational risk signals.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                Uptime 99.97%
              </span>
              <span className="rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                42 approvals in 24h
              </span>
              <span className="rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                3 open risk flags
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="gap-2">
                <Link href={`/${locale}/dashboard/users`}>
                  <Users className="h-4 w-4" />
                  Users
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href={`/${locale}/dashboard/transactions`}>
                  <ArrowLeftRight className="h-4 w-4" />
                  Transactions
                </Link>
              </Button>
              <Button asChild className="gap-2">
                <Link href={`/${locale}/dashboard/withdraws`}>
                  <Wallet className="h-4 w-4" />
                  Withdrawals
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border bg-background/80 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Live Operations Signal</p>
              <Clock3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-4 space-y-4">
              {healthCards.slice(0, 3).map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">{item.title}</p>
                      <span className="text-xs font-medium text-foreground">{item.value}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", toneStyles[item.tone].bar)}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Icon className="h-3 w-3" />
                      {item.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 shadow-sm">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Featured KPI
                </p>
                <h2 className="mt-2 text-sm font-semibold text-foreground">{featuredCard.title}</h2>
              </div>
              <div className={cn("rounded-lg p-2", toneStyles[featuredCard.tone].icon)}>
                <featuredCard.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight">{featuredCard.value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{featuredCard.detail}</p>
            <p className="mt-2 text-xs font-medium text-foreground/80">{featuredCard.hint}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border bg-background/70 p-3">
                <p className="text-xs text-muted-foreground">Net Margin</p>
                <p className="mt-1 text-lg font-semibold">35.3%</p>
              </div>
              <div className="rounded-xl border bg-background/70 p-3">
                <p className="text-xs text-muted-foreground">Monthly Run Rate</p>
                <p className="mt-1 text-lg font-semibold">$142K</p>
              </div>
            </div>
          </div>
        </div>

        {remainingCards.slice(0, 2).map((card) => (
          <div
            key={card.title}
            className={cn(
              "group rounded-2xl border bg-background p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
              toneStyles[card.tone].soft
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <div className={cn("rounded-lg p-1.5", toneStyles[card.tone].icon)}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight">{card.value}</div>
            <p className="mt-2 text-xs text-muted-foreground">{card.detail}</p>
            <p className="mt-1 text-xs font-medium text-foreground/80">{card.hint}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {remainingCards.slice(2).map((card) => (
          <div
            key={card.title}
            className="group rounded-2xl border bg-background p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <div className={cn("rounded-lg p-1.5", toneStyles[card.tone].icon)}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight">{card.value}</div>
            <p className="mt-2 text-xs text-muted-foreground">{card.detail}</p>
            <p className="mt-1 text-xs font-medium text-foreground/80">{card.hint}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {healthCards.map((card) => (
          <div key={card.title} className="rounded-2xl border bg-background p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">{card.title}</p>
              <div className={cn("rounded-md p-1.5", toneStyles[card.tone].icon)}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{card.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", toneStyles[card.tone].bar)}
                style={{ width: `${card.progress}%` }}
              />
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <div className="rounded-2xl border bg-background p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Queues and Monitoring</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/${locale}/dashboard/withdraws`}>View queue</Link>
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {portfolioRows.map((row) => (
              <div
                key={row.name}
                className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">{row.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Manager: {row.manager}
                  </p>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Allocation: {row.allocation}</p>
                  <p>ETA: {row.eta}</p>
                </div>
                <div
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                    row.status === "On track"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {row.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-background p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Hot Wallet Coverage</h2>
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-4 space-y-3">
              {hotWalletRows.map((wallet) => (
                <div
                  key={`${wallet.asset}-${wallet.network}`}
                  className="rounded-xl border bg-muted/40 p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground">
                      {wallet.asset} ({wallet.network})
                    </p>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        wallet.status === "Healthy"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {wallet.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Balance: {wallet.balance}</span>
                    <span>Threshold: {wallet.threshold}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        wallet.status === "Healthy" ? "bg-emerald-500" : "bg-amber-500"
                      )}
                      style={{ width: `${wallet.utilization}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-background p-6 shadow-sm">
            <h2 className="text-sm font-semibold">Priority Actions</h2>
            <div className="mt-4 space-y-3">
              {actionItems.map((item) => (
                <div key={item.title} className="rounded-xl border bg-muted/40 p-3">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-foreground/80">
                    <Clock3 className="h-3 w-3" />
                    {item.eta}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-200">
              <p className="flex items-center gap-2 font-medium">
                <Activity className="h-3.5 w-3.5" />
                Monitor ETH hot wallet closely, balance is near threshold.
              </p>
            </div>
            <Button asChild className="mt-4 w-full gap-2" variant="secondary">
              <Link href={`/${locale}/dashboard/promote`}>
                <Megaphone className="h-4 w-4" />
                Create promotion
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

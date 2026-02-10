"use client";

import { ArrowUpRight, CircleAlert, TrendingUp } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

const summaryCards = [
  {
    title: "Assets under management",
    value: "$4.2B",
    detail: "Updated 2 hours ago"
  },
  {
    title: "Active portfolios",
    value: "128",
    detail: "12 added this quarter"
  },
  {
    title: "Net performance",
    value: "+14.6%",
    detail: "Year to date"
  },
  {
    title: "Risk score",
    value: "Moderate",
    detail: "Aligned with policy"
  }
];

const portfolioRows = [
  {
    name: "Global Growth Fund",
    manager: "Ava Thomson",
    allocation: "$1.1B",
    status: "On track"
  },
  {
    name: "Emerging Markets",
    manager: "Leo Wright",
    allocation: "$620M",
    status: "Rebalance needed"
  },
  {
    name: "Fixed Income Core",
    manager: "Sara Jensen",
    allocation: "$890M",
    status: "On track"
  }
];

export default function DashboardPage({
  params
}: {
  params: { locale: string };
}) {
  return (
    <AppShell locale={params.locale}>
      <section className="relative overflow-hidden rounded-3xl border bg-background p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              Market pulse is stable this week
            </p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Investment dashboard
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              Monitor portfolios, risk exposure, and overall performance from one
              unified and actionable view.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">Download report</Button>
            <Button className="gap-2">
              Connect data source
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className="group rounded-2xl border bg-background p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-sm text-muted-foreground">{card.title}</p>
            <div className="mt-3 text-2xl font-semibold tracking-tight">{card.value}</div>
            <p className="mt-2 text-xs text-muted-foreground">{card.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div id="portfolios" className="rounded-2xl border bg-background p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Portfolio overview</h2>
            <Button variant="ghost" size="sm">
              View all
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
                <div className="text-xs text-muted-foreground">
                  Allocation: {row.allocation}
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

        <div className="rounded-2xl border bg-background p-6 shadow-sm" id="reports">
          <h2 className="text-sm font-semibold">System highlights</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center justify-between">
              <span>Liquidity buffer</span>
              <span className="font-medium text-foreground">18%</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Compliance checks</span>
              <span className="font-medium text-foreground">97%</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Pending approvals</span>
              <span className="font-medium text-foreground">6</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Last rebalance</span>
              <span className="font-medium text-foreground">3 days ago</span>
            </li>
          </ul>
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-200">
            <p className="flex items-center gap-2 font-medium">
              <CircleAlert className="h-3.5 w-3.5" />
              2 portfolios need manual approval.
            </p>
          </div>
          <Button className="mt-4 w-full" variant="secondary">
            Review risks
          </Button>
        </div>
      </section>
    </AppShell>
  );
}

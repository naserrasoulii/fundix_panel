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
      <section className="rounded-2xl border bg-background p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Investment dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Monitor portfolios, risk, and performance in one view.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">Download report</Button>
            <Button>Connect data source</Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.title} className="rounded-2xl border bg-background p-5">
            <p className="text-sm text-muted-foreground">{card.title}</p>
            <div className="mt-3 text-2xl font-semibold">{card.value}</div>
            <p className="mt-2 text-xs text-muted-foreground">{card.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border bg-background p-6">
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
                className="flex flex-col gap-2 rounded-xl border bg-muted/40 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
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
                <div className="text-xs font-medium text-foreground">
                  {row.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-background p-6" id="reports">
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
          <Button className="mt-6 w-full" variant="secondary">
            Review risks
          </Button>
        </div>
      </section>
    </AppShell>
  );
}

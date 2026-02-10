"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Portfolios", href: "/dashboard#portfolios" },
  { label: "Reports", href: "/dashboard#reports" },
  { label: "Settings", href: "/dashboard#settings" }
];

type AppShellProps = {
  locale: string;
  children: React.ReactNode;
};

export function AppShell({ locale, children }: AppShellProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const links = navItems.map((item) => ({
    ...item,
    href: `/${locale}${item.href}`
  }));

  return (
    <div className="relative flex min-h-screen flex-col bg-muted/40">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <Link href={`/${locale}/dashboard`} className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                F
              </div>
              <div>
                <p className="text-sm font-semibold">Fundix Panel</p>
                <p className="text-xs text-muted-foreground">
                  Investment platform base
                </p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground md:flex">
              <Search className="h-3.5 w-3.5" />
              Search funds, clients, reports...
            </div>
            <Button variant="outline" size="icon" className="rounded-full" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="hidden sm:inline-flex">
              Add module
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      <div className="container z-10 flex flex-1 gap-6 py-6">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 -translate-x-full border-r bg-background p-6 transition lg:static lg:w-64 lg:translate-x-0 lg:rounded-2xl lg:border",
            isOpen && "translate-x-0"
          )}
        >
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <p className="text-xs font-medium text-muted-foreground">Navigation</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </div>
          <div className="mb-4 hidden lg:block">
            <p className="text-xs font-medium text-muted-foreground">Navigation</p>
          </div>
          <nav className="space-y-1">
            {links.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-accent hover:text-accent-foreground"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
                <span className="text-xs text-muted-foreground">↗</span>
              </Link>
            ))}
          </nav>
          <div className="mt-6 rounded-xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 text-xs text-muted-foreground">
            Add widgets, analytics, and portfolio modules here as you grow the
            dashboard.
          </div>
        </aside>

        {isOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation"
          />
        ) : null}

        <main className="flex-1 space-y-6 lg:ml-0">{children}</main>
      </div>
    </div>
  );
}

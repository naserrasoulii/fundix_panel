"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Bell,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Search,
  Users,
  Wallet
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/dashboard/users", icon: Users },
  { label: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight },
  { label: "Withdrawals", href: "/dashboard/withdraws", icon: Wallet },
  { label: "Promotions", href: "/dashboard/promote", icon: Megaphone }
];

type AppShellProps = {
  locale: string;
  children: React.ReactNode;
};

export function AppShell({ locale, children }: AppShellProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();

  const links = navItems.map((item) => ({
    ...item,
    href: `/${locale}${item.href}`,
    exact: item.href === "/dashboard"
  }));

  return (
    <div className="relative flex min-h-screen flex-col bg-muted/40">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="xl:hidden"
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
              Search users, tx, withdrawals...
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

      <div className="z-10 flex flex-1 items-start">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 -translate-x-full border-r bg-background p-6 transition xl:inset-y-auto xl:left-auto xl:sticky xl:top-16 xl:h-[calc(100dvh-4rem)] xl:w-64 xl:translate-x-0 xl:rounded-none xl:overflow-y-auto",
            isOpen && "translate-x-0"
          )}
        >
          <div className="mb-4 flex items-center justify-between xl:hidden">
            <p className="text-xs font-medium text-muted-foreground">Navigation</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </div>
          <div className="mb-4 hidden xl:block">
            <p className="text-xs font-medium text-muted-foreground">Navigation</p>
          </div>
          <nav className="space-y-1">
            {links.map((item) => {
              const isActive =
                pathname === item.href ||
                (!item.exact && (pathname?.startsWith(`${item.href}/`) ?? false));

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    <item.icon
                      className={cn(
                        "h-4 w-4",
                        isActive ? "text-accent-foreground" : "text-muted-foreground"
                      )}
                    />
                    {item.label}
                  </span>
                  <span className="text-xs text-muted-foreground">↗</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 rounded-xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 text-xs text-muted-foreground">
            Use this panel to review crypto operations, manage withdrawals, and
            issue user notifications.
          </div>
          <form action="/api/auth/logout" method="post" className="mt-4">
            <input type="hidden" name="locale" value={locale} />
            <Button
              type="submit"
              variant="outline"
              className="w-full justify-between"
            >
              Logout
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </aside>

        {isOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/30 xl:hidden"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation"
          />
          ) : null}

        <main className="min-w-0 flex-1 space-y-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

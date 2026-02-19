"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { createManualDeposit, type AdminManualDepositResult } from "@/lib/admin-api";
import { formatDateTime, formatUsd } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function isPositiveNumberString(value: string) {
  const numeric = Number(value);
  return value.trim().length > 0 && Number.isFinite(numeric) && numeric > 0;
}

export function ManualDepositPage() {
  const params = useParams<{ locale: string; id: string }>();
  const locale = params?.locale ?? "en";
  const userId = params?.id ?? "";
  const queryClient = useQueryClient();

  const [amount, setAmount] = React.useState("");
  const [note, setNote] = React.useState("");
  const [touchedAmount, setTouchedAmount] = React.useState(false);
  const [flash, setFlash] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<AdminManualDepositResult | null>(null);

  const isAmountValid = isPositiveNumberString(amount);

  const depositMutation = useMutation({
    mutationFn: async () =>
      createManualDeposit(userId, {
        amount,
        note,
      }),
    onSuccess: (payload) => {
      setResult(payload);
      setFlash("Manual deposit was recorded successfully.");
      setAmount("");
      setNote("");
      setTouchedAmount(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to create manual deposit.";
      setFlash(message);
    },
  });

  React.useEffect(() => {
    if (!flash) {
      return;
    }
    const timeout = window.setTimeout(() => setFlash(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [flash]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouchedAmount(true);
    if (!isAmountValid || !userId || depositMutation.isPending) {
      return;
    }
    depositMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit gap-2">
          <Link href={`/${locale}/dashboard/users`}>
            <ArrowLeft className="h-4 w-4" />
            Users
          </Link>
        </Button>
        <h1 className="text-xl font-semibold tracking-tight">Manual deposit</h1>
        <p className="text-sm text-muted-foreground">
          Credit user wallet directly without blockchain transaction fields.
        </p>
      </header>

      {flash ? (
        <div className="rounded-2xl border bg-muted/40 p-4 text-sm text-foreground">
          {flash}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={submit} className="space-y-5 rounded-2xl border bg-background p-6 shadow-sm">
          <div className="space-y-1">
            <p className="text-sm font-medium">User ID</p>
            <p className="break-all text-sm text-muted-foreground">{userId || "Unknown user"}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Amount (USDT)</p>
            <Input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              onBlur={() => setTouchedAmount(true)}
              placeholder="100"
              inputMode="decimal"
            />
            {touchedAmount && !isAmountValid ? (
              <p className="text-xs text-rose-600 dark:text-rose-300">
                Amount must be a positive number.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Note (optional)</p>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Manual adjustment for support request"
            />
          </div>

          {depositMutation.isError ? (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-200">
              Failed to submit manual deposit.
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={!isAmountValid || !userId || depositMutation.isPending}>
              {depositMutation.isPending ? "Submitting..." : "Submit manual deposit"}
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href={`/${locale}/dashboard/users`}>Cancel</Link>
            </Button>
          </div>
        </form>

        <div className="space-y-4 rounded-2xl border bg-background p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Last result
          </h2>
          {result ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Credited amount</p>
                <p className="font-medium">{formatUsd(result.amount)}</p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Balance before</p>
                <p className="font-medium">{formatUsd(result.balanceBefore)}</p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Balance after</p>
                <p className="font-medium">{formatUsd(result.balanceAfter)}</p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Transaction ID</p>
                <p className="break-all font-mono text-xs">{result.transactionId || "N/A"}</p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Created at</p>
                <p className="font-medium">{formatDateTime(result.createdAt)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No manual deposit submitted yet in this session.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

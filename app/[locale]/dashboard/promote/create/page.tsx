"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";

import { createPromotion, type CreatePromoDto } from "@/lib/admin-api";
import { formatUsd, toIsoStringFromLocalInput } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type PromoDraft = {
  title: string;
  description: string;
  startAtLocal: string;
  endAtLocal: string;
  minDirectReferrals: string;
  minReferralDepositUsd: string;
  rewardAmountUsd: string;
  maxGrantsPerUser: string;
};

type DraftErrors = Partial<Record<keyof PromoDraft, string>>;

const steps = [
  { key: "details", title: "Details", hint: "Title and schedule" },
  { key: "eligibility", title: "Eligibility", hint: "Referral requirements" },
  { key: "reward", title: "Reward", hint: "Reward and limits" },
  { key: "review", title: "Review", hint: "Confirm and create" }
] as const;

function isValidDateString(value: string) {
  const date = new Date(value);
  return !Number.isNaN(date.valueOf());
}

function isNonNegativeNumberString(value: string) {
  const numberValue = Number(value);
  return value.trim().length > 0 && Number.isFinite(numberValue) && numberValue >= 0;
}

function isNonNegativeIntString(value: string) {
  const numberValue = Number(value);
  return value.trim().length > 0 && Number.isInteger(numberValue) && numberValue >= 0;
}

function isMinIntStringOrEmpty(value: string, min: number) {
  if (!value.trim()) {
    return true;
  }
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue >= min;
}

function validateDraft(draft: PromoDraft) {
  const errors: DraftErrors = {};

  if (!draft.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!draft.startAtLocal.trim() || !isValidDateString(draft.startAtLocal)) {
    errors.startAtLocal = "Start date is required.";
  }

  if (draft.endAtLocal.trim() && !isValidDateString(draft.endAtLocal)) {
    errors.endAtLocal = "End date must be a valid date.";
  }

  if (draft.startAtLocal.trim() && draft.endAtLocal.trim()) {
    const start = new Date(draft.startAtLocal).valueOf();
    const end = new Date(draft.endAtLocal).valueOf();
    if (!Number.isNaN(start) && !Number.isNaN(end) && end < start) {
      errors.endAtLocal = "End date must be after start date.";
    }
  }

  if (!isNonNegativeIntString(draft.minDirectReferrals)) {
    errors.minDirectReferrals = "Must be an integer ≥ 0.";
  }

  if (!isNonNegativeNumberString(draft.minReferralDepositUsd)) {
    errors.minReferralDepositUsd = "Must be a number ≥ 0.";
  }

  if (!isNonNegativeNumberString(draft.rewardAmountUsd)) {
    errors.rewardAmountUsd = "Must be a number ≥ 0.";
  }

  if (!isMinIntStringOrEmpty(draft.maxGrantsPerUser, 1)) {
    errors.maxGrantsPerUser = "If provided, must be an integer ≥ 1.";
  }

  return errors;
}

function stepFieldKeys(stepIndex: number): Array<keyof PromoDraft> {
  if (stepIndex === 0) {
    return ["title", "description", "startAtLocal", "endAtLocal"];
  }
  if (stepIndex === 1) {
    return ["minDirectReferrals", "minReferralDepositUsd"];
  }
  if (stepIndex === 2) {
    return ["rewardAmountUsd", "maxGrantsPerUser"];
  }
  return [
    "title",
    "description",
    "startAtLocal",
    "endAtLocal",
    "minDirectReferrals",
    "minReferralDepositUsd",
    "rewardAmountUsd",
    "maxGrantsPerUser"
  ];
}

function toDto(draft: PromoDraft): CreatePromoDto {
  return {
    title: draft.title.trim(),
    description: draft.description.trim() ? draft.description.trim() : null,
    startAt: toIsoStringFromLocalInput(draft.startAtLocal),
    endAt: draft.endAtLocal.trim() ? toIsoStringFromLocalInput(draft.endAtLocal) : null,
    minDirectReferrals: Number(draft.minDirectReferrals),
    minReferralDepositUsd: draft.minReferralDepositUsd.trim(),
    rewardAmountUsd: draft.rewardAmountUsd.trim(),
    ...(draft.maxGrantsPerUser.trim()
      ? { maxGrantsPerUser: Number(draft.maxGrantsPerUser) }
      : {})
  };
}

export default function PromoteCreatePage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";
  const router = useRouter();
  const queryClient = useQueryClient();

  const [stepIndex, setStepIndex] = React.useState(0);
  const [draft, setDraft] = React.useState<PromoDraft>({
    title: "",
    description: "",
    startAtLocal: "",
    endAtLocal: "",
    minDirectReferrals: "0",
    minReferralDepositUsd: "0",
    rewardAmountUsd: "0",
    maxGrantsPerUser: ""
  });
  const [touched, setTouched] = React.useState<Partial<Record<keyof PromoDraft, boolean>>>(
    {}
  );

  const errors = validateDraft(draft);
  const stepKeys = stepFieldKeys(stepIndex);
  const stepHasErrors = stepKeys.some((key) => Boolean(errors[key]));

  const createMutation = useMutation({
    mutationFn: async () => createPromotion(toDto(draft)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "promotions"] });
      router.push(`/${locale}/dashboard/promote`);
    }
  });

  function nextStep() {
    setTouched((prev) => {
      const next = { ...prev };
      for (const key of stepKeys) {
        next[key] = true;
      }
      return next;
    });

    if (stepHasErrors) {
      return;
    }

    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  }

  function prevStep() {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  }

  const dtoPreview = React.useMemo(() => {
    if (Object.keys(errors).length > 0) {
      return null;
    }
    return toDto(draft);
  }, [draft, errors]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="-ml-2 gap-2">
              <Link href={`/${locale}/dashboard/promote`}>
                <ArrowLeft className="h-4 w-4" />
                Promotions
              </Link>
            </Button>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Create promotion</h1>
          <p className="text-sm text-muted-foreground">
            Configure referral requirements and reward distribution rules.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6 rounded-2xl border bg-background p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {steps.map((step, index) => {
                const active = index === stepIndex;
                const done = index < stepIndex;
                return (
                  <div
                    key={step.key}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                      active
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : done
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "border-border bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <span className="font-semibold">{index + 1}</span>
                    <span className="font-medium">{step.title}</span>
                  </div>
                );
              })}
            </div>
            <Badge variant="outline" className="w-fit">
              Step {stepIndex + 1} of {steps.length}
            </Badge>
          </div>

          {stepIndex === 0 ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm font-medium">Title</p>
                <Input
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, title: event.target.value }))
                  }
                  onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
                  placeholder="Referral Sprint"
                />
                {touched.title && errors.title ? (
                  <p className="text-xs text-rose-600 dark:text-rose-300">{errors.title}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Description (optional)</p>
                <Textarea
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Explain how users qualify and how rewards are granted."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Start at</p>
                  <Input
                    type="datetime-local"
                    value={draft.startAtLocal}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, startAtLocal: event.target.value }))
                    }
                    onBlur={() => setTouched((prev) => ({ ...prev, startAtLocal: true }))}
                  />
                  {touched.startAtLocal && errors.startAtLocal ? (
                    <p className="text-xs text-rose-600 dark:text-rose-300">
                      {errors.startAtLocal}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">End at (optional)</p>
                  <Input
                    type="datetime-local"
                    value={draft.endAtLocal}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, endAtLocal: event.target.value }))
                    }
                    onBlur={() => setTouched((prev) => ({ ...prev, endAtLocal: true }))}
                  />
                  {touched.endAtLocal && errors.endAtLocal ? (
                    <p className="text-xs text-rose-600 dark:text-rose-300">{errors.endAtLocal}</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                Dates are converted to ISO strings before sending to the backend (NestJS `@IsDateString()`).
              </div>
            </div>
          ) : null}

          {stepIndex === 1 ? (
            <div className="space-y-5">
              <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                Define who qualifies to receive the reward.
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Min direct referrals</p>
                  <Input
                    inputMode="numeric"
                    value={draft.minDirectReferrals}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, minDirectReferrals: event.target.value }))
                    }
                    onBlur={() => setTouched((prev) => ({ ...prev, minDirectReferrals: true }))}
                    placeholder="3"
                  />
                  {touched.minDirectReferrals && errors.minDirectReferrals ? (
                    <p className="text-xs text-rose-600 dark:text-rose-300">
                      {errors.minDirectReferrals}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Min referral deposit (USD)</p>
                  <Input
                    inputMode="decimal"
                    value={draft.minReferralDepositUsd}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, minReferralDepositUsd: event.target.value }))
                    }
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, minReferralDepositUsd: true }))
                    }
                    placeholder="50"
                  />
                  {touched.minReferralDepositUsd && errors.minReferralDepositUsd ? (
                    <p className="text-xs text-rose-600 dark:text-rose-300">
                      {errors.minReferralDepositUsd}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    Backend expects a number-string (`@IsNumberString()`).
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {stepIndex === 2 ? (
            <div className="space-y-5">
              <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                Configure the reward and apply safety limits.
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Reward amount (USD)</p>
                  <Input
                    inputMode="decimal"
                    value={draft.rewardAmountUsd}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, rewardAmountUsd: event.target.value }))
                    }
                    onBlur={() => setTouched((prev) => ({ ...prev, rewardAmountUsd: true }))}
                    placeholder="10"
                  />
                  {touched.rewardAmountUsd && errors.rewardAmountUsd ? (
                    <p className="text-xs text-rose-600 dark:text-rose-300">
                      {errors.rewardAmountUsd}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Max grants per user (optional)</p>
                  <Input
                    inputMode="numeric"
                    value={draft.maxGrantsPerUser}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, maxGrantsPerUser: event.target.value }))
                    }
                    onBlur={() => setTouched((prev) => ({ ...prev, maxGrantsPerUser: true }))}
                    placeholder="3"
                  />
                  {touched.maxGrantsPerUser && errors.maxGrantsPerUser ? (
                    <p className="text-xs text-rose-600 dark:text-rose-300">
                      {errors.maxGrantsPerUser}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">Leave empty for unlimited grants.</p>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-200">
                <div className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="h-4 w-4" />
                  Tip: Set a cap to reduce abuse and simplify auditing.
                </div>
              </div>
            </div>
          ) : null}

          {stepIndex === 3 ? (
            <div className="space-y-5">
              <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                Review the final payload that will be sent to the backend.
              </div>

              {dtoPreview ? (
                <div className="rounded-2xl border bg-background p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{dtoPreview.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Starts: {dtoPreview.startAt}
                        {dtoPreview.endAt ? ` • Ends: ${dtoPreview.endAt}` : ""}
                      </p>
                    </div>
                    <Badge variant="outline">CreatePromoDto</Badge>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border bg-muted/40 p-4 text-sm">
                      <p className="text-xs text-muted-foreground">Eligibility</p>
                      <p className="mt-2 font-medium text-foreground">
                        {dtoPreview.minDirectReferrals}+ referrals
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Min deposit: {formatUsd(dtoPreview.minReferralDepositUsd)}
                      </p>
                    </div>
                    <div className="rounded-xl border bg-muted/40 p-4 text-sm">
                      <p className="text-xs text-muted-foreground">Reward</p>
                      <p className="mt-2 font-medium text-foreground">
                        {formatUsd(dtoPreview.rewardAmountUsd)} per grant
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Max grants:{" "}
                        {dtoPreview.maxGrantsPerUser ? dtoPreview.maxGrantsPerUser : "Unlimited"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-200">
                  Fix the form errors before creating the promotion.
                </div>
              )}

              {createMutation.isError ? (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-200">
                  Failed to create promotion. Verify API endpoints and try again.
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={prevStep} disabled={stepIndex === 0}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {stepIndex < steps.length - 1 ? (
              <Button type="button" onClick={nextStep} disabled={createMutation.isPending}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || Object.keys(errors).length > 0}
              >
                {createMutation.isPending ? "Creating..." : "Create promotion"}
              </Button>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border bg-background p-6 shadow-sm">
            <h2 className="text-sm font-semibold">Live preview</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This is how the promotion will appear in the admin listing.
            </p>

            <div className="mt-4 rounded-2xl border bg-muted/40 p-5">
              <p className="text-sm font-semibold text-foreground">
                {draft.title.trim() ? draft.title.trim() : "Untitled promotion"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {draft.startAtLocal ? `Starts: ${draft.startAtLocal}` : "Start date required"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline">
                  {isNonNegativeIntString(draft.minDirectReferrals)
                    ? `${draft.minDirectReferrals}+ referrals`
                    : "Referrals"}
                </Badge>
                <Badge variant="outline">
                  {isNonNegativeNumberString(draft.minReferralDepositUsd)
                    ? `Min deposit ${formatUsd(draft.minReferralDepositUsd)}`
                    : "Min deposit"}
                </Badge>
                <Badge variant="outline">
                  {isNonNegativeNumberString(draft.rewardAmountUsd)
                    ? `Reward ${formatUsd(draft.rewardAmountUsd)}`
                    : "Reward"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-muted/40 p-6 text-sm text-muted-foreground">
            Endpoint assumptions: this UI calls `POST /admin/promotions` to create, and `GET /admin/promotions`
            for listing. Adjust in `lib/admin-api.ts` if your backend routes differ.
          </div>
        </aside>
      </div>
    </div>
  );
}

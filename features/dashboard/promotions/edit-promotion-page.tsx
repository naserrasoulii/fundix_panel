"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import {
  getPromotion,
  updatePromotion,
  type AdminPromotion,
  type UpdatePromoDto,
} from "@/lib/admin-api";
import {
  formatUsd,
  toIsoStringFromLocalInput,
  toLocalInputFromIsoString,
} from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type PromoDraft = {
  title: string;
  description: string;
  status: AdminPromotion["status"];
  startAtLocal: string;
  endAtLocal: string;
  minDirectReferrals: string;
  minReferralDepositUsd: string;
  rewardAmountUsd: string;
  maxGrantsPerUser: string;
};

type DraftErrors = Partial<Record<keyof PromoDraft, string>>;

const draftKeys: Array<keyof PromoDraft> = [
  "title",
  "description",
  "status",
  "startAtLocal",
  "endAtLocal",
  "minDirectReferrals",
  "minReferralDepositUsd",
  "rewardAmountUsd",
  "maxGrantsPerUser",
];

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

function toDraft(promo: AdminPromotion): PromoDraft {
  return {
    title: promo.title,
    description: promo.description ?? "",
    status: promo.status,
    startAtLocal: toLocalInputFromIsoString(promo.startAt),
    endAtLocal: toLocalInputFromIsoString(promo.endAt ?? null),
    minDirectReferrals: String(promo.minDirectReferrals),
    minReferralDepositUsd: promo.minReferralDepositUsd,
    rewardAmountUsd: promo.rewardAmountUsd,
    maxGrantsPerUser: promo.maxGrantsPerUser?.toString() ?? "",
  };
}

function toDto(draft: PromoDraft): UpdatePromoDto {
  return {
    title: draft.title.trim(),
    description: draft.description.trim() ? draft.description.trim() : null,
    status: draft.status,
    startAt: toIsoStringFromLocalInput(draft.startAtLocal),
    endAt: draft.endAtLocal.trim() ? toIsoStringFromLocalInput(draft.endAtLocal) : null,
    minDirectReferrals: Number(draft.minDirectReferrals),
    minReferralDepositUsd: draft.minReferralDepositUsd.trim(),
    rewardAmountUsd: draft.rewardAmountUsd.trim(),
    ...(draft.maxGrantsPerUser.trim()
      ? { maxGrantsPerUser: Number(draft.maxGrantsPerUser) }
      : {}),
  };
}

export function EditPromotionPage() {
  const params = useParams<{ locale: string; id: string }>();
  const locale = params?.locale ?? "en";
  const promoId = params?.id ?? "";
  const router = useRouter();
  const queryClient = useQueryClient();

  const [draft, setDraft] = React.useState<PromoDraft | null>(null);
  const [touched, setTouched] = React.useState<Partial<Record<keyof PromoDraft, boolean>>>({});
  const initializedPromoId = React.useRef<string | null>(null);
  const [isLocked, setIsLocked] = React.useState(false);

  const promotionQuery = useQuery({
    queryKey: ["admin", "promotions", "detail", promoId],
    queryFn: () => getPromotion(promoId),
    enabled: Boolean(promoId),
  });

  React.useEffect(() => {
    const promotion = promotionQuery.data;
    if (!promotion) {
      return;
    }
    if (initializedPromoId.current === promotion.id) {
      return;
    }

    setDraft(toDraft(promotion));
    initializedPromoId.current = promotion.id;
    setTouched({});
  }, [promotionQuery.data]);

  const errors = React.useMemo(() => (draft ? validateDraft(draft) : {}), [draft]);
  React.useEffect(() => {
    if (!draft) {
      setIsLocked(false);
      return;
    }
    if (draft.status === "ended") {
      setIsLocked(true);
      return;
    }
    if (!draft.endAtLocal.trim()) {
      setIsLocked(false);
      return;
    }
    const endAt = new Date(draft.endAtLocal).valueOf();
    setIsLocked(Number.isFinite(endAt) && Date.now() >= endAt);
  }, [draft]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!draft) {
        throw new Error("Promotion form is not initialized.");
      }
      return updatePromotion(promoId, toDto(draft));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "promotions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "promotions", "detail", promoId] });
      router.push(`/${locale}/dashboard/promote`);
    },
  });

  function setField<Key extends keyof PromoDraft>(key: Key, value: PromoDraft[Key]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function markTouched(key: keyof PromoDraft) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  function submit() {
    if (!draft) {
      return;
    }
    setTouched(
      draftKeys.reduce<Partial<Record<keyof PromoDraft, boolean>>>((acc, key) => {
        acc[key] = true;
        return acc;
      }, {}),
    );

    if (Object.keys(errors).length > 0) {
      return;
    }

    updateMutation.mutate();
  }

  const dtoPreview = React.useMemo(() => {
    if (!draft || Object.keys(errors).length > 0) {
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
          <h1 className="text-xl font-semibold tracking-tight">Edit promotion</h1>
          <p className="text-sm text-muted-foreground">
            Update campaign rules and publish the latest configuration.
          </p>
        </div>
      </header>

      {promotionQuery.isLoading ? (
        <div className="rounded-2xl border bg-background p-6 text-sm text-muted-foreground shadow-sm">
          Loading promotion details...
        </div>
      ) : promotionQuery.isError ? (
        <div className="space-y-4 rounded-2xl border bg-background p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Failed to load promotion. Verify API connectivity and try again.
          </p>
          <Button type="button" variant="outline" onClick={() => promotionQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : !draft ? (
        <div className="rounded-2xl border bg-background p-6 text-sm text-muted-foreground shadow-sm">
          Promotion not found.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6 rounded-2xl border bg-background p-6 shadow-sm">
            <div className="grid gap-5">
              <div className="space-y-4">
                <h2 className="text-sm font-semibold">Details</h2>

              <div className="space-y-2">
                <p className="text-sm font-medium">Title</p>
                <Input
                  value={draft.title}
                  onChange={(event) => setField("title", event.target.value)}
                  onBlur={() => markTouched("title")}
                  placeholder="Referral Sprint"
                  disabled={isLocked}
                />
                  {touched.title && errors.title ? (
                    <p className="text-xs text-rose-600 dark:text-rose-300">{errors.title}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Description (optional)</p>
                <Textarea
                  value={draft.description}
                  onChange={(event) => setField("description", event.target.value)}
                  placeholder="Explain how users qualify and how rewards are granted."
                  disabled={isLocked}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Status</p>
                <Select
                  value={draft.status}
                  onValueChange={(value) => setField("status", value as PromoDraft["status"])}
                  disabled={isLocked}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="deactive">Deactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-sm font-semibold">Schedule</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Start at</p>
                    <Input
                      type="datetime-local"
                      value={draft.startAtLocal}
                      onChange={(event) => setField("startAtLocal", event.target.value)}
                      onBlur={() => markTouched("startAtLocal")}
                      disabled={isLocked}
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
                      onChange={(event) => setField("endAtLocal", event.target.value)}
                      onBlur={() => markTouched("endAtLocal")}
                      disabled={isLocked}
                    />
                    {touched.endAtLocal && errors.endAtLocal ? (
                      <p className="text-xs text-rose-600 dark:text-rose-300">
                        {errors.endAtLocal}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-sm font-semibold">Eligibility & Reward</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Min direct referrals</p>
                    <Input
                      inputMode="numeric"
                      value={draft.minDirectReferrals}
                      onChange={(event) => setField("minDirectReferrals", event.target.value)}
                      onBlur={() => markTouched("minDirectReferrals")}
                      disabled={isLocked}
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
                      onChange={(event) => setField("minReferralDepositUsd", event.target.value)}
                      onBlur={() => markTouched("minReferralDepositUsd")}
                      disabled={isLocked}
                    />
                    {touched.minReferralDepositUsd && errors.minReferralDepositUsd ? (
                      <p className="text-xs text-rose-600 dark:text-rose-300">
                        {errors.minReferralDepositUsd}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Reward amount (USD)</p>
                    <Input
                      inputMode="decimal"
                      value={draft.rewardAmountUsd}
                      onChange={(event) => setField("rewardAmountUsd", event.target.value)}
                      onBlur={() => markTouched("rewardAmountUsd")}
                      disabled={isLocked}
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
                      onChange={(event) => setField("maxGrantsPerUser", event.target.value)}
                      onBlur={() => markTouched("maxGrantsPerUser")}
                      disabled={isLocked}
                    />
                    {touched.maxGrantsPerUser && errors.maxGrantsPerUser ? (
                      <p className="text-xs text-rose-600 dark:text-rose-300">
                        {errors.maxGrantsPerUser}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {updateMutation.isError ? (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-200">
                Failed to update promotion. Verify API endpoints and try again.
              </div>
            ) : null}

            {isLocked ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-200">
                This promotion is ended. Editing and status changes are locked.
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button asChild type="button" variant="outline">
                <Link href={`/${locale}/dashboard/promote`}>Cancel</Link>
              </Button>
              <Button
                type="button"
                onClick={submit}
                disabled={isLocked || updateMutation.isPending || Object.keys(errors).length > 0}
              >
                {updateMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border bg-background p-6 shadow-sm">
              <h2 className="text-sm font-semibold">Live preview</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This is how the updated promotion appears in the listing.
              </p>

              <div className="mt-4 rounded-2xl border bg-muted/40 p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {draft.title.trim() ? draft.title.trim() : "Untitled promotion"}
                  </p>
                  <Badge variant="outline" className="capitalize">
                    {draft.status}
                  </Badge>
                </div>
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
              {dtoPreview ? (
                <p>
                  Payload ready for `PATCH /api/admin/promos/{promoId}`.
                </p>
              ) : (
                <p>Fix validation issues to enable saving.</p>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

import type {
  AdminPromotion,
  AdminTransaction,
  AdminTransactionType,
  AdminUser,
  AdminWithdrawRequest,
  CreatePromoDto,
  CreateUserNotificationPayload,
} from "@/lib/admin-types";

export type {
  AdminPromotion,
  AdminTransaction,
  AdminTransactionStatus,
  AdminTransactionType,
  AdminUser,
  AdminUserRole,
  AdminUserStatus,
  AdminWithdrawRequest,
  CreatePromoDto,
  CreateUserNotificationPayload,
} from "@/lib/admin-types";

export const ADMIN_API_MODE = "api" as const;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type AdminDashboardWalletBalance = {
  address: string | null;
  asset: string;
  balance: string | null;
  rawBalance: string | null;
  decimals: number;
};

export type AdminDashboardOverview = {
  totalRevenue: string;
  totalPaidToUserWallet: string;
  totalPaidToWithdraw: string;
  withdrawalRequestsCount: number;
  hotWallet: AdminDashboardWalletBalance;
  gasWallet: AdminDashboardWalletBalance;
  usersCount: number;
  activePackagesCount: number;
};

type BackendListResponse<T> = {
  total?: number;
  page?: number;
  items?: T[];
};

type BackendDashboardWalletBalance = {
  address?: string | null;
  asset?: string;
  balance?: string | number | null;
  rawBalance?: string | number | null;
  decimals?: number;
};

type BackendDashboardOverviewResponse = {
  totalRevenue?: string | number;
  totalPaidToUserWallet?: string | number;
  totalPaidToWithdraw?: string | number;
  withdrawalRequestsCount?: number;
  hotWallet?: BackendDashboardWalletBalance;
  gasWallet?: BackendDashboardWalletBalance;
  usersCount?: number;
  activePackagesCount?: number;
};

type BackendUserItem = {
  id?: string;
  email?: string;
  username?: string;
  status?: string;
  role?: string;
  createdAt?: string;
};

type BackendTransactionItem = {
  id?: string;
  walletId?: string;
  type?: string;
  status?: string;
  amount?: string | number;
  createdAt?: string;
  wallet?: {
    userId?: string;
    user?: {
      username?: string | null;
      email?: string | null;
    } | null;
  } | null;
};

type BackendWithdrawalItem = {
  id?: string;
  userId?: string;
  amount?: string | number;
  status?: string;
  destinationAddress?: string | null;
  note?: string | null;
  approvedAt?: string | null;
  paidAt?: string | null;
  rejectedAt?: string | null;
  createdAt?: string;
  user?: {
    username?: string | null;
    email?: string | null;
  } | null;
};

type BackendPromotionItem = {
  id?: string;
  title?: string;
  description?: string | null;
  startAt?: string;
  endAt?: string | null;
  status?: string;
  minDirectReferrals?: number;
  minReferralDepositUsd?: string | number;
  rewardAmountUsd?: string | number;
  maxGrantsPerUser?: number;
  createdAt?: string;
};

type UserRoleUpdateResult = {
  id: string;
  role: AdminUser["role"];
};

type UserStatusUpdateResult = {
  id: string;
  status: AdminUser["status"];
};

type ListUsersOptions = {
  page?: number;
  limit?: number;
  search?: string;
};

type ListTransactionsOptions = {
  page?: number;
  limit?: number;
  status?: AdminTransaction["status"] | "all";
};

type ListWithdrawOptions = {
  page?: number;
  limit?: number;
  status?: AdminWithdrawRequest["status"] | "all";
};

type ListPromotionsOptions = {
  page?: number;
  limit?: number;
  status?: AdminPromotion["status"] | "all";
};

function normalizeString(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value.toString();
  return fallback;
}

function normalizePositiveInt(value: number | undefined, fallback: number) {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(1, Math.floor(value));
}

function normalizeCount(value: unknown) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }
  return Math.max(0, Math.floor(numericValue));
}

function normalizeDate(value: unknown) {
  const raw = normalizeString(value);
  return raw || new Date(0).toISOString();
}

async function readPayload(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  try {
    return await res.text();
  } catch {
    return null;
  }
}

function resolveErrorMessage(payload: unknown, status: number) {
  if (payload && typeof payload === "object") {
    if ("message" in payload) {
      const msg = normalizeString((payload as { message?: unknown }).message).trim();
      if (msg) return msg;
    }
    if ("details" in payload) {
      const details = (payload as { details?: unknown }).details;
      if (details && typeof details === "object" && "message" in details) {
        const msg = normalizeString((details as { message?: unknown }).message).trim();
        if (msg) return msg;
      }
    }
  }
  if (typeof payload === "string" && payload.trim()) return payload.trim();
  return `Request failed with status ${status}`;
}

async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const hasBody = init.body !== undefined;
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    ...(init.headers ?? {}),
  };

  const res = await fetch(path, {
    ...init,
    headers,
    credentials: "include",
  });
  const payload = await readPayload(res);

  if (!res.ok) {
    throw new Error(resolveErrorMessage(payload, res.status));
  }

  return payload as T;
}

function toPaginatedResult<Input, Output>(
  payload: BackendListResponse<Input>,
  mapper: (item: Input) => Output,
  requestedPage: number,
  requestedLimit: number,
): PaginatedResult<Output> {
  const source = Array.isArray(payload.items) ? payload.items : [];
  const items = source.map(mapper);
  const totalRaw = Number(payload.total);
  const pageRaw = Number(payload.page);

  const total = Number.isFinite(totalRaw) ? Math.max(0, Math.floor(totalRaw)) : items.length;
  const page = Number.isFinite(pageRaw) ? Math.max(1, Math.floor(pageRaw)) : requestedPage;

  return {
    items,
    total,
    page,
    limit: requestedLimit,
  };
}

function toBackendTransactionStatus(status: AdminTransaction["status"] | "all" | undefined) {
  if (!status || status === "all") return undefined;
  if (status === "completed") return "COMPLETED";
  if (status === "failed") return "FAILED";
  return "PENDING";
}

function toBackendWithdrawStatus(status: AdminWithdrawRequest["status"] | "all" | undefined) {
  if (!status || status === "all") return undefined;
  if (status === "rejected") return "REJECTED";
  if (status === "approved") return "PAID";
  return "PENDING";
}

function toBackendPromotionStatus(status: AdminPromotion["status"] | "all" | undefined) {
  if (!status || status === "all") return undefined;
  if (status === "active") return "ACTIVE";
  if (status === "scheduled") return "DRAFT";
  return "ENDED";
}

function mapUserRole(rawRole: string): AdminUser["role"] {
  const role = rawRole.toUpperCase();
  if (role === "ADMIN" || role === "FINANCE_ADMIN") return "admin";
  return "user";
}

function mapUserStatus(rawStatus: string): AdminUser["status"] {
  const status = rawStatus.toUpperCase();
  if (status === "SUSPENDED") return "suspended";
  if (status === "DELETED" || status === "PENDING_CONFIRM_EMAIL") return "blocked";
  return "active";
}

function mapNotificationType(level: CreateUserNotificationPayload["level"]) {
  if (level === "danger") return "PACKAGE_PAUSED";
  if (level === "warning") return "PROFIT_EARNED";
  return "WELCOME";
}

function mapPromotionStatus(
  rawStatus: string,
  startAt: string,
  endAt: string | null,
): AdminPromotion["status"] {
  const status = rawStatus.toUpperCase();
  if (status === "ACTIVE") return "active";
  if (status === "PAUSED" || status === "ENDED") return "ended";
  if (status === "DRAFT") return "scheduled";

  const now = Date.now();
  const start = new Date(startAt).valueOf();
  const end = endAt ? new Date(endAt).valueOf() : Number.POSITIVE_INFINITY;
  if (!Number.isNaN(start) && now < start) return "scheduled";
  if (!Number.isNaN(end) && now > end) return "ended";
  return "active";
}

function mapTransactionType(rawType: string): AdminTransactionType {
  switch (rawType.toUpperCase()) {
    case "DEPOSIT":
      return "deposit";
    case "WITHDRAW":
      return "withdraw";
    case "PACKAGE_BUY":
      return "trade";
    case "ADJUSTMENT":
      return "fee";
    default:
      return "bonus";
  }
}

function mapTransactionStatus(rawStatus: string): AdminTransaction["status"] {
  switch (rawStatus.toUpperCase()) {
    case "COMPLETED":
      return "completed";
    case "FAILED":
    case "EXPIRED":
      return "failed";
    default:
      return "pending";
  }
}

function mapWithdrawStatus(rawStatus: string): AdminWithdrawRequest["status"] {
  switch (rawStatus.toUpperCase()) {
    case "REJECTED":
      return "rejected";
    case "APPROVED":
    case "PAID":
      return "approved";
    default:
      return "pending";
  }
}

function inferNetwork(address: string) {
  if (!address || address === "—") return "Unknown";
  if (address.startsWith("0x")) return "Ethereum";
  if (address.startsWith("T")) return "TRC20";
  if (address.startsWith("bc1") || address.startsWith("1") || address.startsWith("3")) {
    return "Bitcoin";
  }
  return "Unknown";
}

function inferAsset(network: string) {
  if (network === "Bitcoin") return "BTC";
  if (network === "Ethereum") return "ETH";
  return "USDT";
}

function mapUser(item: BackendUserItem): AdminUser {
  return {
    id: normalizeString(item.id),
    username: normalizeString(item.username),
    email: normalizeString(item.email),
    role: mapUserRole(normalizeString(item.role, "USER")),
    status: mapUserStatus(normalizeString(item.status, "ACTIVE")),
    kycStatus: "unverified",
    directReferrals: 0,
    balanceUsd: "0",
    createdAt: normalizeDate(item.createdAt),
  };
}

function mapTransaction(item: BackendTransactionItem): AdminTransaction {
  const amount = normalizeString(item.amount, "0");
  const userId = normalizeString(item.wallet?.userId, normalizeString(item.walletId));
  const username = normalizeString(item.wallet?.user?.username);
  const email = normalizeString(item.wallet?.user?.email);
  const userLabel = username || email || userId || "unknown";

  return {
    id: normalizeString(item.id),
    userId,
    userLabel,
    type: mapTransactionType(normalizeString(item.type, "DEPOSIT")),
    asset: "USDT",
    amount,
    amountUsd: amount,
    status: mapTransactionStatus(normalizeString(item.status, "PENDING")),
    network: null,
    txHash: null,
    createdAt: normalizeDate(item.createdAt),
  };
}

function mapWithdrawal(item: BackendWithdrawalItem): AdminWithdrawRequest {
  const amount = normalizeString(item.amount, "0");
  const userId = normalizeString(item.userId);
  const username = normalizeString(item.user?.username);
  const email = normalizeString(item.user?.email);
  const userLabel = username || email || userId || "unknown";
  const status = mapWithdrawStatus(normalizeString(item.status, "PENDING"));
  const address = normalizeString(item.destinationAddress, "—");
  const network = inferNetwork(address);

  return {
    id: normalizeString(item.id),
    userId,
    userLabel,
    asset: inferAsset(network),
    network,
    amount,
    amountUsd: amount,
    address,
    status,
    requestedAt: normalizeDate(item.createdAt),
    decidedAt:
      normalizeString(item.paidAt) ||
      normalizeString(item.approvedAt) ||
      normalizeString(item.rejectedAt) ||
      null,
    rejectReason: status === "rejected" ? normalizeString(item.note) || null : null,
  };
}

function mapPromotion(item: BackendPromotionItem): AdminPromotion {
  const startAt = normalizeDate(item.startAt);
  const endAt = normalizeString(item.endAt) || null;
  return {
    id: normalizeString(item.id),
    title: normalizeString(item.title),
    description: normalizeString(item.description) || null,
    startAt,
    endAt,
    minDirectReferrals: Number(item.minDirectReferrals ?? 0),
    minReferralDepositUsd: normalizeString(item.minReferralDepositUsd, "0"),
    rewardAmountUsd: normalizeString(item.rewardAmountUsd, "0"),
    maxGrantsPerUser:
      typeof item.maxGrantsPerUser === "number" ? item.maxGrantsPerUser : undefined,
    createdAt: normalizeDate(item.createdAt),
    status: mapPromotionStatus(normalizeString(item.status, "DRAFT"), startAt, endAt),
  };
}

function mapDashboardWalletBalance(
  item: BackendDashboardWalletBalance | undefined,
  fallbackAsset: string,
  fallbackDecimals: number,
): AdminDashboardWalletBalance {
  return {
    address: item?.address ? normalizeString(item.address) : null,
    asset: normalizeString(item?.asset, fallbackAsset) || fallbackAsset,
    balance:
      item?.balance === null || item?.balance === undefined
        ? null
        : normalizeString(item.balance),
    rawBalance:
      item?.rawBalance === null || item?.rawBalance === undefined
        ? null
        : normalizeString(item.rawBalance),
    decimals: normalizeCount(item?.decimals) || fallbackDecimals,
  };
}

export async function getDashboardOverview(): Promise<AdminDashboardOverview> {
  const data = await adminRequest<BackendDashboardOverviewResponse>(
    "/api/admin/dashboard/overview",
  );

  return {
    totalRevenue: normalizeString(data.totalRevenue, "0"),
    totalPaidToUserWallet: normalizeString(data.totalPaidToUserWallet, "0"),
    totalPaidToWithdraw: normalizeString(data.totalPaidToWithdraw, "0"),
    withdrawalRequestsCount: normalizeCount(data.withdrawalRequestsCount),
    hotWallet: mapDashboardWalletBalance(data.hotWallet, "USDT", 6),
    gasWallet: mapDashboardWalletBalance(data.gasWallet, "BNB", 18),
    usersCount: normalizeCount(data.usersCount),
    activePackagesCount: normalizeCount(data.activePackagesCount),
  };
}

export async function listUsers(
  options: ListUsersOptions = {},
): Promise<PaginatedResult<AdminUser>> {
  const page = normalizePositiveInt(options.page, DEFAULT_PAGE);
  const limit = normalizePositiveInt(options.limit, DEFAULT_LIMIT);
  const search = options.search?.trim();
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) {
    query.set("search", search);
  }

  const data = await adminRequest<BackendListResponse<BackendUserItem>>(
    `/api/admin/users?${query.toString()}`,
  );
  return toPaginatedResult(data, mapUser, page, limit);
}

export async function sendUserNotification(
  userId: string,
  payload: CreateUserNotificationPayload,
) {
  await adminRequest<unknown>("/api/admin/notifications", {
    method: "POST",
    body: JSON.stringify({
      userId,
      type: mapNotificationType(payload.level),
      title: payload.title,
      body: payload.message,
    }),
  });
  return { ok: true } as const;
}

export async function updateUserRole(
  userId: string,
  role: AdminUser["role"],
): Promise<UserRoleUpdateResult> {
  const backendRole = role === "admin" ? "ADMIN" : "USER";
  const data = await adminRequest<{ id?: string; role?: string }>(
    `/api/admin/users/${encodeURIComponent(userId)}/role`,
    {
      method: "PATCH",
      body: JSON.stringify({ role: backendRole }),
    },
  );

  return {
    id: normalizeString(data.id, userId),
    role: mapUserRole(normalizeString(data.role, backendRole)),
  };
}

export async function updateUserStatus(
  userId: string,
  status: Extract<AdminUser["status"], "active" | "suspended">,
): Promise<UserStatusUpdateResult> {
  const backendStatus = status === "suspended" ? "SUSPENDED" : "ACTIVE";
  const data = await adminRequest<{ id?: string; status?: string }>(
    `/api/admin/users/${encodeURIComponent(userId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status: backendStatus }),
    },
  );

  return {
    id: normalizeString(data.id, userId),
    status: mapUserStatus(normalizeString(data.status, backendStatus)),
  };
}

export async function listTransactions(
  options: ListTransactionsOptions = {},
): Promise<PaginatedResult<AdminTransaction>> {
  const page = normalizePositiveInt(options.page, DEFAULT_PAGE);
  const limit = normalizePositiveInt(options.limit, DEFAULT_LIMIT);
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const backendStatus = toBackendTransactionStatus(options.status);
  if (backendStatus) {
    query.set("status", backendStatus);
  }

  const data = await adminRequest<BackendListResponse<BackendTransactionItem>>(
    `/api/admin/transactions?${query.toString()}`,
  );
  return toPaginatedResult(data, mapTransaction, page, limit);
}

export async function listWithdrawRequests(
  options: ListWithdrawOptions = {},
): Promise<PaginatedResult<AdminWithdrawRequest>> {
  const page = normalizePositiveInt(options.page, DEFAULT_PAGE);
  const limit = normalizePositiveInt(options.limit, DEFAULT_LIMIT);
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const backendStatus = toBackendWithdrawStatus(options.status);
  if (backendStatus) {
    query.set("status", backendStatus);
  }

  const data = await adminRequest<BackendListResponse<BackendWithdrawalItem>>(
    `/api/admin/withdrawals?${query.toString()}`,
  );
  return toPaginatedResult(data, mapWithdrawal, page, limit);
}

export async function approveWithdrawRequest(withdrawId: string) {
  return adminRequest<BackendWithdrawalItem>(
    `/api/admin/withdrawals/${encodeURIComponent(withdrawId)}/approve`,
    { method: "POST" },
  );
}

export async function rejectWithdrawRequest(withdrawId: string, reason: string) {
  return adminRequest<BackendWithdrawalItem>(
    `/api/admin/withdrawals/${encodeURIComponent(withdrawId)}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
  );
}

export async function listPromotions(
  options: ListPromotionsOptions = {},
): Promise<PaginatedResult<AdminPromotion>> {
  const page = normalizePositiveInt(options.page, DEFAULT_PAGE);
  const limit = normalizePositiveInt(options.limit, DEFAULT_LIMIT);
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const backendStatus = toBackendPromotionStatus(options.status);
  if (backendStatus) {
    query.set("status", backendStatus);
  }

  const data = await adminRequest<BackendListResponse<BackendPromotionItem>>(
    `/api/admin/promos?${query.toString()}`,
  );
  return toPaginatedResult(data, mapPromotion, page, limit);
}

export async function createPromotion(dto: CreatePromoDto): Promise<AdminPromotion> {
  const data = await adminRequest<BackendPromotionItem>("/api/admin/promos", {
    method: "POST",
    body: JSON.stringify({
      ...dto,
      rewardType: "WALLET_CREDIT",
    }),
  });
  return mapPromotion(data);
}

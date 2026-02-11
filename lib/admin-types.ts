export type AdminUserStatus = "active" | "suspended" | "blocked";
export type AdminUserRole = "admin" | "user";
export type AdminKycStatus = "unverified" | "pending" | "verified" | "rejected";

export type AdminUser = {
  id: string;
  username: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  kycStatus: AdminKycStatus;
  directReferrals: number;
  balanceUsd: string;
  createdAt: string;
};

export type AdminTransactionType =
  | "deposit"
  | "withdraw"
  | "trade"
  | "fee"
  | "bonus";
export type AdminTransactionStatus = "pending" | "completed" | "failed";

export type AdminTransaction = {
  id: string;
  userId: string;
  userLabel: string;
  type: AdminTransactionType;
  asset: string;
  amount: string;
  amountUsd: string;
  status: AdminTransactionStatus;
  network?: string | null;
  txHash?: string | null;
  createdAt: string;
};

export type WithdrawStatus = "pending" | "approved" | "rejected";

export type AdminWithdrawRequest = {
  id: string;
  userId: string;
  userLabel: string;
  asset: string;
  network: string;
  amount: string;
  amountUsd: string;
  address: string;
  status: WithdrawStatus;
  requestedAt: string;
  decidedAt?: string | null;
  rejectReason?: string | null;
};

export type PromotionStatus = "scheduled" | "active" | "ended";

export type AdminPromotion = {
  id: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt?: string | null;
  minDirectReferrals: number;
  minReferralDepositUsd: string;
  rewardAmountUsd: string;
  maxGrantsPerUser?: number;
  createdAt: string;
  status: PromotionStatus;
};

export type CreatePromoDto = {
  title: string;
  description?: string | null;
  startAt: string;
  endAt?: string | null;
  minDirectReferrals: number;
  minReferralDepositUsd: string;
  rewardAmountUsd: string;
  maxGrantsPerUser?: number;
};

export type CreateUserNotificationPayload = {
  title: string;
  message: string;
  level?: "info" | "warning" | "danger";
};

export type UpdateUserRolePayload = {
  role: AdminUserRole;
};

export type UpdateUserStatusPayload = {
  status: Extract<AdminUserStatus, "active" | "suspended">;
};

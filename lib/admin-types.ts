export type AdminUserStatus = "active" | "suspended" | "blocked";
export type AdminUserRole = "admin" | "finance-admin" | "user";
export type AdminKycStatus = "unverified" | "pending" | "verified" | "rejected";

export type AdminUser = {
  id: string;
  username: string;
  email: string;
  referralCode: string;
  registeredWithReferralCode: string | null;
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

export type PromotionStatus = "draft" | "active" | "deactive" | "ended";

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

export type AdminHealthcheck = {
  id: string;
  status: string;
  source: string | null;
  dbUp: boolean;
  emailReady: boolean;
  checks: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
};

export type AdminDepositScanLog = {
  id: string;
  network: string;
  reason: string;
  fromBlock: number;
  toBlock: number;
  plannedScanBlocks: number;
  scannedBlocks: number;
  detected: number;
  credited: number;
  latestBlock: number;
  safeTip: number;
  reorgDetected: boolean;
  createdAt: string;
};

export type AdminSweepLog = {
  id: string;
  network: string;
  status: string;
  purpose?: string | null;
  sourceAction?: string | null;
  fromAddress: string;
  toAddress: string;
  tokenContract: string;
  userId: string | null;
  userLabel: string;
  amount: string;
  txHash: string | null;
  gasTopupTxHash: string | null;
  sweepGasUsed: string | null;
  sweepGasFeeWei: string | null;
  sweepGasFeeBnb: string | null;
  topupGasUsed: string | null;
  topupGasFeeWei: string | null;
  topupGasFeeBnb: string | null;
  totalGasFeeBnb: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

export type AdminDepositCreditItem = {
  id: string;
  userId: string;
  userLabel: string;
  network: string;
  amount: string;
  txHash: string;
  fromAddress: string | null;
  toAddress: string;
  status: string;
  detectedAt: string;
  creditedAt: string | null;
};

export type AdminDepositCreditsSummary = {
  totalAmount: string;
  totalCount: number;
  from: string | null;
  to: string | null;
};

export type AdminDepositCreditsReport = {
  items: AdminDepositCreditItem[];
  total: number;
  page: number;
  limit: number;
  summary: AdminDepositCreditsSummary;
};

export type AdminAuditLog = {
  id: string;
  actorUserId: string | null;
  targetUserId: string | null;
  actorLabel: string;
  targetLabel: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type AdminBlockchainSummary = {
  deposits: {
    creditedTotal: string;
    detectedTotal: string;
  };
  sweeps: {
    statusCounts: Record<string, number>;
    inProgress: number;
    failed: number;
    unsweptWallets: number;
  };
  gas: {
    sweepGasUsed: string | null;
    sweepGasFeeWei: string | null;
    sweepGasFeeBnb: string | null;
    topupGasUsed: string | null;
    topupGasFeeWei: string | null;
    topupGasFeeBnb: string | null;
  };
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

export type UpdatePromoDto = {
  title?: string;
  description?: string | null;
  startAt?: string;
  endAt?: string | null;
  status?: PromotionStatus;
  minDirectReferrals?: number;
  minReferralDepositUsd?: string;
  rewardAmountUsd?: string;
  maxGrantsPerUser?: number;
};

export type CreateUserNotificationPayload = {
  title: string;
  message: string;
  level?: "info" | "warning" | "danger";
};

export type AdminManualDepositPayload = {
  amount: string;
  note?: string;
};

export type AdminManualDepositResult = {
  userId: string;
  walletBalance: string;
  transactionId: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  createdAt: string;
};

export type UpdateUserRolePayload = {
  role: AdminUserRole;
};

export type UpdateUserStatusPayload = {
  status: Extract<AdminUserStatus, "active" | "suspended">;
};

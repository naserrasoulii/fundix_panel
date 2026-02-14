import type {
  AdminPromotion,
  AdminTransaction,
  AdminUser,
  AdminWithdrawRequest,
  CreatePromoDto,
  CreateUserNotificationPayload,
  UpdateUserRolePayload,
  UpdateUserStatusPayload,
} from "@/lib/admin-types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomId(prefix: string) {
  const id =
    globalThis.crypto?.randomUUID?.() ??
    Math.random().toString(16).slice(2) + Date.now().toString(16);
  return `${prefix}_${id}`;
}

function nowIso() {
  return new Date().toISOString();
}

function promoStatus(promo: Pick<AdminPromotion, "startAt" | "endAt">) {
  const now = Date.now();
  const start = new Date(promo.startAt).valueOf();
  const end = promo.endAt
    ? new Date(promo.endAt).valueOf()
    : Number.POSITIVE_INFINITY;

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "scheduled" as const;
  }

  if (now < start) {
    return "scheduled" as const;
  }
  if (now > end) {
    return "ended" as const;
  }
  return "active" as const;
}

const mockState: {
  users: AdminUser[];
  transactions: AdminTransaction[];
  withdraws: AdminWithdrawRequest[];
  promotions: AdminPromotion[];
  notifications: Array<{
    id: string;
    userId: string;
    payload: CreateUserNotificationPayload;
    createdAt: string;
  }>;
} = {
  users: [
    {
      id: "u_1001",
      username: "fundix.admin",
      email: "admin@fundix.ai",
      role: "admin",
      status: "active",
      kycStatus: "verified",
      directReferrals: 0,
      balanceUsd: "0",
      createdAt: "2025-10-02T09:12:00.000Z",
    },
    {
      id: "u_2001",
      username: "mona.k",
      email: "mona@example.com",
      role: "user",
      status: "active",
      kycStatus: "pending",
      directReferrals: 3,
      balanceUsd: "1280.42",
      createdAt: "2025-12-18T13:45:00.000Z",
    },
    {
      id: "u_2002",
      username: "ali.trader",
      email: "ali.trader@example.com",
      role: "user",
      status: "active",
      kycStatus: "verified",
      directReferrals: 12,
      balanceUsd: "9840.10",
      createdAt: "2025-11-22T07:22:00.000Z",
    },
    {
      id: "u_2003",
      username: "sara.crypt0",
      email: "sara@example.com",
      role: "user",
      status: "suspended",
      kycStatus: "rejected",
      directReferrals: 1,
      balanceUsd: "54.13",
      createdAt: "2025-09-03T18:04:00.000Z",
    },
    {
      id: "u_2004",
      username: "reza.long",
      email: "reza@example.com",
      role: "user",
      status: "active",
      kycStatus: "unverified",
      directReferrals: 0,
      balanceUsd: "0.00",
      createdAt: "2026-01-08T10:30:00.000Z",
    },
  ],
  transactions: [
    {
      id: "tx_9001",
      userId: "u_2002",
      userLabel: "ali.trader",
      type: "deposit",
      asset: "USDT",
      amount: "500",
      amountUsd: "500",
      status: "completed",
      network: "TRC20",
      txHash:
        "0x2e2d4c57f9a4d7a1f3f9b8d2ad219d1cbd54c2d0a28a2b9c2d9d9d09b0aabc12",
      createdAt: "2026-02-10T08:10:00.000Z",
    },
    {
      id: "tx_9002",
      userId: "u_2001",
      userLabel: "mona.k",
      type: "withdraw",
      asset: "USDT",
      amount: "220",
      amountUsd: "220",
      status: "pending",
      network: "TRC20",
      txHash: null,
      createdAt: "2026-02-10T12:22:00.000Z",
    },
    {
      id: "tx_9003",
      userId: "u_2003",
      userLabel: "sara.crypt0",
      type: "trade",
      asset: "BTC",
      amount: "0.011",
      amountUsd: "497.12",
      status: "failed",
      network: null,
      txHash: null,
      createdAt: "2026-02-09T19:01:00.000Z",
    },
  ],
  withdraws: [
    {
      id: "wd_7001",
      userId: "u_2001",
      userLabel: "mona.k",
      asset: "USDT",
      network: "TRC20",
      amount: "220",
      amountUsd: "220",
      address: "TDxF7QbD8M....wq9h",
      status: "pending",
      requestedAt: "2026-02-10T12:21:00.000Z",
      decidedAt: null,
      rejectReason: null,
    },
    {
      id: "wd_7002",
      userId: "u_2002",
      userLabel: "ali.trader",
      asset: "BTC",
      network: "Bitcoin",
      amount: "0.0021",
      amountUsd: "95.40",
      address: "bc1q3...p9v8",
      status: "approved",
      requestedAt: "2026-02-08T10:02:00.000Z",
      decidedAt: "2026-02-08T10:18:00.000Z",
      rejectReason: null,
    },
    {
      id: "wd_7003",
      userId: "u_2003",
      userLabel: "sara.crypt0",
      asset: "ETH",
      network: "Ethereum",
      amount: "0.15",
      amountUsd: "362.90",
      address: "0x8C2a...51B1",
      status: "rejected",
      requestedAt: "2026-02-06T15:43:00.000Z",
      decidedAt: "2026-02-06T16:00:00.000Z",
      rejectReason: "KYC not verified",
    },
  ],
  promotions: [
    {
      id: "pr_3001",
      title: "Referral Sprint",
      description: "Invite friends and earn a bonus after their first deposit.",
      startAt: "2026-02-01T00:00:00.000Z",
      endAt: "2026-02-29T23:59:59.000Z",
      minDirectReferrals: 3,
      minReferralDepositUsd: "50",
      rewardAmountUsd: "10",
      maxGrantsPerUser: 3,
      createdAt: "2026-01-28T09:40:00.000Z",
      status: "active",
    },
    {
      id: "pr_3002",
      title: "VIP Onboarding",
      description: null,
      startAt: "2026-03-01T00:00:00.000Z",
      endAt: null,
      minDirectReferrals: 1,
      minReferralDepositUsd: "200",
      rewardAmountUsd: "25",
      maxGrantsPerUser: 1,
      createdAt: "2026-02-05T11:00:00.000Z",
      status: "scheduled",
    },
  ],
  notifications: [],
};

export const mockAdminApi = {
  mode: "mock" as const,

  async listUsers(): Promise<AdminUser[]> {
    await sleep(250);
    return [...mockState.users].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  },

  async sendUserNotification(
    userId: string,
    payload: CreateUserNotificationPayload,
  ) {
    await sleep(350);
    mockState.notifications.unshift({
      id: randomId("nt"),
      userId,
      payload,
      createdAt: nowIso(),
    });
    return { ok: true } as const;
  },

  async updateUserRole(
    userId: string,
    payload: UpdateUserRolePayload,
  ): Promise<AdminUser> {
    await sleep(250);
    const user = mockState.users.find((item) => item.id === userId);
    if (!user) {
      throw new Error("User not found");
    }
    user.role = payload.role;
    return { ...user };
  },

  async updateUserStatus(
    userId: string,
    payload: UpdateUserStatusPayload,
  ): Promise<AdminUser> {
    await sleep(250);
    const user = mockState.users.find((item) => item.id === userId);
    if (!user) {
      throw new Error("User not found");
    }
    user.status = payload.status;
    return { ...user };
  },

  async listTransactions(): Promise<AdminTransaction[]> {
    await sleep(250);
    return [...mockState.transactions].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  },

  async listWithdrawRequests(): Promise<AdminWithdrawRequest[]> {
    await sleep(250);
    return [...mockState.withdraws].sort((a, b) =>
      b.requestedAt.localeCompare(a.requestedAt),
    );
  },

  async approveWithdrawRequest(withdrawId: string) {
    await sleep(350);
    const item = mockState.withdraws.find((wd) => wd.id === withdrawId);
    if (!item) {
      throw new Error("Withdraw request not found");
    }
    if (item.status !== "pending") {
      return { ok: true } as const;
    }
    item.status = "approved";
    item.decidedAt = nowIso();
    item.rejectReason = null;
    return { ok: true } as const;
  },

  async rejectWithdrawRequest(withdrawId: string, reason: string) {
    await sleep(350);
    const item = mockState.withdraws.find((wd) => wd.id === withdrawId);
    if (!item) {
      throw new Error("Withdraw request not found");
    }
    if (item.status !== "pending") {
      return { ok: true } as const;
    }
    item.status = "rejected";
    item.decidedAt = nowIso();
    item.rejectReason = reason;
    return { ok: true } as const;
  },

  async listPromotions(): Promise<AdminPromotion[]> {
    await sleep(250);
    const normalized = mockState.promotions.map((promo) => ({
      ...promo,
      status: promoStatus(promo),
    }));
    return normalized.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async createPromotion(dto: CreatePromoDto): Promise<AdminPromotion> {
    await sleep(450);
    const created: AdminPromotion = {
      id: randomId("pr"),
      title: dto.title,
      description: dto.description ?? null,
      startAt: dto.startAt,
      endAt: dto.endAt ?? null,
      minDirectReferrals: dto.minDirectReferrals,
      minReferralDepositUsd: dto.minReferralDepositUsd,
      rewardAmountUsd: dto.rewardAmountUsd,
      maxGrantsPerUser: dto.maxGrantsPerUser,
      createdAt: nowIso(),
      status: promoStatus(dto),
    };
    mockState.promotions.unshift(created);
    return created;
  },
};

import { apiFetch } from "@/lib/api-client";
import { mockAdminApi } from "@/lib/mock-admin-api";

export type {
  AdminKycStatus,
  AdminPromotion,
  AdminTransaction,
  AdminTransactionStatus,
  AdminTransactionType,
  AdminUserRole,
  AdminUser,
  AdminUserStatus,
  AdminWithdrawRequest,
  CreatePromoDto,
  CreateUserNotificationPayload,
  PromotionStatus,
  UpdateUserRolePayload,
  UpdateUserStatusPayload,
  WithdrawStatus
} from "@/lib/admin-types";

import type {
  AdminPromotion,
  AdminTransaction,
  AdminUserRole,
  AdminUser,
  AdminUserStatus,
  AdminWithdrawRequest,
  CreatePromoDto,
  CreateUserNotificationPayload,
  UpdateUserRolePayload,
  UpdateUserStatusPayload
} from "@/lib/admin-types";

const USE_MOCK_API =
  process.env.NEXT_PUBLIC_USE_MOCK_API === "true" ||
  !process.env.NEXT_PUBLIC_API_BASE_URL;

export const ADMIN_API_MODE = USE_MOCK_API ? ("mock" as const) : ("remote" as const);

const endpoints = {
  users: "/admin/users",
  userNotifications: (userId: string) => `/admin/users/${userId}/notifications`,
  userRole: (userId: string) => `/admin/users/${userId}/role`,
  userStatus: (userId: string) => `/admin/users/${userId}/status`,
  transactions: "/admin/transactions",
  withdrawRequests: "/admin/withdraws",
  approveWithdrawRequest: (withdrawId: string) => `/admin/withdraws/${withdrawId}/approve`,
  rejectWithdrawRequest: (withdrawId: string) => `/admin/withdraws/${withdrawId}/reject`,
  promotions: "/admin/promotions",
  createPromotion: "/admin/promotions"
} as const;

export async function listUsers() {
  if (USE_MOCK_API) {
    return mockAdminApi.listUsers();
  }
  return apiFetch<AdminUser[]>(endpoints.users);
}

export async function sendUserNotification(userId: string, payload: CreateUserNotificationPayload) {
  if (USE_MOCK_API) {
    return mockAdminApi.sendUserNotification(userId, payload);
  }

  return apiFetch<{ ok: true }>(endpoints.userNotifications(userId), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateUserRole(userId: string, role: AdminUserRole) {
  if (USE_MOCK_API) {
    return mockAdminApi.updateUserRole(userId, { role });
  }

  const payload: UpdateUserRolePayload = { role };

  return apiFetch<AdminUser>(endpoints.userRole(userId), {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function updateUserStatus(
  userId: string,
  status: Extract<AdminUserStatus, "active" | "suspended">
) {
  if (USE_MOCK_API) {
    return mockAdminApi.updateUserStatus(userId, { status });
  }

  const payload: UpdateUserStatusPayload = { status };

  return apiFetch<AdminUser>(endpoints.userStatus(userId), {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function listTransactions() {
  if (USE_MOCK_API) {
    return mockAdminApi.listTransactions();
  }

  return apiFetch<AdminTransaction[]>(endpoints.transactions);
}

export async function listWithdrawRequests() {
  if (USE_MOCK_API) {
    return mockAdminApi.listWithdrawRequests();
  }

  return apiFetch<AdminWithdrawRequest[]>(endpoints.withdrawRequests);
}

export async function approveWithdrawRequest(withdrawId: string) {
  if (USE_MOCK_API) {
    return mockAdminApi.approveWithdrawRequest(withdrawId);
  }

  return apiFetch<{ ok: true }>(endpoints.approveWithdrawRequest(withdrawId), {
    method: "POST"
  });
}

export async function rejectWithdrawRequest(withdrawId: string, reason: string) {
  if (USE_MOCK_API) {
    return mockAdminApi.rejectWithdrawRequest(withdrawId, reason);
  }

  return apiFetch<{ ok: true }>(endpoints.rejectWithdrawRequest(withdrawId), {
    method: "POST",
    body: JSON.stringify({ reason })
  });
}

export async function listPromotions() {
  if (USE_MOCK_API) {
    return mockAdminApi.listPromotions();
  }

  return apiFetch<AdminPromotion[]>(endpoints.promotions);
}

export async function createPromotion(dto: CreatePromoDto) {
  if (USE_MOCK_API) {
    return mockAdminApi.createPromotion(dto);
  }

  return apiFetch<AdminPromotion>(endpoints.createPromotion, {
    method: "POST",
    body: JSON.stringify(dto)
  });
}

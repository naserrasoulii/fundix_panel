// lib/http/internal-fetch.ts
import { HttpError } from "./http-error";

async function readBody(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
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

async function logoutAndRedirect() {
  try {
    // پاک کردن cookie از سرور
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });
  } catch {}

  // redirect سراسری
  if (typeof window !== "undefined") {
    const localeFromPath = window.location.pathname.split("/")[1] || "en";
    window.location.href = `/${localeFromPath}/admin/login`;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function internalFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!path.startsWith("/api/")) {
    throw new Error("Only /api/* is allowed");
  }

  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...Object.fromEntries(new Headers(init.headers).entries()),
    }
  });

  if (res.status === 401) {
    await logoutAndRedirect();
    throw new HttpError("Unauthorized", 401);
  }

  if (!res.ok) {
    const payload = await readBody(res);
    const normalizedPayload: Record<string, unknown> =
      isRecord(payload)
        ? payload
        : {
            message: payload ?? `Request failed with status ${res.status}`,
          };
    const message =
      typeof normalizedPayload.message === "string"
        ? normalizedPayload.message
        : `Request failed with status ${res.status}`;
    const code =
      normalizedPayload.code !== undefined ? String(normalizedPayload.code) : undefined;
    throw new HttpError(message, res.status, code, normalizedPayload);
  }

  return (await readBody(res)) as T;
}

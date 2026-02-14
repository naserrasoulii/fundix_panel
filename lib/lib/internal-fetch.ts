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
    });
  } catch {}

  // redirect سراسری
  if (typeof window !== "undefined") {
    const localeFromPath = window.location.pathname.split("/")[1] || "en";
    window.location.href = `/${localeFromPath}/admin/login`;
  }
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
      ...(init.headers as any),
    },
  });

  if (res.status === 401) {
    await logoutAndRedirect();
    throw new HttpError("Unauthorized", 401);
  }

  if (!res.ok) {
    const payload = await readBody(res);
    const normalizedPayload =
      payload && typeof payload === "object"
        ? payload
        : {
            message: payload ?? `Request failed with status ${res.status}`,
          };
    const message =
      normalizedPayload && typeof normalizedPayload === "object" && "message" in normalizedPayload
        ? String((normalizedPayload as any).message)
        : `Request failed with status ${res.status}`;
    throw new HttpError(message, res.status, (normalizedPayload as any)?.code, normalizedPayload);
  }

  return (await readBody(res)) as T;
}

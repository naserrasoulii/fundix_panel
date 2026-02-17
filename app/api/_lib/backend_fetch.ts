import { getAccessCookie } from "./auth-cookies";
import { HttpError } from "@/lib/lib/http-error";

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

type BackendFetchOptions = Omit<RequestInit, "headers" | "body"> & {
  path: string;
  lang?: string;
  headers?: Record<string, string>;
  body?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

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

export async function backendFetch<T>(opts: BackendFetchOptions): Promise<T> {
  if (!BACKEND_BASE_URL) throw new Error("BACKEND_BASE_URL is not set");

  const token = await getAccessCookie();
  const lang = "en";

  const reqHeaders: Record<string, string> = {
    Accept: "application/json",
    "Accept-Language": lang,
    ...(opts.headers ?? {}),
  };

  if (token) reqHeaders.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (opts.body !== undefined) {
    reqHeaders["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(`${BACKEND_BASE_URL}${opts.path}`, {
    ...opts,
    headers: reqHeaders,
    body,
    cache: "no-store",
  });

  if (res.ok) return (await readBody(res)) as T;

  if (res.status === 401) {
    // await clearAccessCookie();
  }

  const payload = await readBody(res);
  const message =
    (isRecord(payload) && typeof payload.message === "string" && payload.message) ||
    (typeof payload === "string" && payload) ||
    `Request failed with status ${res.status}`;

  const code =
    isRecord(payload) && payload.code !== undefined ? String(payload.code) : undefined;

  throw new HttpError(String(message), res.status, code, payload);
}

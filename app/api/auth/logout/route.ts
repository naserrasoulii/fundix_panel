import { NextRequest, NextResponse } from "next/server";
import { clearAccessCookie } from "@/app/api/_lib/auth-cookies";

function resolveLocale(value: FormDataEntryValue | null) {
  const fallback = "en";
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }

  if (!/^[a-z]{2}$/.test(normalized)) {
    return fallback;
  }

  return normalized;
}

export async function POST(request: NextRequest) {
  await clearAccessCookie();

  const isJsonRequest =
    request.headers.get("accept")?.includes("application/json") ||
    request.headers.get("content-type")?.includes("application/json");

  if (isJsonRequest) {
    return NextResponse.json({ ok: true });
  }

  let locale = "en";
  try {
    const formData = await request.formData();
    locale = resolveLocale(formData.get("locale"));
  } catch {
    locale = "en";
  }

  return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url), {
    status: 303
  });
}

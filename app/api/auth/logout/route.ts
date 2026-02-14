import { NextResponse } from "next/server";
import { clearAccessCookie } from "@/app/api/_lib/auth-cookies";

export async function POST() {
  await clearAccessCookie();
  return NextResponse.json({ ok: true });
}

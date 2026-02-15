import { NextResponse } from "next/server";
import { backendFetch } from "../../_lib/backend_fetch";
import { setAccessCookie } from "../../_lib/auth-cookies";
import { HttpError } from "@/lib/lib/http-error";

type LoginResponse = {
  user: {
    id: string;
    email: string;
    username: string;
  };
  accessToken?: string;
  token?: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawIdentifier =
      typeof body?.username === "string"
        ? body.username
        : typeof body?.email === "string"
          ? body.email
          : "";
    const identifier = rawIdentifier.trim();
    const password = typeof body?.password === "string" ? body.password : "";

    if (!identifier || !password) {
      return NextResponse.json(
        { message: "Username/email and password are required" },
        { status: 400 },
      );
    }

    const isEmailLogin = identifier.includes("@");
    const data = await backendFetch<LoginResponse>({
      path: isEmailLogin
        ? "/v1/admin/auth/login"
        : "/v1/admin/auth/login-username",
      method: "POST",
      body: isEmailLogin
        ? { email: identifier, password }
        : { username: identifier, password },
    });

    const token = data.accessToken ?? data.token;
    if (!token) {
      return NextResponse.json({ message: "Access token is missing" }, { status: 502 });
    }

    await setAccessCookie(token);

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof HttpError) {
      return NextResponse.json(
        { message: e.message, code: e.code, details: e.details },
        { status: e.status },
      );
    }
    console.log("error", e);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

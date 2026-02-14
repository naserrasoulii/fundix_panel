import { NextResponse } from "next/server";
import { backendFetch } from "../../_lib/backend_fetch";
import { setAccessCookie } from "../../_lib/auth-cookies";
import { HttpError } from "@/lib/lib/http-error";
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const data = await backendFetch<{
      user: {
        id: string;
        email: string;
        username: string;
      };
      accessToken: string;
    }>({
      path: "/v1/admin/auth/login-username",
      method: "POST",
      body,
    });

    if (!data.accessToken) {
      return NextResponse.json({ message: "Access token is missing" }, { status: 502 });
    }

    await setAccessCookie(data.accessToken);

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

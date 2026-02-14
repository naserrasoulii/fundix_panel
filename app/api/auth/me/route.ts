import { NextResponse } from "next/server";
import { backendFetch } from "../../_lib/backend_fetch";
import { HttpError } from "@/lib/lib/http-error";
export async function GET(req: Request) {
  try {
    const data = await backendFetch<{
      id: string;
      email: string;
      username: string;
      firstName: string;
      lastName: string;
    }>({
      path: "/v1/auth/admin/me",
      method: "GET",
      cache: "force-cache",
    });

    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof HttpError) {
      return NextResponse.json(
        { message: e.message, code: e.code, details: e.details },
        { status: e.status },
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

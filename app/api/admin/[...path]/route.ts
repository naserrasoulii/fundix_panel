import { NextResponse } from "next/server";
import { backendFetch } from "../../_lib/backend_fetch";
import { HttpError } from "@/lib/lib/http-error";

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

async function handle(req: Request, context: RouteContext, method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE") {
  try {
    const { path = [] } = await context.params;
    if (path.length === 0) {
      return NextResponse.json({ message: "Admin path is required" }, { status: 400 });
    }

    const encodedPath = path.map((segment) => encodeURIComponent(segment)).join("/");
    const url = new URL(req.url);
    const requestPath = `/v1/admin/${encodedPath}${url.search}`;
    let body: unknown = undefined;

    if (method !== "GET") {
      body = await req.json().catch(() => undefined);
    }

    const data = await backendFetch<unknown>({
      path: requestPath,
      method,
      ...(body !== undefined ? { body } : {}),
    });

    return NextResponse.json(data === undefined ? null : data);
  } catch (e) {
    if (e instanceof HttpError) {
      return NextResponse.json(
        { message: e.message, code: e.code, details: e.details },
        { status: e.status },
      );
    }
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request, context: RouteContext) {
  return handle(req, context, "GET");
}

export async function POST(req: Request, context: RouteContext) {
  return handle(req, context, "POST");
}

export async function PATCH(req: Request, context: RouteContext) {
  return handle(req, context, "PATCH");
}

export async function PUT(req: Request, context: RouteContext) {
  return handle(req, context, "PUT");
}

export async function DELETE(req: Request, context: RouteContext) {
  return handle(req, context, "DELETE");
}

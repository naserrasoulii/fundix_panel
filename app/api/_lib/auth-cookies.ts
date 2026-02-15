import { cookies } from "next/headers";

export const ACCESS_COOKIE = "token";
export const LEGACY_ACCESS_COOKIE = "access_token";

const isProd = process.env.NODE_ENV === "production";
const maxAgeCookie = 60 * 60 * 24 * 7;

export async function setAccessCookie(token: string, maxAgeSec = maxAgeCookie) {
  const jar = await cookies();
  jar.set({
    name: ACCESS_COOKIE,
    value: token,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSec,
  });
  jar.set({
    name: LEGACY_ACCESS_COOKIE,
    value: "",
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function clearAccessCookie() {
  const jar = await cookies();
  jar.set({
    name: ACCESS_COOKIE,
    value: "",
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  jar.set({
    name: LEGACY_ACCESS_COOKIE,
    value: "",
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getAccessCookie() {
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value ?? jar.get(LEGACY_ACCESS_COOKIE)?.value;
}

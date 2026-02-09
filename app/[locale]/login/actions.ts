"use server";

import { cookies } from "next/headers";

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return;
  }

  // TODO: Replace with a real backend call that returns an access token.
  const accessToken = "REPLACE_WITH_TOKEN";

  cookies().set("auth_token", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
}

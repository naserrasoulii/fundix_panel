"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginState = {
  error: string | null;
};

const initialState: LoginState = {
  error: null,
};

async function submitLogin(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const locale = String(formData.get("locale") ?? "en");

  if (!username || !password) {
    return {
      error: "Username/email and password are required.",
    };
  }

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      const message =
        payload && typeof payload === "object" && "message" in payload
          ? String((payload as { message?: unknown }).message ?? "")
          : "";

      return {
        error: message || "Sign in failed. Please try again.",
      };
    }

    window.location.href = `/${locale}/dashboard`;

    return {
      error: null,
    };
  } catch {
    return {
      error: "Unable to connect. Please try again.",
    };
  }
}

export function LoginForm({ locale }: { locale: string }) {
  const [state, formAction, isPending] = useActionState(
    submitLogin,
    initialState,
  );

  return (
    <form className="space-y-4" action={formAction}>
      <input type="hidden" name="locale" value={locale} />
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="username">
          Username or Email
        </label>
        <Input
          id="username"
          name="username"
          type="text"
          placeholder="username"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
        />
      </div>
      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { loginAction } from "@/app/[locale]/login/actions";

export default function LoginPage({
  params
}: {
  params: { locale: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-background p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            F
          </div>
          <h1 className="mt-4 text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Use your user name and password to continue.
          </p>
        </div>

        <form className="space-y-4" action={loginAction}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="fundix.admin"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link
            href={`/${params.locale}/dashboard`}
            className="font-medium text-primary hover:underline"
          >
            Go to dashboard preview
          </Link>
        </div>
      </div>
    </div>
  );
}

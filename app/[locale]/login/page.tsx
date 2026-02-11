import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/app/[locale]/login/actions";

export default async function LoginPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

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
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="fundix.admin"
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
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link
            href={`/${locale}/dashboard`}
            className="font-medium text-primary hover:underline"
          >
            Go to dashboard preview
          </Link>
        </div>
      </div>
    </div>
  );
}

import Image from "next/image";
import { LoginForm } from "../../login/login-form";

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-background p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto flex items-center justify-center rounded-xl ">
            <Image
              src="/images/logo.png"
              width={180}
              height={60}
              alt="fundixai logo"
            />
          </div>
          <h1 className="mt-4 text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Use your user name and password to continue.
          </p>
        </div>

        <LoginForm locale={locale} />
      </div>
    </div>
  );
}

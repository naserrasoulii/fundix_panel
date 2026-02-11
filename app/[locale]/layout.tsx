import { notFound } from "next/navigation";

const locales = ["en"] as const;

type Locale = (typeof locales)[number];

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const typedLocale = locale as Locale;

  if (!locales.includes(typedLocale)) {
    notFound();
  }

  return <div lang={typedLocale}>{children}</div>;
}

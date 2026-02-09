import { notFound } from "next/navigation";

const locales = ["en"] as const;

type Locale = (typeof locales)[number];

export default function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = params.locale as Locale;

  if (!locales.includes(locale)) {
    notFound();
  }

  return <div lang={locale}>{children}</div>;
}

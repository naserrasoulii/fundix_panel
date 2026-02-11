import { ReactQueryProvider } from "@/components/react-query-provider";
import { AppShell } from "@/components/app-shell";

export default async function DashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <ReactQueryProvider>
      <AppShell locale={locale}>{children}</AppShell>
    </ReactQueryProvider>
  );
}

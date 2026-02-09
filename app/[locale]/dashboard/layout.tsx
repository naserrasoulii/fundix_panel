"use client";

import * as React from "react";

import { ReactQueryProvider } from "@/components/react-query-provider";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <ReactQueryProvider>{children}</ReactQueryProvider>;
}

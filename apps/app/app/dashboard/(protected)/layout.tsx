"use client";

import type { ReactNode } from "react";
import { DashboardShell } from "../../../components/dashboard-shell";
import { DashboardDataProvider } from "../../../lib/dashboard-data-context";

export default function ProtectedDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DashboardDataProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardDataProvider>
  );
}

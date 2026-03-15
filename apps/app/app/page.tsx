"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { getDashboardHomePath } from "../lib/dashboard-role-config";

function SpinnerScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin h-5 w-5 rounded-full border-2 border-blue-600 border-t-transparent" />
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { isLoading, profile } = useAuth();

  useEffect(() => {
    if (!isLoading && profile) {
      router.replace(getDashboardHomePath(profile.role));
      return;
    }

    if (!isLoading && !profile) {
      router.replace("/auth/login");
    }
  }, [isLoading, profile, router]);

  return <SpinnerScreen />;
}

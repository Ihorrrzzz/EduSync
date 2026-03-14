"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../../lib/auth-context";
import type { Profile } from "../../lib/api";

function SpinnerScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin h-5 w-5 rounded-full border-2 border-blue-600 border-t-transparent" />
    </div>
  );
}

function DashboardShell({
  profile,
  subtitle,
  onLogout,
}: {
  profile: Profile;
  subtitle: string;
  onLogout: () => Promise<void>;
}) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-semibold text-gray-900">EduSync</span>
        <button
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          type="button"
          onClick={() => {
            void onLogout();
          }}
        >
          Вийти
        </button>
      </header>
      <main className="mx-auto max-w-2xl px-4 pt-16">
        <h1 className="text-3xl font-semibold text-gray-900">
          Вітаємо, {profile.fullName ?? profile.email}
        </h1>
        <p className="mt-4 text-base text-gray-600">{subtitle}</p>
      </main>
    </div>
  );
}

function ParentDashboard({
  profile,
  logout,
}: {
  profile: Profile;
  logout: () => Promise<void>;
}) {
  return (
    <DashboardShell
      profile={profile}
      subtitle="Тут ви зможете відстежувати освітній прогрес ваших дітей."
      onLogout={logout}
    />
  );
}

function SchoolDashboard({
  profile,
  logout,
}: {
  profile: Profile;
  logout: () => Promise<void>;
}) {
  return (
    <DashboardShell
      profile={profile}
      subtitle="Тут школа зможе переглядати та підтверджувати оцінки з позашкільних закладів."
      onLogout={logout}
    />
  );
}

function ClubDashboard({
  profile,
  logout,
}: {
  profile: Profile;
  logout: () => Promise<void>;
}) {
  return (
    <DashboardShell
      profile={profile}
      subtitle="Тут гурток зможе виставляти оцінки учням та надсилати їх до шкіл."
      onLogout={logout}
    />
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { isLoading, profile, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !profile) {
      router.replace("/auth/login");
    }
  }, [isLoading, profile, router]);

  if (isLoading || !profile) {
    return <SpinnerScreen />;
  }

  if (profile.role === "parent") {
    return <ParentDashboard profile={profile} logout={logout} />;
  }

  if (profile.role === "school") {
    return <SchoolDashboard profile={profile} logout={logout} />;
  }

  return <ClubDashboard profile={profile} logout={logout} />;
}

"use client";

import {
  FileCheck2,
  Home,
  Layers3,
  LogOut,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "../lib/auth-context";
import { useDashboardData } from "../lib/dashboard-data-context";
import type { ProfileRole } from "../lib/api";
import { ScreenSpinner } from "./screen-spinner";

type NavigationItem = {
  href: string;
  label: string;
  icon: typeof Home;
};

const navigationByRole: Record<ProfileRole, NavigationItem[]> = {
  parent: [
    { href: "/dashboard/account", label: "Огляд", icon: Home },
    { href: "/dashboard/children", label: "Дитина", icon: Users },
  ],
  club: [
    { href: "/dashboard/account", label: "Огляд", icon: Home },
    { href: "/dashboard/students", label: "Учні", icon: Users },
    { href: "/dashboard/requests", label: "Запити", icon: FileCheck2 },
    { href: "/dashboard/programs", label: "Програми", icon: Layers3 },
  ],
  school: [
    { href: "/dashboard/account", label: "Огляд", icon: Home },
    { href: "/dashboard/review", label: "Розгляд", icon: ShieldCheck },
  ],
};

function isActiveLink(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function formatRequestStatus(status: string) {
  const labels: Record<string, string> = {
    DRAFT: "Чернетка",
    SUBMITTED: "Подано",
    AI_READY: "AI готовий",
    UNDER_REVIEW: "На розгляді",
    APPROVED: "Погоджено",
    PARTIALLY_APPROVED: "Частково погоджено",
    CHANGES_REQUESTED: "Потрібні зміни",
    REJECTED: "Відхилено",
  };

  return labels[status] ?? status;
}

export function formatDecisionLabel(decision: string) {
  const labels: Record<string, string> = {
    APPROVE: "Підтверджено",
    PARTIAL: "Підтверджено частково",
    REQUEST_CHANGES: "Повернено",
    REJECT: "Скасовано",
  };

  return labels[decision] ?? decision;
}

export function formatRecommendationBand(band: string) {
  const labels: Record<string, string> = {
    strong: "Сильний збіг",
    possible: "Можливий збіг",
    weak: "Слабкий збіг",
  };

  return labels[band] ?? band;
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "APPROVED" || status === "PARTIALLY_APPROVED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "CHANGES_REQUESTED" || status === "UNDER_REVIEW"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : status === "REJECTED"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
      {formatRequestStatus(status)}
    </span>
  );
}

export function BandBadge({ band }: { band: string }) {
  const tone =
    band === "strong"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : band === "possible"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
      {formatRecommendationBand(band)}
    </span>
  );
}

export function SurfaceCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_42px_rgba(15,23,42,0.05)] ${className}`}
    >
      {children}
    </section>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[1.9rem] border border-white/50 bg-[linear-gradient(135deg,rgba(37,99,255,0.13),rgba(255,255,255,0.88))] p-6 shadow-[0_20px_50px_rgba(37,99,255,0.12)] md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <SurfaceCard className="p-5">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
        {value}
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>
    </SurfaceCard>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <SurfaceCard className="border-dashed bg-slate-50/60 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm">
        <Sparkles className="h-6 w-6" strokeWidth={2.1} />
      </div>
      <h3 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
    </SurfaceCard>
  );
}

export function AdvisoryNote() {
  return (
    <div className="rounded-[1.35rem] border border-blue-100 bg-blue-50/80 p-4 text-sm leading-6 text-blue-900">
      <div className="font-semibold">AI-рекомендація</div>
      <div className="mt-1">
        AI показує тільки рекомендацію та прогалини. Остаточне рішення завжди
        зберігає школа.
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, isLoading: isAuthLoading, logout } = useAuth();
  const { me, isLoading, error } = useDashboardData();

  useEffect(() => {
    if (!isAuthLoading && !profile) {
      router.replace("/auth/login");
    }
  }, [isAuthLoading, profile, router]);

  if (isAuthLoading || isLoading) {
    return <ScreenSpinner />;
  }

  if (!profile || !me) {
    return (
      <main className="px-4 py-6 md:px-8">
        <div className="mx-auto max-w-4xl">
          <EmptyState
            title="Не вдалося відкрити кабінет"
            description={error || "Спробуйте оновити сторінку або увійти знову."}
          />
        </div>
      </main>
    );
  }

  const navigationItems = navigationByRole[profile.role];

  return (
    <div className="min-h-screen px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-start gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_18px_42px_rgba(15,23,42,0.05)] md:sticky md:top-5">
          <nav className="grid gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActiveLink(pathname, item.href)
                      ? "bg-slate-950 text-white"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.1} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            type="button"
            onClick={() => {
              void logout();
            }}
          >
            <LogOut className="h-4 w-4" strokeWidth={2.1} />
            Вийти
          </button>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

"use client";

import {
  BookOpen,
  FileCheck2,
  GraduationCap,
  Home,
  Layers3,
  LogOut,
  Search,
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

const roleLabels: Record<ProfileRole, string> = {
  parent: "Батьківський кабінет",
  club: "Кабінет гуртка",
  school: "Шкільний кабінет",
};

const navigationByRole: Record<ProfileRole, NavigationItem[]> = {
  parent: [
    { href: "/dashboard/account", label: "Акаунт", icon: Home },
    { href: "/dashboard/children", label: "Діти", icon: Users },
    { href: "/dashboard/discover", label: "Пошук програм", icon: Search },
    { href: "/dashboard/requests", label: "Запити", icon: FileCheck2 },
  ],
  club: [
    { href: "/dashboard/account", label: "Акаунт", icon: Home },
    { href: "/dashboard/programs", label: "Програми", icon: Layers3 },
    { href: "/dashboard/requests", label: "Запити", icon: FileCheck2 },
  ],
  school: [
    { href: "/dashboard/account", label: "Акаунт", icon: Home },
    { href: "/dashboard/review", label: "Черга розгляду", icon: ShieldCheck },
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
    APPROVE: "Погодити",
    PARTIAL: "Частково погодити",
    REQUEST_CHANGES: "Попросити зміни",
    REJECT: "Відхилити",
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
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-white/60 bg-[linear-gradient(180deg,#0f172a,#10244f)] p-5 text-white shadow-[0_30px_80px_rgba(15,23,42,0.24)]">
          <Link className="flex items-center gap-3" href="/dashboard/account">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
              <GraduationCap className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-[-0.04em]">EduSync</span>
              <span className="block text-xs uppercase tracking-[0.22em] text-white/60">
                MVP платформи
              </span>
            </span>
          </Link>

          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-white/60">
              {roleLabels[profile.role]}
            </div>
            <div className="mt-3 text-xl font-semibold tracking-[-0.03em]">
              {me.account.displayName}
            </div>
            <div className="mt-1 text-sm text-white/70">{profile.email}</div>
            {me.account.city ? (
              <div className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
                {me.account.city}
              </div>
            ) : null}
          </div>

          <nav className="mt-8 grid gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActiveLink(pathname, item.href)
                      ? "bg-white text-slate-950"
                      : "text-white/78 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.1} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 space-y-4">
            <div className="rounded-[1.45rem] border border-blue-400/20 bg-blue-400/10 p-4 text-sm leading-6 text-white/82">
              Платформа фіксує запит, докази від гуртка та фінальне шкільне рішення
              без автоматичного перенесення оцінок.
            </div>

            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/12 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/8"
              type="button"
              onClick={() => {
                void logout();
              }}
            >
              <LogOut className="h-4 w-4" strokeWidth={2.1} />
              Вийти
            </button>
          </div>
        </aside>

        <main className="space-y-6">
          <div className="rounded-[1.8rem] border border-white/70 bg-white/70 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <BookOpen className="h-4 w-4 text-blue-600" strokeWidth={2.1} />
                <span>Структурований пакет доказів</span>
                <span className="text-slate-300">•</span>
                <span>AI-сумісність як підтримка рішення</span>
              </div>
              <Link
                href="/dashboard?guest=parent"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:bg-slate-50"
              >
                <Sparkles className="h-3.5 w-3.5 text-blue-600" strokeWidth={2.1} />
                Демо режим
              </Link>
            </div>
          </div>

          <div className="grid gap-4 lg:hidden">
            <div className="grid gap-2 sm:grid-cols-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${
                      isActiveLink(pathname, item.href)
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.1} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}

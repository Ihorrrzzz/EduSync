"use client";

import {
  ArrowRight,
  Brain,
  FileCheck2,
  GraduationCap,
  School,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { ScreenSpinner } from "../../components/screen-spinner";
import { useAuth } from "../../lib/auth-context";
import { parseProfileRole } from "../../lib/profile-utils";

const demoContent = {
  parent: {
    label: "Демо: родина",
    title: "Запит на врахування позашкільної програми",
    description:
      "У демо видно, як батьки додають дитину, обирають програму гуртка і подають запит на врахування до школи.",
    bullets: [
      "Каталог програм з фільтрами за предметом, містом та віком",
      "Статуси запиту: подано, AI готовий, на розгляді, рішення школи",
      "AI-підсумок без автоматичного перенесення оцінок",
    ],
  },
  club: {
    label: "Демо: гурток",
    title: "Структурована програма та пакет доказів",
    description:
      "Гурток описує модулі, результати навчання і формат оцінювання, а потім додає підсумок доказів для конкретного запиту.",
    bullets: [
      "Публікація програм із реальними полями, а не демо-текстом",
      "AI-аналіз для вибраного шкільного предмета та класу",
      "Передача відвідуваності та короткого звіту для школи",
    ],
  },
  school: {
    label: "Демо: школа",
    title: "Шкільна черга розгляду і фінальне рішення",
    description:
      "Школа бачить вхідні запити, AI-рекомендацію, прогалини і фіксує своє фінальне рішення з коментарем.",
    bullets: [
      "AI лише підсвічує сумісність і не приймає рішення замість школи",
      "Є статуси погодження, часткового погодження, змін або відхилення",
      "Зберігається фінальний коментар школи і перелік визнаних тем",
    ],
  },
} as const;

function DashboardEntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading, profile } = useAuth();
  const guestRole = parseProfileRole(searchParams.get("guest"));

  useEffect(() => {
    if (guestRole) {
      return;
    }

    if (!isLoading && profile) {
      router.replace("/dashboard/account");
      return;
    }

    if (!isLoading && !profile) {
      router.replace("/auth/login");
    }
  }, [guestRole, isLoading, profile, router]);

  if (isLoading || (!guestRole && !profile)) {
    return <ScreenSpinner />;
  }

  if (!guestRole) {
    return <ScreenSpinner />;
  }

  const content = demoContent[guestRole];
  const Icon =
    guestRole === "parent" ? Users : guestRole === "club" ? GraduationCap : School;

  return (
    <main className="px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(37,99,255,0.16),rgba(255,255,255,0.92))] p-8 shadow-[0_28px_70px_rgba(37,99,255,0.14)]">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-blue-700">
                {content.label}
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
                {content.title}
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-600">{content.description}</p>
            </div>

            <div className="grid h-16 w-16 place-items-center rounded-[1.6rem] bg-white text-blue-600 shadow-[0_16px_30px_rgba(37,99,255,0.15)]">
              <Icon className="h-7 w-7" strokeWidth={2.1} />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.24)] transition hover:bg-blue-700"
            >
              Увійти в реальний кабінет
              <ArrowRight className="h-4 w-4" strokeWidth={2.1} />
            </Link>
            <Link
              href={`/auth/register?role=${guestRole}`}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Створити акаунт
            </Link>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_18px_42px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3 text-blue-700">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50">
                <FileCheck2 className="h-5 w-5" strokeWidth={2.1} />
              </span>
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em]">
                  Що є в MVP
                </div>
                <div className="text-lg font-semibold text-slate-950">
                  Реальний процес замість демо-обіцянок
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {content.bullets.map((bullet) => (
                <div
                  key={bullet}
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-6 text-slate-700"
                >
                  {bullet}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[1.8rem] border border-blue-100 bg-[linear-gradient(180deg,#f8fbff,#eef5ff)] p-6 shadow-[0_18px_42px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3 text-blue-700">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-sm">
                <Brain className="h-5 w-5" strokeWidth={2.1} />
              </span>
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em]">
                  AI рекомендація
                </div>
                <div className="text-lg font-semibold text-slate-950">Дорадчий інструмент</div>
              </div>
            </div>

            <div className="mt-6 space-y-4 text-sm leading-6 text-slate-700">
              <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-4">
                <div className="font-semibold text-emerald-700">Три рівні рекомендації</div>
                <div className="mt-1">
                  Сервіс показує обережний band сумісності, але не підміняє школу.
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                Пояснення включає покриті результати навчання, прогалини та
                рекомендовані докази,
                щоб школа бачила логіку рекомендації.
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 text-amber-900">
                Фінальне рішення щодо врахування програми завжди залишається за школою.
              </div>
            </div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              <Sparkles className="h-4 w-4" strokeWidth={2.1} />
              Гостьовий перегляд
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

export default function DashboardEntryPage() {
  return (
    <Suspense fallback={<ScreenSpinner />}>
      <DashboardEntryContent />
    </Suspense>
  );
}

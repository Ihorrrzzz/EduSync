"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  AdvisoryNote,
  EmptyState,
  MetricCard,
  PageHeading,
  SurfaceCard,
} from "../../../../components/dashboard-shell";
import { ScreenSpinner } from "../../../../components/screen-spinner";
import { subjectOptions } from "../../../../lib/subject-options";
import { updateMyProfile } from "../../../../lib/mvp-api";
import { useRoleAccess } from "../../../../lib/use-role-access";

function getAccountCopy(role: "parent" | "club" | "school") {
  if (role === "parent") {
    return {
      eyebrow: "Акаунт родини",
      title: "Профіль батьківського кабінету",
      description:
        "Оновіть основні дані профілю та швидко переходьте до дітей, каталогу програм і власних запитів.",
      metrics: [
        {
          label: "Діти",
          valueKey: "childrenCount",
          hint: "Керування профілями дітей і прив'язкою до школи.",
        },
        {
          label: "Активні запити",
          valueKey: "activeRequests",
          hint: "Запити, де процес ще не завершився фінальним рішенням.",
        },
        {
          label: "Погоджені",
          valueKey: "approvedRequests",
          hint: "Запити, де школа вже зберегла своє рішення.",
        },
      ],
      actions: [
        { href: "/dashboard/children", label: "Додати дитину" },
        { href: "/dashboard/discover", label: "Знайти програму" },
        { href: "/dashboard/requests", label: "Перейти до запитів" },
      ],
    };
  }

  if (role === "club") {
    return {
      eyebrow: "Акаунт гуртка",
      title: "Профіль організації",
      description:
        "Тут оновлюються контактні дані гуртка, ключові предметні напрями та швидкі переходи до програм і запитів.",
      metrics: [
        {
          label: "Програми",
          valueKey: "programsCount",
          hint: "Усі програми, які гурток додав до платформи.",
        },
        {
          label: "Опубліковані",
          valueKey: "publishedProgramsCount",
          hint: "Програми, видимі батькам у каталозі.",
        },
        {
          label: "Потрібні докази",
          valueKey: "requestsNeedingEvidenceCount",
          hint: "Запити, де школа або батьки ще чекають підсумок доказів.",
        },
      ],
      actions: [
        { href: "/dashboard/programs", label: "Додати програму" },
        { href: "/dashboard/programs", label: "AI-аналіз" },
        { href: "/dashboard/requests", label: "Відкрити запити" },
      ],
    };
  }

  return {
    eyebrow: "Акаунт школи",
    title: "Профіль шкільного кабінету",
    description:
      "Оновіть назву та місто школи, а далі працюйте з чергою розгляду і фінальними рішеннями.",
    metrics: [
      {
        label: "Очікують розгляду",
        valueKey: "pendingReviews",
        hint: "Запити, які чекають первинного або активного розгляду школи.",
      },
      {
        label: "Погоджені",
        valueKey: "approvedRequests",
        hint: "Запити зі збереженим позитивним або частковим рішенням.",
      },
      {
        label: "Увага потрібна",
        valueKey: "attentionRequired",
        hint: "Відхилені запити або запити з вимогою доопрацювання.",
      },
    ],
    actions: [
      { href: "/dashboard/review", label: "Відкрити чергу" },
      { href: "/dashboard/review", label: "Подивитися рішення" },
    ],
  };
}

export default function DashboardAccountPage() {
  const { me, isLoading, isAllowed, refreshMe } = useRoleAccess([
    "parent",
    "club",
    "school",
  ]);
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!me) {
      return;
    }

    setDisplayName(me.account.displayName);
    setCity(me.account.city ?? "");
    setSubjects(me.account.subjects);
  }, [me]);

  if (isLoading) {
    return <ScreenSpinner />;
  }

  if (!me || !isAllowed) {
    return (
      <EmptyState
        title="Кабінет недоступний"
        description="Потрібно увійти з відповідною роллю, щоб працювати з профілем."
      />
    );
  }

  const copy = getAccountCopy(me.profile.role);

  const toggleSubject = (subject: string) => {
    setSubjects((currentValue) =>
      currentValue.includes(subject)
        ? currentValue.filter((item) => item !== subject)
        : [...currentValue, subject],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setStatus("");
    setIsSubmitting(true);

    try {
      await updateMyProfile({
        displayName,
        city,
        subjects: me.profile.role === "club" ? subjects : undefined,
      });
      await refreshMe();
      setStatus("Профіль оновлено.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Не вдалося оновити профіль",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={copy.actions.map((action) => (
          <Link
            key={action.href + action.label}
            href={action.href}
            className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {action.label}
          </Link>
        ))}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {copy.metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={me.summary[metric.valueKey] ?? 0}
            hint={metric.hint}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SurfaceCard>
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              Редагування профілю
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Email використовується для входу й тут показується тільки для перегляду.
            </p>
          </div>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="displayName">
                {me.profile.role === "school"
                  ? "Назва школи"
                  : me.profile.role === "club"
                    ? "Назва організації"
                    : "Ім'я для кабінету"}
              </label>
              <input
                id="displayName"
                className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="h-14 rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-500"
                value={me.profile.email}
                readOnly
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="city">
                Місто
              </label>
              <input
                id="city"
                className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Наприклад, Київ"
              />
            </div>

            {me.profile.role === "club" ? (
              <div className="grid gap-3">
                <div className="text-sm font-medium text-slate-700">Предметні напрями</div>
                <div className="flex flex-wrap gap-2">
                  {subjectOptions.map((subject) => {
                    const isActive = subjects.includes(subject);

                    return (
                      <button
                        key={subject}
                        type="button"
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          isActive
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                        onClick={() => toggleSubject(subject)}
                      >
                        {subject}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {status ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {status}
              </div>
            ) : null}

            <button
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.22)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Збереження..." : "Зберегти профіль"}
            </button>
          </form>
        </SurfaceCard>

        <div className="space-y-6">
          <AdvisoryNote />

          <SurfaceCard>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
              Що вже працює в MVP
            </h2>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                Дані акаунта зберігаються в PostgreSQL через Prisma.
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                Форми в особистому кабінеті працюють з реальними API-ендпоінтами.
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                AI-рекомендація зберігається окремо від фінального рішення школи.
              </div>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}

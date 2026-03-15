"use client";

import { ArrowRight, CheckCircle2, Mail, MapPin, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  EmptyState,
  MetricCard,
  PageHeading,
  SurfaceCard,
} from "../../../../components/dashboard-shell";
import { ScreenSpinner } from "../../../../components/screen-spinner";
import { subjectOptions } from "../../../../lib/subject-options";
import { updateMyProfile } from "../../../../lib/mvp-api";
import { useRoleAccess } from "../../../../lib/use-role-access";

type AccountRole = "parent" | "club" | "school";

function getAccountCopy(role: AccountRole) {
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

function getDisplayNameLabel(role: AccountRole) {
  if (role === "school") {
    return "Назва школи";
  }

  if (role === "club") {
    return "Назва організації";
  }

  return "Ім'я та прізвище";
}

function getProfileGuide(role: AccountRole) {
  if (role === "parent") {
    return {
      summaryDescription:
        "Профіль родини показує школі та гурткам, хто створює запити, до якого міста належить кабінет і де шукати наступні дії.",
      cityHint: "Місто допомагає швидше підбирати школу та програми для дітей.",
      completionHint: "Базовий профіль достатній для створення дітей і нових запитів.",
    };
  }

  if (role === "club") {
    return {
      summaryDescription:
        "Цей профіль формує представлення гуртка в каталозі, у списку програм і в комунікації зі школами.",
      cityHint: "Місто впливає на видимість у каталозі та локальні фільтри для батьків.",
      completionHint:
        "Для гуртка важливо позначити предметні напрями, щоб програми знаходилися швидше.",
    };
  }

  return {
    summaryDescription:
      "Дані профілю школи використовуються в черзі розгляду, у прив'язці дітей та в остаточних рішеннях по запитах.",
    cityHint: "Місто допомагає родинам коректно знаходити школу під час створення профілю дитини.",
    completionHint: "Заповнений профіль школи спрощує розпізнавання організації в усіх запитах.",
  };
}

function areSubjectsEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();

  return leftSorted.every((subject, index) => subject === rightSorted[index]);
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
  const guide = getProfileGuide(me.profile.role);
  const initialDisplayName = me.account.displayName.trim();
  const initialCity = (me.account.city ?? "").trim();
  const normalizedDisplayName = displayName.trim();
  const normalizedCity = city.trim();
  const hasSubjectChanges =
    me.profile.role === "club" ? !areSubjectsEqual(subjects, me.account.subjects) : false;
  const hasChanges =
    normalizedDisplayName !== initialDisplayName ||
    normalizedCity !== initialCity ||
    hasSubjectChanges;
  const canSubmit = normalizedDisplayName.length > 0 && hasChanges && !isSubmitting;
  const completionItems = [
    {
      label: "Тип акаунта",
      value: copy.eyebrow,
      isComplete: true,
    },
    {
      label: getDisplayNameLabel(me.profile.role),
      value: normalizedDisplayName || "Додайте основну назву профілю.",
      isComplete: normalizedDisplayName.length > 0,
    },
    {
      label: "Email для входу",
      value: me.profile.email,
      isComplete: true,
    },
    {
      label: "Місто",
      value: normalizedCity || guide.cityHint,
      isComplete: normalizedCity.length > 0,
    },
    ...(me.profile.role === "club"
      ? [
          {
            label: "Предметні напрями",
            value:
              subjects.length > 0
                ? `${subjects.length} напрям${subjects.length === 1 ? "" : subjects.length < 5 ? "и" : "ів"} вибрано`
                : "Позначте напрями, з якими працює гурток.",
            isComplete: subjects.length > 0,
          },
        ]
      : []),
  ];
  const completedItemsCount = completionItems.filter((item) => item.isComplete).length;
  const completionProgress = Math.round(
    (completedItemsCount / completionItems.length) * 100,
  );

  const resetForm = () => {
    setDisplayName(me.account.displayName);
    setCity(me.account.city ?? "");
    setSubjects(me.account.subjects);
    setError("");
    setStatus("");
  };

  const clearFeedback = () => {
    if (error) {
      setError("");
    }

    if (status) {
      setStatus("");
    }
  };

  const toggleSubject = (subject: string) => {
    clearFeedback();
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
        displayName: normalizedDisplayName,
        city: normalizedCity || null,
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
            className="inline-flex items-center rounded-2xl border border-slate-900/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(15,23,42,0.16)] transition hover:bg-slate-800"
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_360px]">
        <SurfaceCard className="overflow-hidden p-0">
          <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  Редагування профілю
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Оновіть основні дані кабінету. Email використовується для входу й змінюється
                  окремо.
                </p>
              </div>
              <div
                className={`inline-flex rounded-full border px-4 py-2 text-xs font-semibold ${
                  hasChanges
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {hasChanges ? "Є незбережені зміни" : "Усі зміни збережені"}
              </div>
            </div>
          </div>

          <form className="grid gap-6 px-6 py-6" onSubmit={handleSubmit}>
            <div className="grid gap-6 rounded-[1.6rem] border border-slate-200 bg-white p-5">
              <div>
                <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                  Основні дані
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{guide.completionHint}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="displayName">
                    {getDisplayNameLabel(me.profile.role)}
                  </label>
                  <input
                    id="displayName"
                    className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    value={displayName}
                    onChange={(event) => {
                      clearFeedback();
                      setDisplayName(event.target.value);
                    }}
                    required
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
                    onChange={(event) => {
                      clearFeedback();
                      setCity(event.target.value);
                    }}
                    placeholder="Наприклад, Київ"
                  />
                  <p className="text-xs leading-5 text-slate-500">{guide.cityHint}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 rounded-[1.6rem] border border-slate-200 bg-slate-50/70 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="email">
                  Email для входу
                </label>
                <input
                  id="email"
                  className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-500"
                  value={me.profile.email}
                  readOnly
                />
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                <Mail className="h-4 w-4 text-blue-600" strokeWidth={2.1} />
                Тільки перегляд
              </div>
            </div>

            {me.profile.role === "club" ? (
              <div className="grid gap-4 rounded-[1.6rem] border border-slate-200 bg-white p-5">
                <div>
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                    Предметні напрями
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Відзначте напрями, які пов'язані з програмами гуртка та пошуком у каталозі.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {subjectOptions.map((subject) => {
                    const isActive = subjects.includes(subject);

                    return (
                      <button
                        key={subject}
                        type="button"
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          isActive
                            ? "border-blue-200 bg-blue-50 text-blue-700 shadow-[0_10px_24px_rgba(37,99,255,0.12)]"
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

            <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6">
              <button
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.22)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                type="submit"
                disabled={!canSubmit}
              >
                {isSubmitting
                  ? "Збереження..."
                  : hasChanges
                    ? "Зберегти зміни"
                    : "Дані синхронізовано"}
              </button>

              <button
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
                type="button"
                onClick={resetForm}
                disabled={!hasChanges || isSubmitting}
              >
                <RotateCcw className="h-4 w-4" strokeWidth={2.1} />
                Скасувати зміни
              </button>

              <div className="text-sm text-slate-500">
                {hasChanges
                  ? "Поточні зміни ще не збережені."
                  : "Профіль готовий до роботи без додаткових дій."}
              </div>
            </div>
          </form>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard className="overflow-hidden p-0">
            <div className="bg-[linear-gradient(135deg,#0f172a,#123a7c_62%,#2563ff)] px-6 py-6 text-white">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
                Стан профілю
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
                {normalizedDisplayName || me.account.displayName}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/78">{guide.summaryDescription}</p>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div>
                <div className="flex items-center justify-between text-sm font-semibold text-slate-950">
                  <span>Готовність профілю</span>
                  <span className="text-blue-700">{completionProgress}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all"
                    style={{ width: `${completionProgress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {completionItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4"
                  >
                    <CheckCircle2
                      className={`mt-0.5 h-5 w-5 ${
                        item.isComplete ? "text-emerald-600" : "text-slate-300"
                      }`}
                      strokeWidth={2.1}
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-950">{item.label}</div>
                      <div className="mt-1 text-sm leading-6 text-slate-500">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                  <Mail className="h-3.5 w-3.5 text-blue-600" strokeWidth={2.1} />
                  {me.profile.email}
                </div>
                {normalizedCity ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" strokeWidth={2.1} />
                    {normalizedCity}
                  </div>
                ) : null}
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
              Швидкі переходи
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Після оновлення профілю одразу переходьте до наступних задач вашого кабінету.
            </p>

            <div className="mt-5 grid gap-3">
              {copy.actions.map((action) => (
                <Link
                  key={`sidebar-${action.href}-${action.label}`}
                  href={action.href}
                  className="group flex items-center justify-between rounded-[1.4rem] border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <span>{action.label}</span>
                  <ArrowRight
                    className="h-4 w-4 transition group-hover:translate-x-1"
                    strokeWidth={2.1}
                  />
                </Link>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}

"use client";

import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Compass,
  Mail,
  MapPin,
  RotateCcw,
  Save,
  School,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { EmptyState, SurfaceCard } from "../../../../components/dashboard-shell";
import { ScreenSpinner } from "../../../../components/screen-spinner";
import { subjectOptions } from "../../../../lib/subject-options";
import { updateMyProfile } from "../../../../lib/mvp-api";
import { useRoleAccess } from "../../../../lib/use-role-access";

type AccountRole = "parent" | "club" | "school";

type AccountMetric = {
  label: string;
  valueKey: string;
  hint: string;
};

type AccountAction = {
  href: string;
  label: string;
  hint: string;
};

type AccountTheme = {
  heroSurfaceClass: string;
  badgeClass: string;
  iconSurfaceClass: string;
  infoPillClass: string;
  metricSurfaceClass: string;
  sectionSurfaceClass: string;
  progressClass: string;
  primaryButtonClass: string;
  activeSubjectClass: string;
  actionHoverClass: string;
};

type AccountCopy = {
  eyebrow: string;
  title: string;
  description: string;
  readinessLabel: string;
  metrics: AccountMetric[];
  actions: AccountAction[];
};

type SectionNavigationItem = {
  id: string;
  label: string;
  hint: string;
};

const roleIcons: Record<AccountRole, LucideIcon> = {
  parent: Users,
  club: Building2,
  school: School,
};

const roleThemes: Record<AccountRole, AccountTheme> = {
  parent: {
    heroSurfaceClass:
      "border-sky-200/80 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.2),transparent_36%),linear-gradient(180deg,#ffffff_0%,#eff6ff_55%,#f0fdf9_100%)]",
    badgeClass: "border-sky-200 bg-sky-950 text-sky-50",
    iconSurfaceClass:
      "border-sky-200 bg-white text-sky-800 shadow-[0_18px_42px_rgba(14,165,233,0.16)]",
    infoPillClass: "border-sky-200/80 bg-sky-50 text-sky-950",
    metricSurfaceClass: "border-sky-100 bg-white/90",
    sectionSurfaceClass: "border-sky-100 bg-sky-50/55",
    progressClass: "bg-sky-700",
    primaryButtonClass:
      "bg-sky-700 text-white shadow-[0_18px_35px_rgba(3,105,161,0.2)] hover:bg-sky-800 disabled:bg-sky-300",
    activeSubjectClass:
      "border-sky-200 bg-sky-100 text-sky-900 shadow-[0_10px_24px_rgba(14,165,233,0.14)]",
    actionHoverClass: "hover:border-sky-200 hover:bg-sky-50 hover:text-sky-900",
  },
  club: {
    heroSurfaceClass:
      "border-amber-200/80 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.22),transparent_36%),linear-gradient(180deg,#fffef8_0%,#fff8eb_55%,#f0fdf4_100%)]",
    badgeClass: "border-amber-200 bg-amber-950 text-amber-50",
    iconSurfaceClass:
      "border-amber-200 bg-white text-amber-800 shadow-[0_18px_42px_rgba(245,158,11,0.16)]",
    infoPillClass: "border-amber-200/80 bg-amber-50 text-amber-950",
    metricSurfaceClass: "border-amber-100 bg-white/90",
    sectionSurfaceClass: "border-amber-100 bg-amber-50/55",
    progressClass: "bg-amber-700",
    primaryButtonClass:
      "bg-amber-700 text-white shadow-[0_18px_35px_rgba(180,83,9,0.2)] hover:bg-amber-800 disabled:bg-amber-300",
    activeSubjectClass:
      "border-amber-200 bg-amber-100 text-amber-900 shadow-[0_10px_24px_rgba(245,158,11,0.14)]",
    actionHoverClass: "hover:border-amber-200 hover:bg-amber-50 hover:text-amber-900",
  },
  school: {
    heroSurfaceClass:
      "border-indigo-200/80 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_36%),linear-gradient(180deg,#ffffff_0%,#eef2ff_55%,#eff6ff_100%)]",
    badgeClass: "border-indigo-200 bg-indigo-950 text-indigo-50",
    iconSurfaceClass:
      "border-indigo-200 bg-white text-indigo-800 shadow-[0_18px_42px_rgba(99,102,241,0.16)]",
    infoPillClass: "border-indigo-200/80 bg-indigo-50 text-indigo-950",
    metricSurfaceClass: "border-indigo-100 bg-white/90",
    sectionSurfaceClass: "border-indigo-100 bg-indigo-50/55",
    progressClass: "bg-indigo-700",
    primaryButtonClass:
      "bg-indigo-700 text-white shadow-[0_18px_35px_rgba(79,70,229,0.2)] hover:bg-indigo-800 disabled:bg-indigo-300",
    activeSubjectClass:
      "border-indigo-200 bg-indigo-100 text-indigo-900 shadow-[0_10px_24px_rgba(99,102,241,0.14)]",
    actionHoverClass: "hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-900",
  },
};

const sectionNavigationByRole: Record<AccountRole, SectionNavigationItem[]> = {
  parent: [
    { id: "overview", label: "Огляд", hint: "Готовність і ключові показники" },
    { id: "identity", label: "Основні дані", hint: "Ім'я, місто, email" },
    { id: "family-context", label: "Діти та сім'я", hint: "Склад кабінету та контекст" },
    { id: "request-progress", label: "Запити", hint: "Активність і прогрес рішень" },
    { id: "actions", label: "Наступні дії", hint: "Робочі переходи для батьків" },
  ],
  club: [
    { id: "overview", label: "Огляд", hint: "Присутність і готовність гуртка" },
    { id: "identity", label: "Організація", hint: "Назва, місто, email" },
    { id: "subjects", label: "Напрями", hint: "Редагування предметних напрямів" },
    { id: "catalog-programs", label: "Каталог і програми", hint: "Публікація та доказова черга" },
    { id: "actions", label: "Наступні дії", hint: "Операційні переходи гуртка" },
  ],
  school: [
    { id: "overview", label: "Огляд", hint: "Стан профілю й операцій" },
    { id: "identity", label: "Дані школи", hint: "Назва, місто, email" },
    { id: "review-queue", label: "Черга розгляду", hint: "Активна перевірка кейсів" },
    { id: "decision-signals", label: "Рішення", hint: "Фінальні сигнали та контекст" },
    { id: "actions", label: "Наступні дії", hint: "Основні переходи для школи" },
  ],
};

function WorkspaceSection({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <SurfaceCard className="overflow-hidden border-slate-200/90 bg-white/92 p-0 shadow-[0_18px_52px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-5">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {eyebrow}
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <div className="px-6 py-6">{children}</div>
      </SurfaceCard>
    </section>
  );
}

function MetricPanel({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: number | string;
  hint: string;
  className: string;
}) {
  return (
    <div className={`rounded-[1.6rem] border p-5 shadow-[0_14px_34px_rgba(15,23,42,0.04)] ${className}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">{value}</div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{hint}</p>
    </div>
  );
}

function getAccountCopy(role: AccountRole): AccountCopy {
  if (role === "parent") {
    return {
      eyebrow: "Акаунт родини",
      title: "Профіль батьківського кабінету",
      description:
        "Керуйте базовими даними родини, швидко переходьте до дітей і тримайте під рукою актуальну картину запитів після входу.",
      readinessLabel: "Профіль родини",
      metrics: [
        {
          label: "Діти",
          valueKey: "childrenCount",
          hint: "Профілі дітей, прив'язані до цього сімейного кабінету.",
        },
        {
          label: "Активні запити",
          valueKey: "activeRequests",
          hint: "Подання, які ще проходять розгляд або очікують рішення.",
        },
        {
          label: "Погоджені",
          valueKey: "approvedRequests",
          hint: "Запити, за якими школа вже зберегла фінальний висновок.",
        },
      ],
      actions: [
        {
          href: "/dashboard/children",
          label: "Керувати дітьми",
          hint: "Додавайте профілі дітей і перевіряйте їхню шкільну прив'язку.",
        },
        {
          href: "/dashboard/discover",
          label: "Знайти програму",
          hint: "Підбирайте гуртки та програми за предметом, віком або містом.",
        },
        {
          href: "/dashboard/requests",
          label: "Переглянути запити",
          hint: "Слідкуйте за етапами подань і рішеннями шкіл.",
        },
      ],
    };
  }

  if (role === "club") {
    return {
      eyebrow: "Акаунт гуртка",
      title: "Профіль організації",
      description:
        "Підтримуйте публічне представлення гуртка, керуйте предметними напрямами та контролюйте, як організація виглядає в каталозі й заявках.",
      readinessLabel: "Профіль гуртка",
      metrics: [
        {
          label: "Програми",
          valueKey: "programsCount",
          hint: "Усі програми, які гурток уже створив на платформі.",
        },
        {
          label: "Опубліковані",
          valueKey: "publishedProgramsCount",
          hint: "Програми, видимі родинам у каталозі й пошуку.",
        },
        {
          label: "Потрібні докази",
          valueKey: "requestsNeedingEvidenceCount",
          hint: "Запити, де гурток ще має оновити або додати підсумки.",
        },
      ],
      actions: [
        {
          href: "/dashboard/programs",
          label: "Керувати програмами",
          hint: "Оновлюйте описи, структуру і статус публікації програм.",
        },
        {
          href: "/dashboard/programs",
          label: "Додати нову програму",
          hint: "Розгорніть новий навчальний напрям для каталогу та подань.",
        },
        {
          href: "/dashboard/requests",
          label: "Відкрити запити",
          hint: "Перевірте, де потрібні докази або відповіді гуртка.",
        },
      ],
    };
  }

  return {
    eyebrow: "Акаунт школи",
    title: "Профіль шкільного кабінету",
    description:
      "Підтримуйте шкільний профіль у робочому стані, щоб черга розгляду, фінальні рішення і прив'язка дітей не втрачали контекст організації.",
    readinessLabel: "Профіль школи",
    metrics: [
      {
        label: "Очікують розгляду",
        valueKey: "pendingReviews",
        hint: "Запити, які вже в черзі та потребують старту або продовження перевірки.",
      },
      {
        label: "Погоджені",
        valueKey: "approvedRequests",
        hint: "Заявки з позитивним або частково позитивним рішенням школи.",
      },
      {
        label: "Увага потрібна",
        valueKey: "attentionRequired",
        hint: "Відхилені або повернуті на доопрацювання кейси.",
      },
    ],
    actions: [
      {
        href: "/dashboard/review",
        label: "Відкрити чергу",
        hint: "Поверніться до кейсів, які зараз чекають розгляду.",
      },
      {
        href: "/dashboard/review",
        label: "Переглянути рішення",
        hint: "Оцініть поточний стан уже оброблених запитів.",
      },
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
        "Профіль родини допомагає швидко зрозуміти, хто створює запити, скільки дітей у кабінеті та наскільки все готово до наступних дій.",
      cityHint: "Місто допомагає швидше підбирати школу та програми для дітей.",
      completionHint: "Базовий профіль достатній для створення дітей і нових запитів.",
    };
  }

  if (role === "club") {
    return {
      summaryDescription:
        "Профіль гуртка працює як візитка в каталозі, у списку програм і в комунікації зі школами та батьками.",
      cityHint: "Місто впливає на локальні фільтри та видимість гуртка в каталозі.",
      completionHint:
        "Для гуртка важливо позначити предметні напрями, щоб програми знаходилися швидше.",
    };
  }

  return {
    summaryDescription:
      "Дані профілю школи використовуються в черзі розгляду, у прив'язці дітей і у фінальних рішеннях по кожному запиту.",
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

  const role = me.profile.role;
  const copy = getAccountCopy(role);
  const guide = getProfileGuide(role);
  const theme = roleThemes[role];
  const RoleIcon = roleIcons[role];
  const sectionNavigation = sectionNavigationByRole[role];
  const initialDisplayName = me.account.displayName.trim();
  const initialCity = (me.account.city ?? "").trim();
  const normalizedDisplayName = displayName.trim();
  const normalizedCity = city.trim();
  const hasSubjectChanges = role === "club" ? !areSubjectsEqual(subjects, me.account.subjects) : false;
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
      label: getDisplayNameLabel(role),
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
    ...(role === "club"
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
  const completionProgress = Math.round((completedItemsCount / completionItems.length) * 100);
  const primaryAction = copy.actions[0];
  const inputClassName =
    "h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5";

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
        subjects: role === "club" ? subjects : undefined,
      });
      await refreshMe();
      setStatus("Профіль оновлено.");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Не вдалося оновити профіль",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <SurfaceCard
          className={`overflow-hidden border-slate-200/90 p-0 shadow-[0_18px_52px_rgba(15,23,42,0.06)] ${theme.heroSurfaceClass}`}
        >
          <div className="px-5 py-5">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${theme.badgeClass}`}
            >
              <RoleIcon className="h-3.5 w-3.5" strokeWidth={2.1} />
              {copy.eyebrow}
            </div>

            <div className="mt-4 flex items-start gap-4">
              <div
                className={`grid h-14 w-14 place-items-center rounded-[1.4rem] border ${theme.iconSurfaceClass}`}
              >
                <RoleIcon className="h-6 w-6" strokeWidth={2.1} />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
                  {normalizedDisplayName || me.account.displayName}
                </div>
                <div className="mt-1 text-sm text-slate-600">{me.profile.email}</div>
                {normalizedCity ? (
                  <div
                    className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${theme.infoPillClass}`}
                  >
                    <MapPin className="h-3.5 w-3.5" strokeWidth={2.1} />
                    {normalizedCity}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white/85 p-4">
              <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-900">
                <span>Готовність профілю</span>
                <span>{completionProgress}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200">
                <div
                  className={`h-2 rounded-full transition-all ${theme.progressClass}`}
                  style={{ width: `${completionProgress}%` }}
                />
              </div>
              <div className="mt-3 text-sm text-slate-600">
                {completedItemsCount} з {completionItems.length} блоків профілю заповнено.
              </div>
            </div>

            <Link
              href={primaryAction.href}
              className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed ${theme.primaryButtonClass}`}
            >
              {primaryAction.label}
              <ArrowRight className="h-4 w-4" strokeWidth={2.1} />
            </Link>
          </div>
        </SurfaceCard>

        <SurfaceCard className="border-slate-200/90 bg-white/92 shadow-[0_18px_52px_rgba(15,23,42,0.06)]">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Навігація профілю
          </div>
          <nav className="mt-4 grid gap-2">
            {sectionNavigation.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`rounded-[1.35rem] border border-slate-200 bg-slate-50/80 px-4 py-3 transition ${theme.actionHoverClass}`}
              >
                <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">{item.hint}</div>
              </a>
            ))}
          </nav>
        </SurfaceCard>

        <SurfaceCard className="border-slate-200/90 bg-white/92 shadow-[0_18px_52px_rgba(15,23,42,0.06)]">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Стан редагування
          </div>
          <div
            className={`mt-3 rounded-[1.35rem] border px-4 py-4 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : status
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : hasChanges
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            {error ||
              status ||
              (hasChanges
                ? "Є незбережені зміни. Після редагування перейдіть до блоку основних даних і збережіть їх."
                : "Профіль синхронізований і готовий до роботи.")}
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{guide.summaryDescription}</p>
        </SurfaceCard>
      </aside>

      <div className="space-y-6">
        <WorkspaceSection
          id="overview"
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="grid gap-4 md:grid-cols-3">
              {copy.metrics.map((metric) => (
                <MetricPanel
                  key={metric.label}
                  label={metric.label}
                  value={me.summary[metric.valueKey] ?? 0}
                  hint={metric.hint}
                  className={theme.metricSurfaceClass}
                />
              ))}
            </div>

            <div className={`rounded-[1.75rem] border p-5 ${theme.sectionSurfaceClass}`}>
              <div className="flex items-start gap-3">
                <div
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${theme.iconSurfaceClass}`}
                >
                  <Sparkles className="h-5 w-5" strokeWidth={2.1} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-950">Операційний фокус</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{guide.summaryDescription}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${theme.infoPillClass}`}
                >
                  <Mail className="h-4 w-4" strokeWidth={2.1} />
                  {me.profile.email}
                </div>
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${theme.infoPillClass}`}
                >
                  <RoleIcon className="h-4 w-4" strokeWidth={2.1} />
                  {copy.readinessLabel}
                </div>
                {normalizedCity ? (
                  <div
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${theme.infoPillClass}`}
                  >
                    <MapPin className="h-4 w-4" strokeWidth={2.1} />
                    {normalizedCity}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </WorkspaceSection>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <WorkspaceSection
            id="identity"
            eyebrow="Основні дані"
            title={getDisplayNameLabel(role)}
            description={guide.completionHint}
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_280px]">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="displayName">
                  {getDisplayNameLabel(role)}
                </label>
                <input
                  id="displayName"
                  className={inputClassName}
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
                  className={inputClassName}
                  value={city}
                  onChange={(event) => {
                    clearFeedback();
                    setCity(event.target.value);
                  }}
                  placeholder="Наприклад, Київ"
                />
                <p className="text-xs leading-5 text-slate-500">{guide.cityHint}</p>
              </div>

              <div className={`rounded-[1.6rem] border p-4 ${theme.sectionSurfaceClass}`}>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Доступ
                </div>
                <label className="mt-3 block text-sm font-medium text-slate-700" htmlFor="email">
                  Email для входу
                </label>
                <input
                  id="email"
                  className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700"
                  value={me.profile.email}
                  readOnly
                />
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                  <Mail className="h-3.5 w-3.5 text-slate-900" strokeWidth={2.1} />
                  Тільки перегляд
                </div>
              </div>
            </div>
          </WorkspaceSection>

          {role === "club" ? (
            <WorkspaceSection
              id="subjects"
              eyebrow="Предметні напрями"
              title="Навчальні напрями гуртка"
              description="Окремий блок для керування предметними напрямами, щоб програми точніше знаходилися в каталозі."
            >
              <div className="flex flex-wrap gap-2">
                {subjectOptions.map((subject) => {
                  const isActive = subjects.includes(subject);

                  return (
                    <button
                      key={subject}
                      type="button"
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        isActive
                          ? theme.activeSubjectClass
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                      onClick={() => toggleSubject(subject)}
                    >
                      {subject}
                    </button>
                  );
                })}
              </div>
            </WorkspaceSection>
          ) : null}

          <SurfaceCard className="border-slate-200/90 bg-white/92 shadow-[0_18px_52px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-center gap-3">
              <button
                className={`inline-flex h-14 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed ${theme.primaryButtonClass}`}
                type="submit"
                disabled={!canSubmit}
              >
                <Save className="h-4 w-4" strokeWidth={2.1} />
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

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {status ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {status}
              </div>
            ) : null}
          </SurfaceCard>
        </form>

        {role === "parent" ? (
          <>
            <WorkspaceSection
              id="family-context"
              eyebrow="Діти та сім'я"
              title="Сімейний контекст кабінету"
              description="Окремий блок про склад сімейного кабінету та логіку прив'язки дітей до шкіл."
            >
              <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
                <MetricPanel
                  label="Профілі дітей"
                  value={me.summary.childrenCount ?? 0}
                  hint="Саме цей блок визначає, скільки профілів доступно для нових заявок і шкільних зв'язків."
                  className={theme.metricSurfaceClass}
                />
                <div className={`rounded-[1.75rem] border p-5 ${theme.sectionSurfaceClass}`}>
                  <div className="flex items-start gap-3">
                    <div
                      className={`grid h-11 w-11 place-items-center rounded-2xl border ${theme.iconSurfaceClass}`}
                    >
                      <Users className="h-5 w-5" strokeWidth={2.1} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-950">
                        Керування дітьми винесене в окремий робочий блок
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        У профілі батьків зберігаються лише базові дані родини. Додавання дитини,
                        школа, вік і примітки живуть у спеціальному розділі для дітей, щоб не
                        змішувати персональні дані з робочими записами.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/children"
                    className={`mt-5 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition ${theme.actionHoverClass}`}
                  >
                    Перейти до дітей
                    <ArrowRight className="h-4 w-4" strokeWidth={2.1} />
                  </Link>
                </div>
              </div>
            </WorkspaceSection>

            <WorkspaceSection
              id="request-progress"
              eyebrow="Запити"
              title="Активність і прогрес заявок"
              description="Блок для швидкого розуміння, де сім'я зараз у процесі подань і рішень."
            >
              <div className="grid gap-4 lg:grid-cols-3">
                <MetricPanel
                  label="Активні запити"
                  value={me.summary.activeRequests ?? 0}
                  hint="Кейси, у яких ще триває розгляд, збір доказів або очікується рішення."
                  className={theme.metricSurfaceClass}
                />
                <MetricPanel
                  label="Погоджені"
                  value={me.summary.approvedRequests ?? 0}
                  hint="Кількість позитивно завершених заявок, де школа вже зафіксувала висновок."
                  className={theme.metricSurfaceClass}
                />
                <div className={`rounded-[1.6rem] border p-5 ${theme.sectionSurfaceClass}`}>
                  <div className="text-sm font-semibold text-slate-950">Що далі</div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Якщо сім'я шукає нові можливості, маршрут починається з каталогу програм, а
                    потім повертається в розділ запитів для контролю статусів.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href="/dashboard/discover"
                      className={`inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition ${theme.actionHoverClass}`}
                    >
                      Каталог програм
                      <ArrowRight className="h-4 w-4" strokeWidth={2.1} />
                    </Link>
                    <Link
                      href="/dashboard/requests"
                      className={`inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition ${theme.actionHoverClass}`}
                    >
                      Відкрити запити
                      <ArrowRight className="h-4 w-4" strokeWidth={2.1} />
                    </Link>
                  </div>
                </div>
              </div>
            </WorkspaceSection>
          </>
        ) : null}

        {role === "club" ? (
          <WorkspaceSection
            id="catalog-programs"
            eyebrow="Каталог і програми"
            title="Присутність гуртка в каталозі"
            description="Окремий операційний блок для програм, публікації та черги запитів, де потрібні докази."
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <MetricPanel
                label="Усі програми"
                value={me.summary.programsCount ?? 0}
                hint="Загальна кількість програм, що належать вашій організації."
                className={theme.metricSurfaceClass}
              />
              <MetricPanel
                label="Опубліковані"
                value={me.summary.publishedProgramsCount ?? 0}
                hint="Програми, які зараз доступні в каталозі для пошуку батьками."
                className={theme.metricSurfaceClass}
              />
              <MetricPanel
                label="Черга доказів"
                value={me.summary.requestsNeedingEvidenceCount ?? 0}
                hint="Запити, де гуртку ще потрібно додати пояснення або підтвердження."
                className={theme.metricSurfaceClass}
              />
            </div>

            <div className={`mt-4 rounded-[1.75rem] border p-5 ${theme.sectionSurfaceClass}`}>
              <div className="flex items-start gap-3">
                <div
                  className={`grid h-11 w-11 place-items-center rounded-2xl border ${theme.iconSurfaceClass}`}
                >
                  <Compass className="h-5 w-5" strokeWidth={2.1} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-950">
                    Програми і профіль працюють як одна система
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Назва організації, місто та предметні напрями напряму впливають на те, як
                    гурток виглядає в каталозі. Окремий розділ програм залишається робочим центром
                    для створення та оновлення наповнення.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/dashboard/programs"
                  className={`inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition ${theme.actionHoverClass}`}
                >
                  Керувати програмами
                  <ArrowRight className="h-4 w-4" strokeWidth={2.1} />
                </Link>
                <Link
                  href="/dashboard/requests"
                  className={`inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition ${theme.actionHoverClass}`}
                >
                  Відкрити запити
                  <ArrowRight className="h-4 w-4" strokeWidth={2.1} />
                </Link>
              </div>
            </div>
          </WorkspaceSection>
        ) : null}

        {role === "school" ? (
          <>
            <WorkspaceSection
              id="review-queue"
              eyebrow="Черга розгляду"
              title="Стан активної перевірки"
              description="Окремий блок для контролю навантаження на розгляд і кейсів, які не можна пропустити."
            >
              <div className="grid gap-4 lg:grid-cols-3">
                <MetricPanel
                  label="Очікують розгляду"
                  value={me.summary.pendingReviews ?? 0}
                  hint="Запити, які мають зайти в роботу або вже знаходяться на розгляді."
                  className={theme.metricSurfaceClass}
                />
                <MetricPanel
                  label="Потрібна увага"
                  value={me.summary.attentionRequired ?? 0}
                  hint="Кейси, де є відхилення або потрібно повернення на доопрацювання."
                  className={theme.metricSurfaceClass}
                />
                <div className={`rounded-[1.6rem] border p-5 ${theme.sectionSurfaceClass}`}>
                  <div className="text-sm font-semibold text-slate-950">Робочий фокус школи</div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Профіль школи має залишатися лаконічним, а операційна логіка живе в черзі
                    розгляду. Саме там команда рухається по кейсах і повертається до рішень.
                  </p>
                  <Link
                    href="/dashboard/review"
                    className={`mt-5 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition ${theme.actionHoverClass}`}
                  >
                    Перейти до черги
                    <ArrowRight className="h-4 w-4" strokeWidth={2.1} />
                  </Link>
                </div>
              </div>
            </WorkspaceSection>

            <WorkspaceSection
              id="decision-signals"
              eyebrow="Рішення"
              title="Фінальні сигнали та контекст"
              description="Окремий блок для підсумкових рішень, щоб відділити профіль школи від операційної логіки кейсів."
            >
              <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
                <MetricPanel
                  label="Погоджені заявки"
                  value={me.summary.approvedRequests ?? 0}
                  hint="Кількість позитивних або частково позитивних рішень, які школа вже зафіксувала."
                  className={theme.metricSurfaceClass}
                />
                <div className={`rounded-[1.75rem] border p-5 ${theme.sectionSurfaceClass}`}>
                  <div className="flex items-start gap-3">
                    <div
                      className={`grid h-11 w-11 place-items-center rounded-2xl border ${theme.iconSurfaceClass}`}
                    >
                      <CheckCircle2 className="h-5 w-5" strokeWidth={2.1} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-950">
                        Профіль не дублює систему рішень
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        У профілі зберігаються реквізити школи, а історія оцінки та фінальні
                        висновки залишаються в розділі розгляду. Так кабінет не змішує довідкові
                        дані з робочою перевіркою кейсів.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/review"
                    className={`mt-5 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition ${theme.actionHoverClass}`}
                  >
                    Переглянути рішення
                    <ArrowRight className="h-4 w-4" strokeWidth={2.1} />
                  </Link>
                </div>
              </div>
            </WorkspaceSection>
          </>
        ) : null}

        <WorkspaceSection
          id="actions"
          eyebrow="Наступні дії"
          title="Швидкі переходи"
          description="Окремий блок для задач, які найчастіше виконуються після оновлення профілю."
        >
          <div className="grid gap-3">
            {copy.actions.map((action) => (
              <Link
                key={`${action.href}-${action.label}`}
                href={action.href}
                className={`group rounded-[1.5rem] border border-slate-200 bg-slate-50/75 px-4 py-4 transition ${theme.actionHoverClass}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-900">{action.label}</span>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:translate-x-1"
                    strokeWidth={2.1}
                  />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{action.hint}</p>
              </Link>
            ))}
          </div>
        </WorkspaceSection>
      </div>
    </div>
  );
}

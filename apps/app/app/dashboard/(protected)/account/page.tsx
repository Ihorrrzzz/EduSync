"use client";

import {
  ArrowRight,
  Building2,
  Mail,
  MapPin,
  RotateCcw,
  Save,
  School,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { EmptyState, SurfaceCard } from "../../../../components/dashboard-shell";
import { ScreenSpinner } from "../../../../components/screen-spinner";
import { subjectOptions } from "../../../../lib/subject-options";
import {
  fetchChildren,
  fetchClubRequests,
  fetchParentRequests,
  fetchSchoolRequests,
  updateMyProfile,
  type ChildRecord,
  type ClubRequestRecord,
  type DashboardMe,
  type RecognitionRequestRecord,
} from "../../../../lib/mvp-api";
import { useRoleAccess } from "../../../../lib/use-role-access";

type AccountRole = "parent" | "club" | "school";

type AccountAction = {
  href: string;
  label: string;
  hint: string;
};

type AccountTheme = {
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
  dashboardLabel: string;
  actions: AccountAction[];
};

const roleIcons: Record<AccountRole, LucideIcon> = {
  parent: Users,
  club: Building2,
  school: School,
};

const roleThemes: Record<AccountRole, AccountTheme> = {
  parent: {
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

const schoolPendingStatuses: RecognitionRequestRecord["status"][] = [
  "SUBMITTED",
  "AI_READY",
  "UNDER_REVIEW",
];

const schoolAcceptedStatuses: RecognitionRequestRecord["status"][] = [
  "APPROVED",
  "PARTIALLY_APPROVED",
];

const clubUnderReviewStatuses: ClubRequestRecord["status"][] = [
  "SUBMITTED",
  "AI_READY",
  "UNDER_REVIEW",
];

function WorkspaceSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section>
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

function OverviewCard({
  label,
  value,
  hint,
  className,
  children,
}: {
  label: string;
  value: number | string;
  hint: string;
  className: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`rounded-[1.6rem] border p-5 shadow-[0_14px_34px_rgba(15,23,42,0.04)] ${className}`}
    >
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 break-words text-3xl font-semibold leading-tight tracking-[-0.05em] text-slate-950">
        {value}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{hint}</p>
      {children ? <div className="mt-4 space-y-2">{children}</div> : null}
    </div>
  );
}

function OverviewListItem({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</div>
    </div>
  );
}

function OverviewLoadingCard() {
  return (
    <div className="flex items-center gap-3 rounded-[1.6rem] border border-slate-200 bg-slate-50/80 px-5 py-6 text-sm text-slate-600">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      Завантажуємо короткий огляд кабінету...
    </div>
  );
}

function ParentOverview({
  me,
  theme,
  childrenRecords,
  requests,
}: {
  me: DashboardMe;
  theme: AccountTheme;
  childrenRecords: ChildRecord[];
  requests: RecognitionRequestRecord[];
}) {
  const childSummaries = childrenRecords.map((child) => {
    const childRequests = requests.filter((request) => request.child.id === child.id);
    const clubsCount = new Set(childRequests.map((request) => request.club.id)).size;

    return {
      id: child.id,
      fullName: child.fullName,
      schoolName: child.school?.name ?? child.schoolNameSnapshot ?? "Школу ще не вказано",
      clubsCount,
    };
  });

  const linkedSchools = Array.from(
    new Set(
      childSummaries
        .map((child) => child.schoolName)
        .filter((schoolName) => schoolName !== "Школу ще не вказано"),
    ),
  );
  const totalClubAttendances = childSummaries.reduce(
    (total, child) => total + child.clubsCount,
    0,
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <div className={`rounded-[1.75rem] border p-5 ${theme.sectionSurfaceClass}`}>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Інформація про вас
        </div>
        <h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
          {me.account.displayName}
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          У цьому блоці зібрано базову інформацію родини, прив'язані шкільні дані
          та короткий стан участі дітей у гуртках.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${theme.infoPillClass}`}
          >
            <Mail className="h-4 w-4" strokeWidth={2.1} />
            {me.profile.email}
          </div>
          {me.account.city ? (
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${theme.infoPillClass}`}
            >
              <MapPin className="h-4 w-4" strokeWidth={2.1} />
              {me.account.city}
            </div>
          ) : null}
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${theme.infoPillClass}`}
          >
            <Users className="h-4 w-4" strokeWidth={2.1} />
            {childrenRecords.length} профілів дітей
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <OverviewCard
          label="Школа"
          value={
            linkedSchools.length === 0
              ? "Не вказано"
              : linkedSchools.length === 1
                ? linkedSchools[0]
                : `${linkedSchools.length} шкіл у профілях`
          }
          hint="Школи, які зараз прив'язані до профілів ваших дітей."
          className={theme.metricSurfaceClass}
        >
          {childSummaries.length === 0 ? (
            <OverviewListItem
              title="Ще немає профілів дітей"
              subtitle="Додайте дитину, щоб відобразити школу в огляді."
            />
          ) : (
            childSummaries.map((child) => (
              <OverviewListItem
                key={child.id}
                title={child.fullName}
                subtitle={child.schoolName}
              />
            ))
          )}
        </OverviewCard>

        <OverviewCard
          label="Гуртки дітей"
          value={totalClubAttendances}
          hint="Скільки унікальних гуртків зафіксовано у заявках ваших дітей."
          className={theme.metricSurfaceClass}
        >
          {childSummaries.length === 0 ? (
            <OverviewListItem
              title="Поки без гуртків"
              subtitle="Коли з'являться заявки, тут буде видно відвідувані гуртки."
            />
          ) : (
            childSummaries.map((child) => (
              <OverviewListItem
                key={`${child.id}-clubs`}
                title={child.fullName}
                subtitle={`Гуртків у заявках: ${child.clubsCount}`}
              />
            ))
          )}
        </OverviewCard>
      </div>
    </div>
  );
}

function ClubOverview({
  theme,
  requests,
}: {
  theme: AccountTheme;
  requests: ClubRequestRecord[];
}) {
  const studentsCount = new Set(requests.map((request) => request.child.id)).size;
  const acceptedSchoolsMap = new Map<
    string,
    { id: string; name: string; approvalsCount: number }
  >();

  requests.forEach((request) => {
    if (!schoolAcceptedStatuses.includes(request.status)) {
      return;
    }

    const existingSchool = acceptedSchoolsMap.get(request.school.id);

    if (existingSchool) {
      existingSchool.approvalsCount += 1;
      return;
    }

    acceptedSchoolsMap.set(request.school.id, {
      id: request.school.id,
      name: request.school.name,
      approvalsCount: 1,
    });
  });

  const acceptedSchools = Array.from(acceptedSchoolsMap.values()).sort(
    (left, right) =>
      right.approvalsCount - left.approvalsCount || left.name.localeCompare(right.name, "uk"),
  );
  const underReviewCount = requests.filter((request) =>
    clubUnderReviewStatuses.includes(request.status),
  ).length;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <OverviewCard
        label="Учні"
        value={studentsCount}
        hint="Унікальні діти, які вже проходять через програми або заявки вашого гуртка."
        className={theme.metricSurfaceClass}
      />

      <OverviewCard
        label="Школи, що прийняли"
        value={acceptedSchools.length}
        hint="Школи, де вже є позитивне або частково позитивне рішення щодо ваших заявок."
        className={theme.metricSurfaceClass}
      >
        {acceptedSchools.length === 0 ? (
          <OverviewListItem
            title="Позитивних рішень поки немає"
            subtitle="Коли школа погодить заявку, вона з'явиться в цьому списку."
          />
        ) : (
          acceptedSchools.slice(0, 4).map((school) => (
            <OverviewListItem
              key={school.id}
              title={school.name}
              subtitle={`Погоджених заявок: ${school.approvalsCount}`}
            />
          ))
        )}
      </OverviewCard>

      <OverviewCard
        label="Запити на розгляді"
        value={underReviewCount}
        hint="Заявки, які школа ще не завершила фінальним рішенням."
        className={theme.metricSurfaceClass}
      />
    </div>
  );
}

function SchoolOverview({
  theme,
  requests,
}: {
  theme: AccountTheme;
  requests: RecognitionRequestRecord[];
}) {
  const pendingRequests = requests.filter((request) =>
    schoolPendingStatuses.includes(request.status),
  );
  const pendingClubsMap = new Map<
    string,
    { id: string; name: string; city: string | null; requestsCount: number }
  >();
  const acceptedClubsMap = new Map<
    string,
    { id: string; name: string; city: string | null; approvalsCount: number }
  >();

  pendingRequests.forEach((request) => {
    const existingClub = pendingClubsMap.get(request.club.id);

    if (existingClub) {
      existingClub.requestsCount += 1;
      return;
    }

    pendingClubsMap.set(request.club.id, {
      id: request.club.id,
      name: request.club.name,
      city: request.club.city,
      requestsCount: 1,
    });
  });

  requests.forEach((request) => {
    if (!schoolAcceptedStatuses.includes(request.status)) {
      return;
    }

    const existingClub = acceptedClubsMap.get(request.club.id);

    if (existingClub) {
      existingClub.approvalsCount += 1;
      return;
    }

    acceptedClubsMap.set(request.club.id, {
      id: request.club.id,
      name: request.club.name,
      city: request.club.city,
      approvalsCount: 1,
    });
  });

  const pendingClubs = Array.from(pendingClubsMap.values()).sort(
    (left, right) =>
      right.requestsCount - left.requestsCount || left.name.localeCompare(right.name, "uk"),
  );
  const acceptedClubs = Array.from(acceptedClubsMap.values()).sort(
    (left, right) =>
      right.approvalsCount - left.approvalsCount || left.name.localeCompare(right.name, "uk"),
  );

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <OverviewCard
        label="Заявки без розгляду"
        value={pendingRequests.length}
        hint="Заявки від гуртків, які ще чекають на перевірку або фінальне рішення."
        className={theme.metricSurfaceClass}
      >
        {pendingClubs.length === 0 ? (
          <OverviewListItem
            title="Черга порожня"
            subtitle="Усі поточні заявки вже мають фінальне рішення."
          />
        ) : (
          pendingClubs.map((club) => (
            <OverviewListItem
              key={club.id}
              title={club.name}
              subtitle={`${club.city ? `${club.city} · ` : ""}Заявок без рішення: ${club.requestsCount}`}
            />
          ))
        )}
      </OverviewCard>

      <OverviewCard
        label="Інтегровані гуртки"
        value={acceptedClubs.length}
        hint="Гуртки, з якими школа вже має погоджені або частково погоджені інтеграції."
        className={theme.metricSurfaceClass}
      >
        {acceptedClubs.length === 0 ? (
          <OverviewListItem
            title="Ще немає інтегрованих гуртків"
            subtitle="Після першого позитивного рішення список з'явиться тут."
          />
        ) : (
          acceptedClubs.map((club) => (
            <OverviewListItem
              key={club.id}
              title={club.name}
              subtitle={`${club.city ? `${club.city} · ` : ""}Погоджених заявок: ${club.approvalsCount}`}
            />
          ))
        )}
      </OverviewCard>
    </div>
  );
}

function getAccountCopy(role: AccountRole): AccountCopy {
  if (role === "parent") {
    return {
      eyebrow: "Огляд родини",
      title: "Огляд батьківського кабінету",
      description:
        "Короткий зріз по дітях, школах і гуртках разом із швидким доступом до основних робочих розділів.",
      dashboardLabel: "Кабінет родини",
      actions: [
        {
          href: "/dashboard/children",
          label: "Керувати дітьми",
          hint: "Додавайте профілі дітей і перевіряйте їхню шкільну прив'язку.",
        },
        {
          href: "/dashboard/clubs",
          label: "Переглянути гуртки",
          hint: "Подивіться, які гуртки відвідують ваші діти та стан заявок.",
        },
      ],
    };
  }

  if (role === "club") {
    return {
      eyebrow: "Огляд гуртка",
      title: "Огляд кабінету гуртка",
      description:
        "Головна сторінка з коротким зведенням по учнях, погоджених школах і запитах, які ще чекають на рішення.",
      dashboardLabel: "Кабінет гуртка",
      actions: [
        {
          href: "/dashboard/students",
          label: "Відкрити учнів",
          hint: "Перегляньте дітей, які вже проходять через програми та заявки гуртка.",
        },
        {
          href: "/dashboard/requests",
          label: "Відкрити запити",
          hint: "Перевірте, де потрібні докази або відповіді гуртка.",
        },
        {
          href: "/dashboard/programs",
          label: "Керувати програмами",
          hint: "Оновлюйте описи, структуру і статус публікації програм.",
        },
      ],
    };
  }

  return {
    eyebrow: "Огляд школи",
    title: "Огляд шкільного кабінету",
    description:
      "Короткий зріз по заявках від гуртків: що ще не розглянуто і які гуртки вже інтегровані школою.",
    dashboardLabel: "Кабінет школи",
    actions: [
      {
        href: "/dashboard/review",
        label: "Відкрити заявки",
        hint: "Поверніться до кейсів, які зараз чекають розгляду.",
      },
      {
        href: "/dashboard/school-students",
        label: "Переглянути учнів",
        hint: "Перегляньте учнів, які подали запити на визнання.",
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
      cityHint: "Місто допомагає швидше підбирати школу та програми для дітей.",
      completionHint: "Базовий профіль достатній для створення дітей і нових запитів.",
    };
  }

  if (role === "club") {
    return {
      cityHint: "Місто впливає на локальні фільтри та видимість гуртка в каталозі.",
      completionHint:
        "Для гуртка важливо позначити предметні напрями, щоб програми знаходилися швидше.",
    };
  }

  return {
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
  const [parentChildren, setParentChildren] = useState<ChildRecord[]>([]);
  const [parentRequests, setParentRequests] = useState<RecognitionRequestRecord[]>([]);
  const [clubRequests, setClubRequests] = useState<ClubRequestRecord[]>([]);
  const [schoolRequests, setSchoolRequests] = useState<RecognitionRequestRecord[]>([]);
  const [overviewError, setOverviewError] = useState("");
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
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

  useEffect(() => {
    if (!me || !isAllowed) {
      return;
    }

    let isCancelled = false;

    const loadOverview = async () => {
      setIsOverviewLoading(true);
      setOverviewError("");

      try {
        if (me.profile.role === "parent") {
          const [childrenResponse, requestsResponse] = await Promise.all([
            fetchChildren(),
            fetchParentRequests(),
          ]);

          if (isCancelled) {
            return;
          }

          setParentChildren(childrenResponse.children);
          setParentRequests(requestsResponse.requests);
          setClubRequests([]);
          setSchoolRequests([]);
        } else if (me.profile.role === "club") {
          const response = await fetchClubRequests();

          if (isCancelled) {
            return;
          }

          setClubRequests(response.requests);
          setParentChildren([]);
          setParentRequests([]);
          setSchoolRequests([]);
        } else {
          const response = await fetchSchoolRequests();

          if (isCancelled) {
            return;
          }

          setSchoolRequests(response.requests);
          setParentChildren([]);
          setParentRequests([]);
          setClubRequests([]);
        }
      } catch (loadError) {
        if (isCancelled) {
          return;
        }

        setOverviewError(
          loadError instanceof Error
            ? loadError.message
            : "Не вдалося завантажити короткий огляд кабінету",
        );
      } finally {
        if (!isCancelled) {
          setIsOverviewLoading(false);
        }
      }
    };

    void loadOverview();

    return () => {
      isCancelled = true;
    };
  }, [isAllowed, me?.account.entityId, me?.profile.role]);

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
  const initialDisplayName = me.account.displayName.trim();
  const initialCity = (me.account.city ?? "").trim();
  const normalizedDisplayName = displayName.trim();
  const normalizedCity = city.trim();
  const hasSubjectChanges =
    role === "club" ? !areSubjectsEqual(subjects, me.account.subjects) : false;
  const hasChanges =
    normalizedDisplayName !== initialDisplayName ||
    normalizedCity !== initialCity ||
    hasSubjectChanges;
  const canSubmit = normalizedDisplayName.length > 0 && hasChanges && !isSubmitting;
  const completionItems = [
    {
      label: "Тип акаунта",
      value: copy.dashboardLabel,
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

  let overviewContent: ReactNode;

  if (isOverviewLoading) {
    overviewContent = <OverviewLoadingCard />;
  } else if (overviewError) {
    overviewContent = (
      <SurfaceCard className="border-slate-200/90 bg-white/92 shadow-[0_18px_52px_rgba(15,23,42,0.06)]">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {overviewError}
        </div>
      </SurfaceCard>
    );
  } else if (role === "parent") {
    overviewContent = (
      <ParentOverview
        me={me}
        theme={theme}
        childrenRecords={parentChildren}
        requests={parentRequests}
      />
    );
  } else if (role === "club") {
    overviewContent = <ClubOverview theme={theme} requests={clubRequests} />;
  } else {
    overviewContent = <SchoolOverview theme={theme} requests={schoolRequests} />;
  }

  return (
    <div className="space-y-6">
      <WorkspaceSection eyebrow={copy.eyebrow} title={copy.title} description={copy.description}>
        {overviewContent}
      </WorkspaceSection>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <WorkspaceSection
          eyebrow="Основні дані"
          title={getDisplayNameLabel(role)}
          description={guide.completionHint}
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_300px]">
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
              <div className="mt-3 flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                  <Mail className="h-3.5 w-3.5 text-slate-900" strokeWidth={2.1} />
                  Тільки перегляд
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                  <RoleIcon className="h-3.5 w-3.5 text-slate-900" strokeWidth={2.1} />
                  {copy.dashboardLabel}
                </div>
              </div>

              <div className="mt-5 rounded-[1.4rem] border border-slate-200 bg-white/90 p-4">
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
            </div>
          </div>
        </WorkspaceSection>

        {role === "club" ? (
          <WorkspaceSection
            eyebrow="Предметні напрями"
            title="Навчальні напрями гуртка"
            description="Позначені напрями використовуються в каталозі та в огляді програм для шкіл і батьків."
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

      <WorkspaceSection
        eyebrow="Швидкий доступ"
        title="Що відкрити далі"
        description="Основні переходи для наступних дій у персональному кабінеті."
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
  );
}

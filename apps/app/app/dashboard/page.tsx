"use client";

import {
  BookOpenCheck,
  Brain,
  CircleCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  LibraryBig,
  type LucideIcon,
  School,
  UserRound,
  UsersRound,
  BrainCircuit,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import type { Profile, ProfileRole } from "../../lib/api";

type BadgeTone = "pending" | "approved" | "reviewing" | "active";

type DashboardMetric = {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
  border: string;
};

type DashboardRow = {
  title: string;
  description: string;
  badge: string;
  tone: BadgeTone;
};

type InsightCard = {
  title: string;
  description: string;
  tone: string;
};

type AiAnalysisConfig = {
  title: string;
  description: string;
  submitLabel: string;
  summaryTitle: string;
  summaryText: string;
  bullets: string[];
};

type FormField = {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea" | "select";
  options?: Array<{ label: string; value: string }>;
  span?: "full" | "half";
};

type DashboardConfig = {
  roleLabel: string;
  heroTitle: string;
  heroDescription: string;
  heroNotes: string[];
  metrics: DashboardMetric[];
  rowsTitle: string;
  rowsDescription: string;
  rows: DashboardRow[];
  formTitle: string;
  formDescription: string;
  formSubmitLabel: string;
  fields: FormField[];
  aiAnalysis?: AiAnalysisConfig;
  insights: InsightCard[];
};

const dashboardConfigs: Record<"parent" | "school" | "club", DashboardConfig> = {
  parent: {
    roleLabel: "Батьківський кабінет",
    heroTitle: "Контролюйте освітній маршрут дитини без розриву між школою та гуртком.",
    heroDescription:
      "У цьому кабінеті ви відстежуєте активні маршрути, погодження школи, AI-збіги програм та швидко створюєте нові запити на заміну предметів.",
    heroNotes: [
      "AI-збіги програм і пояснення прогалин",
      "Статуси погодження школи в реальному часі",
      "Прогрес, відвідуваність і цифрові документи в одному місці",
    ],
    metrics: [
      { icon: UserRound, label: "Підключені діти", value: "2", color: "#2563ff", border: "#bfd8ff" },
      { icon: BrainCircuit, label: "AI-збіги", value: "14", color: "#9333ea", border: "#ead5ff" },
      { icon: FileText, label: "Активні запити", value: "3", color: "#16a34a", border: "#bbf7d0" },
    ],
    rowsTitle: "Активні маршрути та заявки",
    rowsDescription: "Поточні рішення школи та останні синхронізовані маршрути.",
    rows: [
      {
        title: "Запит на заміну англійської",
        description: "Рівень відповідності 92% · школа ще розглядає заявку",
        badge: "У розгляді",
        tone: "reviewing",
      },
      {
        title: "Маршрут з фортепіано",
        description: "Відвідуваність 100% · доступний новий місячний звіт",
        badge: "Активно",
        tone: "approved",
      },
      {
        title: "Програма з плавання",
        description: "Угоду підписано · перенесення оцінок готове",
        badge: "Синхронізовано",
        tone: "active",
      },
    ],
    formTitle: "Новий запит на зарахування",
    formDescription:
      "Підготуйте короткий запит для школи з даними про програму та предмет, який потрібно замінити.",
    formSubmitLabel: "Надіслати запит",
    fields: [
      { name: "childName", label: "Учень", placeholder: "Ім'я дитини" },
      { name: "subject", label: "Шкільний предмет", placeholder: "Наприклад, Англійська мова" },
      { name: "provider", label: "Заклад / гурток", placeholder: "Назва провайдера" },
      {
        name: "requestType",
        label: "Формат заявки",
        type: "select",
        options: [
          { value: "full", label: "Повна заміна предмета" },
          { value: "partial", label: "Часткове зарахування" },
        ],
      },
      {
        name: "note",
        label: "Коментар для школи",
        type: "textarea",
        placeholder: "Коротко опишіть очікування або додаткові деталі",
        span: "full",
      },
    ],
    aiAnalysis: {
      title: "Аналізувати програму гуртка за допомогою AI",
      description:
        "Додайте основні дані про програму гуртка, щоб швидко оцінити її сумісність зі шкільним предметом до подання заявки.",
      submitLabel: "Запустити AI-аналіз",
      summaryTitle: "Попередній висновок AI",
      summaryText:
        "Програма виглядає достатньо близькою до шкільного курсу й може бути придатною для часткового або повного зарахування після перевірки школи.",
      bullets: [
        "Орієнтовний збіг із програмою: 89%",
        "Сильні сторони: усне мовлення, читання, практичні завдання",
        "Що перевірити додатково: модулі з письма та контрольні критерії оцінювання",
      ],
    },
    insights: [
      {
        title: "Найкращий AI-збіг",
        description: "English Intensive Program покриває 92% програми 9 класу.",
        tone: "bg-blue-50 border-blue-100 text-blue-900",
      },
      {
        title: "Що варто додати",
        description: "Для повної заміни бракує лише модуля з письма та есе.",
        tone: "bg-amber-50 border-amber-100 text-amber-900",
      },
    ],
  },
  school: {
    roleLabel: "Шкільний кабінет",
    heroTitle: "Керуйте погодженнями, партнерствами та мережевим навчанням у єдиному дашборді.",
    heroDescription:
      "Шкільний інтерфейс фокусується на перевірці заявок, рішенні щодо замін предметів і координації з позашкільними закладами.",
    heroNotes: [
      "Оперативний список заявок від батьків",
      "Контроль перенесення оцінок і звітів",
      "Партнерські гуртки та цифрові домовленості",
    ],
    metrics: [
      { icon: UsersRound, label: "Активні учні", value: "847", color: "#2563ff", border: "#bfd8ff" },
      { icon: ClipboardList, label: "Запити на розгляді", value: "24", color: "#9333ea", border: "#ead5ff" },
      { icon: GraduationCap, label: "Партнерські гуртки", value: "12", color: "#16a34a", border: "#bbf7d0" },
    ],
    rowsTitle: "Черга заявок та погоджень",
    rowsDescription: "Останні запити, які потребують рішення або фінального підпису.",
    rows: [
      {
        title: "Анна Петрова",
        description: "Англійська мова → Мовний центр International",
        badge: "Очікує",
        tone: "pending",
      },
      {
        title: "Іван Сидоров",
        description: "Музичне мистецтво → City Music Academy",
        badge: "Схвалено",
        tone: "approved",
      },
      {
        title: "Марія Іванова",
        description: "Фізична культура → Sports Complex Olymp",
        badge: "Розгляд",
        tone: "reviewing",
      },
    ],
    formTitle: "Форма рішення школи",
    formDescription:
      "Зафіксуйте рішення щодо заявки та додайте коментар для батьків і гуртка.",
    formSubmitLabel: "Зберегти рішення",
    fields: [
      { name: "student", label: "Учень", placeholder: "ПІБ учня" },
      { name: "subject", label: "Предмет", placeholder: "Який предмет розглядається" },
      { name: "provider", label: "Освітній провайдер", placeholder: "Назва гуртка або центру" },
      {
        name: "decision",
        label: "Рішення",
        type: "select",
        options: [
          { value: "approve", label: "Схвалити" },
          { value: "review", label: "Повернути на доопрацювання" },
          { value: "reject", label: "Відхилити" },
        ],
      },
      {
        name: "note",
        label: "Коментар школи",
        type: "textarea",
        placeholder: "Поясніть рішення або зафіксуйте, чого бракує для затвердження",
        span: "full",
      },
    ],
    insights: [
      {
        title: "Швидкий пріоритет",
        description: "7 запитів цього тижня мають AI-збіг вище 90% і готові до підпису.",
        tone: "bg-emerald-50 border-emerald-100 text-emerald-900",
      },
      {
        title: "Зона ризику",
        description: "3 нові програми потребують ручної перевірки навчальних модулів.",
        tone: "bg-amber-50 border-amber-100 text-amber-900",
      },
    ],
  },
  club: {
    roleLabel: "Кабінет гуртка",
    heroTitle: "Публікуйте програми, працюйте зі школами та надсилайте звіти без зайвої ручної роботи.",
    heroDescription:
      "У кабінеті гуртка зібрано керування програмами, партнерськими школами, відвідуваністю, оцінками та щомісячними звітами.",
    heroNotes: [
      "Публікація та оновлення освітніх програм",
      "Оперативні запити від шкіл та батьків",
      "Передавання звітів і результатів у стандартизованому форматі",
    ],
    metrics: [
      { icon: BookOpenCheck, label: "Опубліковані програми", value: "18", color: "#2563ff", border: "#bfd8ff" },
      { icon: School, label: "Партнерські школи", value: "15", color: "#9333ea", border: "#ead5ff" },
      { icon: LibraryBig, label: "Звітів цього місяця", value: "41", color: "#16a34a", border: "#bbf7d0" },
    ],
    rowsTitle: "Програми та активні взаємодії",
    rowsDescription: "Стан навчальних програм, угод і щотижневих відправлень у школи.",
    rows: [
      {
        title: "Програма English Intensive",
        description: "Відповідність 92% · готова до подання в школу",
        badge: "Перевірено",
        tone: "approved",
      },
      {
        title: "Нова угода зі школою №127",
        description: "Потрібен підпис директора та активація співпраці",
        badge: "Очікує",
        tone: "pending",
      },
      {
        title: "Звіт з відвідуваності",
        description: "Група англійської для 9 класу · надіслано цього тижня",
        badge: "Надіслано",
        tone: "active",
      },
    ],
    formTitle: "Подання програми або звіту",
    formDescription:
      "Заповніть форму для нової програми, синхронізації зі школою або відправлення звітного пакета.",
    formSubmitLabel: "Підготувати пакет",
    fields: [
      { name: "program", label: "Програма", placeholder: "Назва програми або групи" },
      { name: "school", label: "Школа", placeholder: "Партнерська школа" },
      { name: "subject", label: "Предметна відповідність", placeholder: "Наприклад, Англійська мова" },
      {
        name: "packageType",
        label: "Тип пакета",
        type: "select",
        options: [
          { value: "program", label: "Нова програма" },
          { value: "report", label: "Щомісячний звіт" },
          { value: "grades", label: "Пакет оцінок" },
        ],
      },
      {
        name: "note",
        label: "Опис або супровідний коментар",
        type: "textarea",
        placeholder: "Вкажіть результат, прогрес групи або короткий коментар для школи",
        span: "full",
      },
    ],
    insights: [
      {
        title: "Найсильніша програма",
        description: "English Intensive стабільно зберігає рівень відповідності понад 90%.",
        tone: "bg-blue-50 border-blue-100 text-blue-900",
      },
      {
        title: "Наступний крок",
        description: "Школа №127 очікує оновлений тематичний план для активації договору.",
        tone: "bg-violet-50 border-violet-100 text-violet-900",
      },
    ],
  },
};

const badgeClasses: Record<BadgeTone, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  reviewing: "bg-blue-100 text-blue-800",
  active: "bg-violet-100 text-violet-800",
};

function SpinnerScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
    </div>
  );
}

function parseGuestRole(role: string | null): ProfileRole | null {
  if (role === "parent" || role === "school" || role === "club") {
    return role;
  }

  return null;
}

function createGuestProfile(role: ProfileRole): Profile {
  const labels: Record<ProfileRole, string> = {
    parent: "Гість: Батьківський кабінет",
    school: "Гість: Шкільний кабінет",
    club: "Гість: Кабінет гуртка",
  };

  return {
    id: `guest-${role}`,
    email: "guest@edusync.demo",
    role,
    fullName: labels[role],
  };
}

function DashboardForm({
  config,
}: {
  config: DashboardConfig;
}) {
  const [formValues, setFormValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(config.fields.map((field) => [field.name, ""])),
  );
  const [status, setStatus] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("Чернетку збережено. Інтеграцію відправлення можна підключити до API.");
  };

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_42px_rgba(15,23,42,0.05)]">
      <div>
        <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
          {config.formTitle}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {config.formDescription}
        </p>
      </div>

      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        {config.fields.map((field) => {
          const wrapperClass =
            field.span === "full" ? "sm:col-span-2 grid gap-2" : "grid gap-2";

          if (field.type === "textarea") {
            return (
              <div key={field.name} className={wrapperClass}>
                <label className="text-sm font-medium text-slate-700" htmlFor={field.name}>
                  {field.label}
                </label>
                <textarea
                  className="min-h-32 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  id={field.name}
                  placeholder={field.placeholder}
                  value={formValues[field.name]}
                  onChange={(event) => {
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      [field.name]: event.target.value,
                    }));
                    setStatus("");
                  }}
                />
              </div>
            );
          }

          if (field.type === "select") {
            return (
              <div key={field.name} className={wrapperClass}>
                <label className="text-sm font-medium text-slate-700" htmlFor={field.name}>
                  {field.label}
                </label>
                <select
                  className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  id={field.name}
                  value={formValues[field.name]}
                  onChange={(event) => {
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      [field.name]: event.target.value,
                    }));
                    setStatus("");
                  }}
                >
                  <option value="">Оберіть значення</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          return (
            <div key={field.name} className={wrapperClass}>
              <label className="text-sm font-medium text-slate-700" htmlFor={field.name}>
                {field.label}
              </label>
              <input
                className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                id={field.name}
                placeholder={field.placeholder}
                type="text"
                value={formValues[field.name]}
                onChange={(event) => {
                  setFormValues((currentValues) => ({
                    ...currentValues,
                    [field.name]: event.target.value,
                  }));
                  setStatus("");
                }}
              />
            </div>
          );
        })}

        {status ? (
          <div className="sm:col-span-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {status}
          </div>
        ) : null}

        <button
          className="sm:col-span-2 inline-flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.22)] transition hover:bg-blue-700"
          type="submit"
        >
          {config.formSubmitLabel}
        </button>
      </form>
    </div>
  );
}

function ParentAiAnalysis({
  analysis,
}: {
  analysis: AiAnalysisConfig;
}) {
  const [status, setStatus] = useState("");
  const [values, setValues] = useState({
    programName: "",
    subject: "",
    provider: "",
    notes: "",
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("AI-аналіз підготовлено як демонстраційний попередній висновок.");
  };

  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_42px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
            {analysis.title}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {analysis.description}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
          <Brain className="h-4 w-4" strokeWidth={2.1} />
          AI Preview
        </span>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="ai-program-name">
              Назва програми
            </label>
            <input
              id="ai-program-name"
              className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Наприклад, English Intensive"
              value={values.programName}
              onChange={(event) => {
                setValues((current) => ({ ...current, programName: event.target.value }));
                setStatus("");
              }}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="ai-subject">
              Шкільний предмет
            </label>
            <input
              id="ai-subject"
              className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Наприклад, Англійська мова"
              value={values.subject}
              onChange={(event) => {
                setValues((current) => ({ ...current, subject: event.target.value }));
                setStatus("");
              }}
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="ai-provider">
              Назва гуртка або провайдера
            </label>
            <input
              id="ai-provider"
              className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Вкажіть назву закладу"
              value={values.provider}
              onChange={(event) => {
                setValues((current) => ({ ...current, provider: event.target.value }));
                setStatus("");
              }}
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="ai-notes">
              Опис програми або ключові модулі
            </label>
            <textarea
              id="ai-notes"
              className="min-h-32 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Коротко опишіть теми, навички та формат навчання"
              value={values.notes}
              onChange={(event) => {
                setValues((current) => ({ ...current, notes: event.target.value }));
                setStatus("");
              }}
            />
          </div>

          {status ? (
            <div className="sm:col-span-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              {status}
            </div>
          ) : null}

          <button
            className="sm:col-span-2 inline-flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.22)] transition hover:bg-blue-700"
            type="submit"
          >
            {analysis.submitLabel}
          </button>
        </form>

        <div className="rounded-[1.5rem] border border-blue-100 bg-[linear-gradient(180deg,#f8fbff,#eef5ff)] p-5">
          <div className="flex items-center gap-3 text-blue-700">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-sm">
              <Brain className="h-5 w-5" strokeWidth={2.1} />
            </span>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em]">
                AI Summary
              </div>
              <div className="text-lg font-semibold text-slate-950">
                {analysis.summaryTitle}
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-600">{analysis.summaryText}</p>

          <div className="mt-5 grid gap-3">
            {analysis.bullets.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-white bg-white/80 px-4 py-4 text-sm text-slate-700"
              >
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <CircleCheck className="h-4 w-4" strokeWidth={2.1} />
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardPageLayout({
  profile,
  config,
  logout,
  isGuest,
}: {
  profile: Profile;
  config: DashboardConfig;
  logout: () => Promise<void>;
  isGuest: boolean;
}) {
  const displayName = profile.fullName ?? profile.email;

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-slate-200/80 bg-white/92 px-5 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)] backdrop-blur sm:px-6">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-xl text-white shadow-[0_14px_28px_rgba(37,99,255,0.24)]">
              <GraduationCap className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                EduSync
              </div>
              <div className="text-sm text-slate-500">{config.roleLabel}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{displayName}</span>
              <span className="ml-2 hidden text-slate-400 sm:inline">
                {isGuest ? "demo access" : profile.email}
              </span>
            </div>
            <button
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              type="button"
              onClick={() => {
                void logout();
              }}
            >
              Вийти
            </button>
          </div>
        </header>

        <main className="mt-6 grid gap-6">
          {isGuest ? (
            <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-900">
              Ви переглядаєте демо-кабінет у режимі гостя. Форми тут працюють як
              інтерактивні макети без збереження в систему.
            </div>
          ) : null}

          <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-[2rem] bg-[linear-gradient(155deg,#2563ff,#153db8)] p-6 text-white shadow-[0_28px_80px_rgba(37,99,255,0.2)] sm:p-8">
              <div className="max-w-3xl">
                <div className="inline-flex rounded-full border border-white/16 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/84">
                  {config.roleLabel}
                </div>
                <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl">
                  {config.heroTitle}
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/82 sm:text-lg">
                  {config.heroDescription}
                </p>
              </div>

              <div className="mt-8 grid gap-3">
                {config.heroNotes.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/10 px-4 py-4 text-sm text-white/88"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/16">
                      <CircleCheck className="h-4 w-4" strokeWidth={2.2} />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_42px_rgba(15,23,42,0.05)] sm:p-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">
                    Snapshot
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    Ключові показники
                  </h2>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {config.metrics.map((metric) => {
                  const Icon = metric.icon;

                  return (
                    <div
                      key={metric.label}
                      className="rounded-[1.5rem] border bg-slate-50 px-5 py-5"
                      style={{ borderColor: metric.border }}
                    >
                      <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                        <span
                          className="grid h-9 w-9 place-items-center rounded-2xl bg-white"
                          style={{ color: metric.color }}
                        >
                          <Icon className="h-4 w-4" strokeWidth={2.1} />
                        </span>
                        <span>{metric.label}</span>
                      </div>
                      <div
                        className="mt-3 text-4xl font-semibold tracking-[-0.05em]"
                        style={{ color: metric.color }}
                      >
                        {metric.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_42px_rgba(15,23,42,0.05)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                    {config.rowsTitle}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {config.rowsDescription}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Dashboard
                </span>
              </div>

              <div className="mt-6 grid gap-4">
                {config.rows.map((row) => (
                  <div
                    key={row.title}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-[1.4rem] border border-slate-200 bg-slate-50/80 px-4 py-4"
                  >
                    <div>
                      <h4 className="text-base font-semibold text-slate-950">{row.title}</h4>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {row.description}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${badgeClasses[row.tone]}`}
                    >
                      {row.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <DashboardForm config={config} />
          </section>

          {config.aiAnalysis ? <ParentAiAnalysis analysis={config.aiAnalysis} /> : null}

          <section className="grid gap-6 md:grid-cols-2">
            {config.insights.map((item) => (
              <article
                key={item.title}
                className={`rounded-[1.75rem] border p-6 shadow-[0_16px_35px_rgba(15,23,42,0.04)] ${item.tone}`}
              >
                <h3 className="text-lg font-semibold tracking-[-0.03em]">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 opacity-90">{item.description}</p>
              </article>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { isLoading, profile, logout } = useAuth();
  const [guestProfile, setGuestProfile] = useState<Profile | null>(null);
  const [hasResolvedGuest, setHasResolvedGuest] = useState(false);

  useEffect(() => {
    const guestRole = parseGuestRole(
      new URLSearchParams(window.location.search).get("guest"),
    );

    setGuestProfile(guestRole ? createGuestProfile(guestRole) : null);
    setHasResolvedGuest(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !profile && !guestProfile && hasResolvedGuest) {
      router.replace("/auth/login");
    }
  }, [guestProfile, hasResolvedGuest, isLoading, profile, router]);

  if (!hasResolvedGuest || (isLoading && !guestProfile)) {
    return <SpinnerScreen />;
  }

  const resolvedProfile = profile ?? guestProfile;

  if (!resolvedProfile) {
    return <SpinnerScreen />;
  }

  return (
    <DashboardPageLayout
      config={dashboardConfigs[resolvedProfile.role]}
      isGuest={!profile && !!guestProfile}
      logout={logout}
      profile={resolvedProfile}
    />
  );
}

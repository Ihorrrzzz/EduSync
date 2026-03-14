"use client";

import {
  BadgeCheck,
  CircleCheck,
  GraduationCap,
  Paintbrush,
  School,
  type LucideIcon,
  UsersRound,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScreenSpinner } from "../../../components/screen-spinner";
import { apiFetch, type Profile, type ProfileRole } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import { parseProfileRole } from "../../../lib/profile-utils";
import { getSiteUrl } from "../../../lib/public-env";
import { subjectOptions, type SubjectOption } from "../../../lib/subject-options";

type RegisterResponse = {
  accessToken: string;
  profile: Profile;
};

type Step = 1 | 2 | 3;

const roleCards: Array<{
  value: ProfileRole;
  icon: LucideIcon;
  label: string;
  description: string;
  tone: string;
  highlights: string[];
}> = [
  {
    value: "parent",
    icon: UsersRound,
    label: "Батьки / Учень",
    description: "Пошук програм, AI-рекомендації та подання заявок на зарахування.",
    tone: "from-purple-500 to-fuchsia-600",
    highlights: [
      "Каталог сумісних програм",
      "Статуси заявок у реальному часі",
      "Єдиний огляд прогресу дитини",
    ],
  },
  {
    value: "school",
    icon: School,
    label: "Школа",
    description: "Погодження замін, робота з партнерами та цифровими угодами.",
    tone: "from-blue-500 to-blue-700",
    highlights: [
      "Розгляд запитів на заміну предметів",
      "Контроль маршруту учня",
      "Партнерства з гуртками та звітами",
    ],
  },
  {
    value: "club",
    icon: Paintbrush,
    label: "Гурток",
    description: "Публікація програм, передавання результатів та звітів до шкіл.",
    tone: "from-emerald-500 to-green-600",
    highlights: [
      "Завантаження освітніх програм",
      "Звіти й відвідуваність у цифровому форматі",
      "Керування шкільними партнерствами",
    ],
  },
];

const stepLabels = [
  { value: 1 as const, title: "Роль", description: "Оберіть тип кабінету" },
  { value: 2 as const, title: "Доступ", description: "Створіть дані для входу" },
  { value: 3 as const, title: "Профіль", description: "Додайте деталі акаунта" },
];

function getGuestDashboardUrl(role: ProfileRole) {
  return `/dashboard?guest=${role}`;
}

export default function RegisterPage() {
  const router = useRouter();
  const { isLoading, profile, login } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<ProfileRole | null>(null);
  const [hasAppliedRolePreset, setHasAppliedRolePreset] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [city, setCity] = useState("");
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const siteUrl = getSiteUrl();

  const selectedRole = roleCards.find((item) => item.value === role) ?? null;
  const SelectedRoleIcon = selectedRole?.icon;

  useEffect(() => {
    if (!isLoading && profile) {
      router.replace("/dashboard");
    }
  }, [isLoading, profile, router]);

  useEffect(() => {
    if (hasAppliedRolePreset) {
      return;
    }

    const requestedRole = parseProfileRole(
      new URLSearchParams(window.location.search).get("role"),
    );

    if (!requestedRole) {
      setHasAppliedRolePreset(true);
      return;
    }

    setRole((currentRole) => currentRole ?? requestedRole);
    setStep((currentStep) => (currentStep === 1 ? 2 : currentStep));
    setHasAppliedRolePreset(true);
  }, [hasAppliedRolePreset]);

  const handleSubjectToggle = (subject: SubjectOption) => {
    setSubjects((currentSubjects) =>
      currentSubjects.includes(subject)
        ? currentSubjects.filter((value) => value !== subject)
        : [...currentSubjects, subject],
    );
  };

  const goToNextStep = () => {
    if (step === 1) {
      if (!role) {
        setError("Оберіть роль, щоб продовжити");
        return;
      }

      setError("");
      setStep(2);
      return;
    }

    if (!email.trim()) {
      setError("Вкажіть email");
      return;
    }

    if (password.trim().length < 8) {
      setError("Пароль має містити щонайменше 8 символів");
      return;
    }

    setError("");
    setStep(3);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!role) {
      setError("Оберіть роль");
      return;
    }

    if (role === "school" && !schoolName.trim()) {
      setError("Вкажіть назву школи");
      return;
    }

    if (role === "club" && !fullName.trim()) {
      setError("Вкажіть назву гуртка");
      return;
    }

    if (role === "club" && subjects.length < 1) {
      setError("Оберіть щонайменше один предмет");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const data = await apiFetch<RegisterResponse>("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          email,
          password,
          fullName: fullName.trim() || undefined,
          schoolName: schoolName.trim() || undefined,
          city: city.trim() || undefined,
          subjects: subjects.length ? subjects : undefined,
        }),
      });

      login(data.accessToken, data.profile);
      router.push("/dashboard");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Не вдалося зареєструватись",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || profile) {
    return <ScreenSpinner />;
  }

  return (
    <main className="px-4 py-6 md:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[2rem] bg-[linear-gradient(160deg,#2563ff,#153db8)] p-6 text-white shadow-[0_30px_80px_rgba(37,99,255,0.24)] sm:p-8 lg:p-10">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-4">
              <Link
                className="inline-flex items-center gap-3 text-sm font-semibold text-white/92"
                href={siteUrl}
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/14">
                  <GraduationCap className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <span>EduSync</span>
              </Link>
              <span className="rounded-full border border-white/16 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/84">
                Register
              </span>
            </div>

            <div className="mt-10">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/72">
                Рольова реєстрація
              </p>
              <h1 className="mt-4 max-w-lg text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl">
                Створіть кабінет, який відповідає вашій ролі в освітньому маршруті.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/84 sm:text-lg">
                EduSync адаптує інтерфейс для школи, родини або гуртка одразу після
                реєстрації, щоб ви працювали тільки з релевантними запитами та
                даними.
              </p>
            </div>

            <div className="mt-10 grid gap-4">
              {stepLabels.map((item) => {
                const isActive = item.value === step;
                const isComplete = item.value < step;

                return (
                  <div
                    key={item.value}
                    className={`rounded-2xl border px-4 py-4 transition ${
                      isActive
                        ? "border-white/24 bg-white/14"
                        : "border-white/10 bg-white/7"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`grid h-10 w-10 place-items-center rounded-2xl text-sm font-semibold ${
                          isActive || isComplete
                            ? "bg-white text-blue-700"
                            : "bg-white/10 text-white/72"
                        }`}
                      >
                        {isComplete ? (
                          <BadgeCheck className="h-5 w-5" strokeWidth={2.2} />
                        ) : (
                          item.value
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{item.title}</div>
                        <div className="mt-1 text-sm text-white/68">{item.description}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 rounded-[1.75rem] border border-white/12 bg-white/10 p-5">
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/72">
                Поточна роль
              </div>
              {selectedRole ? (
                <div className="mt-4">
                  <div className={`inline-flex rounded-2xl bg-gradient-to-r px-4 py-3 ${selectedRole.tone}`}>
                    <span className="mr-3 grid h-10 w-10 place-items-center rounded-2xl bg-white/14">
                      {SelectedRoleIcon ? (
                        <SelectedRoleIcon className="h-5 w-5 text-white" strokeWidth={2.2} />
                      ) : null}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {selectedRole.label}
                      </div>
                      <div className="mt-1 text-sm text-white/82">
                        {selectedRole.description}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {selectedRole.highlights.map((item) => (
                      <div key={item} className="flex items-center gap-3 text-sm text-white/84">
                        <span className="grid h-7 w-7 place-items-center rounded-xl bg-white/14">
                          <CircleCheck className="h-4 w-4" strokeWidth={2.2} />
                        </span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-white/72">
                  Оберіть роль на першому кроці, щоб побачити, який формат дашборду
                  та інструментів буде доступний після реєстрації.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">
                  Auth
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                  Реєстрація в EduSync
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                  Заповніть кілька коротких кроків, щоб відкрити рольовий кабінет і
                  перейти до роботи із заявками, програмами та звітами.
                </p>
              </div>

              <Link
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                href="/auth/login"
              >
                Уже є акаунт
              </Link>
            </div>

            <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
              {step === 1 ? (
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    {roleCards.map((item) => {
                      const isSelected = item.value === role;
                      const Icon = item.icon;

                      return (
                        <button
                          key={item.value}
                          type="button"
                          className={`rounded-[1.5rem] border p-5 text-left transition ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 shadow-[0_18px_30px_rgba(37,99,255,0.12)]"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                          onClick={() => {
                            setRole(item.value);
                            setError("");
                          }}
                        >
                          <div
                            className={`inline-flex rounded-2xl bg-gradient-to-r px-4 py-3 text-white ${item.tone}`}
                          >
                            <Icon className="h-7 w-7" strokeWidth={2.1} />
                          </div>
                          <div className="mt-4 text-base font-semibold text-slate-950">
                            {item.label}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {item.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="grid gap-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="email">
                      Email
                    </label>
                    <input
                      className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-2 md:col-span-2">
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-sm font-medium text-slate-700" htmlFor="password">
                        Пароль
                      </label>
                      <button
                        className="text-xs font-semibold text-slate-500"
                        type="button"
                        onClick={() => setShowPassword((currentValue) => !currentValue)}
                      >
                        {showPassword ? "Сховати" : "Показати"}
                      </button>
                    </div>
                    <input
                      className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      minLength={8}
                      required
                    />
                  </div>
                </div>
              ) : null}

              {step === 3 && role ? (
                <div className="grid gap-5 md:grid-cols-2">
                  {role === "parent" ? (
                    <>
                      <div className="grid gap-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700" htmlFor="parent-name">
                          Ваше ім&apos;я
                        </label>
                        <input
                          className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                          id="parent-name"
                          type="text"
                          value={fullName}
                          onChange={(event) => setFullName(event.target.value)}
                        />
                      </div>

                      <div className="grid gap-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700" htmlFor="parent-city">
                          Місто
                        </label>
                        <input
                          className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                          id="parent-city"
                          type="text"
                          value={city}
                          onChange={(event) => setCity(event.target.value)}
                        />
                      </div>
                    </>
                  ) : null}

                  {role === "school" ? (
                    <>
                      <div className="grid gap-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700" htmlFor="school-name">
                          Назва школи
                        </label>
                        <input
                          className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                          id="school-name"
                          type="text"
                          value={schoolName}
                          onChange={(event) => setSchoolName(event.target.value)}
                          required
                        />
                      </div>

                      <div className="grid gap-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700" htmlFor="school-city">
                          Місто
                        </label>
                        <input
                          className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                          id="school-city"
                          type="text"
                          value={city}
                          onChange={(event) => setCity(event.target.value)}
                        />
                      </div>
                    </>
                  ) : null}

                  {role === "club" ? (
                    <>
                      <div className="grid gap-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700" htmlFor="club-name">
                          Назва гуртка
                        </label>
                        <input
                          className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                          id="club-name"
                          type="text"
                          value={fullName}
                          onChange={(event) => setFullName(event.target.value)}
                          required
                        />
                      </div>

                      <div className="grid gap-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700" htmlFor="club-city">
                          Місто
                        </label>
                        <input
                          className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                          id="club-city"
                          type="text"
                          value={city}
                          onChange={(event) => setCity(event.target.value)}
                        />
                      </div>

                      <div className="grid gap-3 md:col-span-2">
                        <p className="text-sm font-medium text-slate-700">Предмети</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {subjectOptions.map((subject) => {
                            const isChecked = subjects.includes(subject);

                            return (
                              <label
                                key={subject}
                                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                                  isChecked
                                    ? "border-blue-500 bg-blue-50 text-blue-900"
                                    : "border-slate-200 bg-white text-slate-700"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleSubjectToggle(subject)}
                                />
                                {subject}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-between gap-3">
                <button
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  type="button"
                  onClick={() => setStep((currentStep) => (currentStep > 1 ? ((currentStep - 1) as Step) : currentStep))}
                  disabled={step === 1}
                >
                  Назад
                </button>

                {step < 3 ? (
                  <button
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.24)] transition hover:bg-blue-700"
                    type="button"
                    onClick={goToNextStep}
                  >
                    Далі
                  </button>
                ) : (
                  <button
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.24)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Створення..." : "Створити акаунт"}
                  </button>
                )}
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5">
                <div className="text-sm font-semibold text-slate-900">Увійти як гість</div>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Перейдіть у демо-кабінет без реєстрації та подивіться інтерфейс для кожної ролі.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {roleCards.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.value}
                        className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        href={getGuestDashboardUrl(item.value)}
                      >
                        <Icon className="h-4 w-4 text-blue-600" strokeWidth={2.1} />
                        <span className="ml-2">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

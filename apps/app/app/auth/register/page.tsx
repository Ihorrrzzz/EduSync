"use client";

import {
  Eye,
  EyeOff,
  Paintbrush,
  School,
  type LucideIcon,
  UsersRound,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenSpinner } from "../../../components/screen-spinner";
import { apiFetch, type Profile, type ProfileRole } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import { getDashboardHomePath } from "../../../lib/dashboard-role-config";
import { parseProfileRole } from "../../../lib/profile-utils";
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
    description: "Пошук програм, AI-рекомендації та подання запитів на розгляд школою.",
    tone: "from-purple-500 to-fuchsia-600",
    highlights: [
      "Каталог сумісних програм",
      "Статуси запитів і шкільний розгляд",
      "AI-підсумок без автоматичного перенесення оцінок",
    ],
  },
  {
    value: "school",
    icon: School,
    label: "Школа",
    description: "Розгляд запитів, пакет доказів і фінальне рішення школи.",
    tone: "from-blue-500 to-blue-700",
    highlights: [
      "Черга запитів на розгляд",
      "AI-рекомендація як підтримка рішення",
      "Коментар школи та статуси розгляду",
    ],
  },
  {
    value: "club",
    icon: Paintbrush,
    label: "Гурток",
    description: "Публікація програм, AI-аналіз та підсумок доказів для школи.",
    tone: "from-emerald-500 to-green-600",
    highlights: [
      "Завантаження освітніх програм",
      "Структуровані результати навчання і спосіб оцінювання",
      "Пакет доказів для конкретних запитів",
    ],
  },
];

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

  useEffect(() => {
    if (!isLoading && profile) {
      router.replace(getDashboardHomePath(profile.role));
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

    if (role === "parent" && !fullName.trim()) {
      setError("Вкажіть ім'я та прізвище");
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
      router.push(getDashboardHomePath(data.profile.role));
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
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center">
        <section className="w-full rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <div className="mx-auto max-w-3xl">
            <form className="space-y-8" onSubmit={handleSubmit}>
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
                      <span className="text-xs text-slate-400">Мінімум 8 символів</span>
                    </div>
                    <div className="relative">
                      <input
                        className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 pr-14 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        minLength={8}
                        required
                      />
                      <button
                        aria-label={showPassword ? "Сховати пароль" : "Показати пароль"}
                        className="absolute right-4 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        type="button"
                        onClick={() => setShowPassword((currentValue) => !currentValue)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" strokeWidth={2.1} />
                        ) : (
                          <Eye className="h-4 w-4" strokeWidth={2.1} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 3 && role ? (
                <div className="grid gap-5 md:grid-cols-2">
                  {role === "parent" ? (
                    <>
                      <div className="grid gap-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700" htmlFor="parent-name">
                          Ім&apos;я та прізвище
                        </label>
                        <input
                          className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                          id="parent-name"
                          type="text"
                          value={fullName}
                          onChange={(event) => setFullName(event.target.value)}
                          required
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
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

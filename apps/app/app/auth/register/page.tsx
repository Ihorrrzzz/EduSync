"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, type Profile, type ProfileRole } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";

type RegisterResponse = {
  accessToken: string;
  profile: Profile;
};

type Step = 1 | 2 | 3;

const roleCards: Array<{
  value: ProfileRole;
  icon: string;
  label: string;
}> = [
  { value: "parent", icon: "👨‍👩‍👧", label: "Батьки / Учень" },
  { value: "school", icon: "🏫", label: "Школа" },
  { value: "club", icon: "🎨", label: "Гурток" },
];

const subjectOptions = [
  "Мистецтво",
  "Фізична культура",
  "Інформатика",
  "Математика",
  "Природничі науки",
  "Технології",
] as const;

function SpinnerScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin h-5 w-5 rounded-full border-2 border-blue-600 border-t-transparent" />
    </div>
  );
}

function parseRoleParam(role: string | null): ProfileRole | null {
  if (role === "parent" || role === "school" || role === "club") {
    return role;
  }

  return null;
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
  const [subjects, setSubjects] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && profile) {
      router.replace("/dashboard");
    }
  }, [isLoading, profile, router]);

  useEffect(() => {
    if (hasAppliedRolePreset) {
      return;
    }

    const requestedRole = parseRoleParam(
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

  const handleSubjectToggle = (subject: string) => {
    setSubjects((currentSubjects) =>
      currentSubjects.includes(subject)
        ? currentSubjects.filter((value) => value !== subject)
        : [...currentSubjects, subject],
    );
  };

  const handleStepTwoNext = () => {
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
    return <SpinnerScreen />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Реєстрація</h1>
            <p className="mt-1 text-sm text-gray-500">Крок {step} з 3</p>
          </div>
          <Link className="text-sm text-blue-600 hover:text-blue-700" href="/auth/login">
            Увійти
          </Link>
        </div>

        <form className="mt-6" onSubmit={handleSubmit}>
          {step === 1 ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                {roleCards.map((item) => {
                  const isSelected = item.value === role;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      className={`border rounded-xl p-5 cursor-pointer transition text-left ${
                        isSelected
                          ? "border-2 border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setRole(item.value)}
                    >
                      <div className="text-3xl">{item.icon}</div>
                      <div className="mt-3 text-sm font-medium text-gray-900">
                        {item.label}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:cursor-not-allowed disabled:bg-blue-300"
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!role}
                >
                  Далі
                </button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="email">
                  Email
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="password">
                  Пароль
                </label>
                <div className="relative">
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={8}
                    required
                  />
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                    type="button"
                    onClick={() => setShowPassword((currentValue) => !currentValue)}
                  >
                    {showPassword ? "Сховати" : "Показати"}
                  </button>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                  type="button"
                  onClick={() => setStep(1)}
                >
                  Назад
                </button>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  type="button"
                  onClick={handleStepTwoNext}
                >
                  Далі
                </button>
              </div>
            </div>
          ) : null}

          {step === 3 && role ? (
            <div className="space-y-4">
              {role === "parent" ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="parent-name">
                    Ваше ім&apos;я
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="parent-name"
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </div>
              ) : null}

              {role === "school" ? (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="school-name">
                      Назва школи
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      id="school-name"
                      type="text"
                      value={schoolName}
                      onChange={(event) => setSchoolName(event.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="school-city">
                      Місто
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="club-name">
                      Назва гуртка
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      id="club-name"
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="club-city">
                      Місто
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      id="club-city"
                      type="text"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-700">Предмети</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {subjectOptions.map((subject) => {
                        const isChecked = subjects.includes(subject);

                        return (
                          <label
                            key={subject}
                            className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
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

              <div className="flex justify-between">
                <button
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                  type="button"
                  onClick={() => setStep(2)}
                >
                  Назад
                </button>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:cursor-not-allowed disabled:bg-blue-300"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Створення..." : "Зареєструватись"}
                </button>
              </div>
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </form>
      </div>
    </main>
  );
}

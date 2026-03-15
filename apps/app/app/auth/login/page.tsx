"use client";

import { CircleCheck, Eye, EyeOff, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ScreenSpinner } from "../../../components/screen-spinner";
import { apiFetch, type Profile } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import { getSiteUrl } from "../../../lib/public-env";

type LoginResponse = {
  accessToken: string;
  profile: Profile;
};

const loginHighlights = [
  "Один кабінет для школи, родини та гуртка",
  "Прозорі статуси запитів на врахування",
  "AI-порівняння програм як підтримка рішення школи",
];

export default function LoginPage() {
  const router = useRouter();
  const { isLoading, profile, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const siteUrl = getSiteUrl();

  useEffect(() => {
    if (!isLoading && profile) {
      router.replace("/dashboard");
    }
  }, [isLoading, profile, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const data = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      login(data.accessToken, data.profile);
      router.push("/dashboard");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Не вдалося увійти",
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
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="rounded-[2rem] bg-[linear-gradient(155deg,#2563ff,#153db8)] p-6 text-white shadow-[0_30px_80px_rgba(37,99,255,0.24)] sm:p-8 lg:p-10">
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
                Вхід
              </span>
            </div>

            <div className="mt-12 max-w-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
                Повернення в кабінет
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl">
                Запити, докази та рішення школи в одному місці.
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-white/82 sm:text-lg">
                Увійдіть до кабінету, щоб працювати із запитами на врахування,
                пакетом доказів від гуртка та AI-рекомендацією.
              </p>
            </div>

            <div className="mt-10 grid gap-4">
              {loginHighlights.map((item) => (
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

            <div className="mt-auto pt-8 text-sm text-white/72">
              Для нового кабінету використайте рольову реєстрацію на публічному
              сайті або перейдіть до форми створення акаунта.
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <div className="mx-auto max-w-xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">
                  Доступ
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                  Вхід до EduSync
                </h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                  Вкажіть email та пароль, щоб перейти до власного кабінету.
                </p>
              </div>

              <Link
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                href="/auth/register"
              >
                Реєстрація
              </Link>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-2">
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

              <div className="grid gap-2">
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

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.24)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Вхід..." : "Увійти в кабінет"}
              </button>
            </form>

            <div className="mt-8 grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              <div className="font-semibold text-slate-900">Ще не маєте акаунту?</div>
              <p className="leading-6">
                Створіть профіль для школи, родини або гуртка та одразу отримайте
                кабінет із потрібними інструментами.
              </p>
              <Link className="font-semibold text-blue-700" href="/auth/register">
                Перейти до реєстрації →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

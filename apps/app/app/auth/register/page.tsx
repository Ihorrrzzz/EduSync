"use client";

import { CircleCheck, GraduationCap, Paintbrush, School, UsersRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ScreenSpinner } from "../../../components/screen-spinner";
import { apiFetch, type Profile, type ProfileRole } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import { parseProfileRole } from "../../../lib/profile-utils";
import { getSiteUrl } from "../../../lib/public-env";

type RegisterResponse = {
  accessToken: string;
  profile: Profile;
};

type RegisterFormState = {
  schoolName: string;
  clubName: string;
  city: string;
  fullName: string;
  phone: string;
  email: string;
  login: string;
  password: string;
  repeatPassword: string;
};

const emptyFormState: RegisterFormState = {
  schoolName: "",
  clubName: "",
  city: "",
  fullName: "",
  phone: "",
  email: "",
  login: "",
  password: "",
  repeatPassword: "",
};

const roleCards: Array<{
  value: ProfileRole;
  icon: typeof School;
  label: string;
  description: string;
  tone: string;
  highlights: string[];
}> = [
  {
    value: "parent",
    icon: UsersRound,
    label: "Профіль родини",
    description: "Реєстрація для батьків та учнів із доступом до каталогу програм і статусів запитів.",
    tone: "from-purple-500 to-fuchsia-600",
    highlights: [
      "Пошук програм і подання запитів",
      "Статуси шкільного розгляду",
      "AI-підсумок для звернення до школи",
    ],
  },
  {
    value: "school",
    icon: School,
    label: "Профіль школи",
    description: "Реєстрація шкільної команди для перегляду запитів, доказів і фінальних рішень.",
    tone: "from-blue-500 to-blue-700",
    highlights: [
      "Черга запитів на розгляд",
      "AI-рекомендація для команди школи",
      "Фінальні рішення та коментарі",
    ],
  },
  {
    value: "club",
    icon: Paintbrush,
    label: "Профіль гуртка",
    description: "Реєстрація провайдера програми для подання матеріалів і пакета доказів.",
    tone: "from-emerald-500 to-green-600",
    highlights: [
      "Публікація програм та описів",
      "Пакет доказів для школи",
      "Супровід запитів на врахування",
    ],
  },
];

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "email" | "password" | "tel" | "text";
  autoComplete?: string;
  required?: boolean;
  hint?: string;
};

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  required = true,
  hint,
}: FieldProps) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-4">
        <label className="text-sm font-medium text-slate-700" htmlFor={id}>
          {label}
        </label>
        {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
      </div>
      <input
        autoComplete={autoComplete}
        className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
        id={id}
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { isLoading, profile, login } = useAuth();
  const [role, setRole] = useState<ProfileRole | null>(null);
  const [hasAppliedRolePreset, setHasAppliedRolePreset] = useState(false);
  const [formState, setFormState] = useState<RegisterFormState>(emptyFormState);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const siteUrl = getSiteUrl();

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

    if (requestedRole) {
      setRole((currentRole) => currentRole ?? requestedRole);
    }

    setHasAppliedRolePreset(true);
  }, [hasAppliedRolePreset]);

  const selectedRoleCard = roleCards.find((item) => item.value === role) ?? null;
  const passwordMismatch =
    formState.repeatPassword.length > 0 && formState.password !== formState.repeatPassword;

  const updateField = (field: keyof RegisterFormState, value: string) => {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!role) {
      return "Оберіть роль, щоб продовжити";
    }

    if (role === "school" && !formState.schoolName.trim()) {
      return "Вкажіть назву школи";
    }

    if (role === "school" && !formState.city.trim()) {
      return "Вкажіть місто";
    }

    if (role === "school" && !formState.fullName.trim()) {
      return "Вкажіть ПІБ директора";
    }

    if (role === "parent" && !formState.fullName.trim()) {
      return "Вкажіть ПІБ";
    }

    if (role === "club" && !formState.city.trim()) {
      return "Вкажіть місто";
    }

    if (role === "club" && !formState.clubName.trim()) {
      return "Вкажіть назву гуртка";
    }

    if (role === "club" && !formState.fullName.trim()) {
      return "Вкажіть ПІБ адміністратора";
    }

    if (!formState.phone.trim()) {
      return role === "club" ? "Вкажіть телефон" : "Вкажіть мобільний телефон";
    }

    if (!formState.email.trim()) {
      return "Вкажіть email";
    }

    if (role !== "club" && !formState.login.trim()) {
      return "Вкажіть логін";
    }

    if (formState.password.length < 8) {
      return "Пароль має містити щонайменше 8 символів";
    }

    if (!formState.repeatPassword) {
      return "Повторіть пароль";
    }

    if (formState.password !== formState.repeatPassword) {
      return "Паролі не збігаються";
    }

    return "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!role) {
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
          schoolName: formState.schoolName.trim() || undefined,
          clubName: formState.clubName.trim() || undefined,
          city: formState.city.trim() || undefined,
          fullName: formState.fullName.trim() || undefined,
          phone: formState.phone.trim() || undefined,
          email: formState.email.trim(),
          login: role === "club" ? undefined : formState.login.trim() || undefined,
          password: formState.password,
          repeatPassword: formState.repeatPassword,
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
                Реєстрація
              </span>
            </div>

            <div className="mt-12">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
                Новий кабінет
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl">
                Створіть профіль для школи, родини або гуртка.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-white/82 sm:text-lg">
                Після вибору ролі відкриється форма з потрібними полями для реєстрації.
              </p>
            </div>

            <div className="mt-10 rounded-[1.75rem] border border-white/12 bg-white/10 p-6">
              <div className="flex items-start gap-4">
                <span
                  className={`grid h-14 w-14 shrink-0 place-items-center rounded-[1.25rem] text-white ${
                    selectedRoleCard
                      ? `bg-gradient-to-r ${selectedRoleCard.tone}`
                      : "bg-white/16"
                  }`}
                >
                  {selectedRoleCard ? (
                    <selectedRoleCard.icon className="h-7 w-7" strokeWidth={2.1} />
                  ) : (
                    <GraduationCap className="h-7 w-7" strokeWidth={2.1} />
                  )}
                </span>
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
                    {selectedRoleCard ? "Обрана роль" : "Вибір ролі"}
                  </div>
                  <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                    {selectedRoleCard ? selectedRoleCard.label : "Оберіть потрібний тип акаунта"}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/78">
                    {selectedRoleCard
                      ? selectedRoleCard.description
                      : "Кнопки ролей праворуч відкриють форму з потрібними полями для реєстрації."}
                  </p>
                </div>
              </div>

              {selectedRoleCard ? (
                <div className="mt-6 grid gap-3">
                  {selectedRoleCard.highlights.map((item) => (
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
              ) : null}

              <div className="mt-6 text-sm text-white/72">
                Уже маєте акаунт?{" "}
                <Link className="font-semibold text-white" href="/auth/login">
                  Увійти →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">
                  Дані профілю
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                  Реєстрація в EduSync
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  Оберіть роль і заповніть поля. Для школи та родини можна створити окремий
                  логін, для гуртка вхід залишиться доступним через email.
                </p>
              </div>

              <Link
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                href="/auth/login"
              >
                Вхід
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {roleCards.map((item) => {
                const isSelected = item.value === role;
                const Icon = item.icon;

                return (
                  <button
                    key={item.value}
                    className={`rounded-[1.5rem] border p-5 text-left transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-[0_18px_30px_rgba(37,99,255,0.12)]"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                    type="button"
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
                    <div className="mt-4 text-base font-semibold text-slate-950">{item.label}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                  </button>
                );
              })}
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {!role ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm text-slate-500">
                  Оберіть роль вище, щоб відкрити форму реєстрації.
                </div>
              ) : null}

              {role === "school" ? (
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Field
                      id="school-name"
                      label="Назва школи"
                      value={formState.schoolName}
                      onChange={(value) => updateField("schoolName", value)}
                    />
                  </div>
                  <Field
                    id="school-city"
                    label="Місто"
                    value={formState.city}
                    onChange={(value) => updateField("city", value)}
                  />
                  <Field
                    id="school-principal"
                    label="ПІБ директора"
                    value={formState.fullName}
                    onChange={(value) => updateField("fullName", value)}
                  />
                  <Field
                    id="school-phone"
                    label="Мобільний телефон"
                    value={formState.phone}
                    onChange={(value) => updateField("phone", value)}
                    type="tel"
                    autoComplete="tel"
                  />
                  <Field
                    id="school-email"
                    label="Email"
                    value={formState.email}
                    onChange={(value) => updateField("email", value)}
                    type="email"
                    autoComplete="email"
                  />
                  <Field
                    id="school-login"
                    label="Логін"
                    value={formState.login}
                    onChange={(value) => updateField("login", value)}
                    autoComplete="username"
                  />
                </div>
              ) : null}

              {role === "parent" ? (
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    id="parent-name"
                    label="ПІБ"
                    value={formState.fullName}
                    onChange={(value) => updateField("fullName", value)}
                  />
                  <Field
                    id="parent-phone"
                    label="Мобільний телефон"
                    value={formState.phone}
                    onChange={(value) => updateField("phone", value)}
                    type="tel"
                    autoComplete="tel"
                  />
                  <Field
                    id="parent-email"
                    label="Email"
                    value={formState.email}
                    onChange={(value) => updateField("email", value)}
                    type="email"
                    autoComplete="email"
                  />
                  <Field
                    id="parent-login"
                    label="Логін"
                    value={formState.login}
                    onChange={(value) => updateField("login", value)}
                    autoComplete="username"
                  />
                </div>
              ) : null}

              {role === "club" ? (
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    id="club-city"
                    label="Місто"
                    value={formState.city}
                    onChange={(value) => updateField("city", value)}
                  />
                  <Field
                    id="club-name"
                    label="Назва гуртка"
                    value={formState.clubName}
                    onChange={(value) => updateField("clubName", value)}
                  />
                  <Field
                    id="club-phone"
                    label="Телефон"
                    value={formState.phone}
                    onChange={(value) => updateField("phone", value)}
                    type="tel"
                    autoComplete="tel"
                  />
                  <Field
                    id="club-admin"
                    label="ПІБ адміністратора"
                    value={formState.fullName}
                    onChange={(value) => updateField("fullName", value)}
                  />
                  <div className="md:col-span-2">
                    <Field
                      id="club-email"
                      label="Email"
                      value={formState.email}
                      onChange={(value) => updateField("email", value)}
                      type="email"
                      autoComplete="email"
                    />
                  </div>
                </div>
              ) : null}

              {role ? (
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    id="password"
                    label="Пароль"
                    value={formState.password}
                    onChange={(value) => updateField("password", value)}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    hint="Мінімум 8 символів"
                  />
                  <Field
                    id="repeat-password"
                    label="Повторіть пароль"
                    value={formState.repeatPassword}
                    onChange={(value) => updateField("repeatPassword", value)}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                  />

                  <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700 md:col-span-2">
                    <input
                      checked={showPassword}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      type="checkbox"
                      onChange={(event) => setShowPassword(event.target.checked)}
                    />
                    Показати пароль
                  </label>

                  {passwordMismatch ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 md:col-span-2">
                      Паролі в полях «Пароль» і «Повторіть пароль» не збігаються.
                    </div>
                  ) : null}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.24)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                disabled={isSubmitting || !role}
                type="submit"
              >
                {isSubmitting ? "Створення..." : "Створити акаунт"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

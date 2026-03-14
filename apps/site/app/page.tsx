"use client";

import Link from "next/link";
import { useState } from "react";

const audienceCards = [
  {
    title: "Для батьків та учнів",
    description:
      "Бачите запити на зарахування результатів, прогрес дитини та рекомендації щодо сумісних програм.",
  },
  {
    title: "Для шкіл",
    description:
      "Погоджуєте заміни предметів, отримуєте структуровані результати та керуєте партнерствами з гуртками.",
  },
  {
    title: "Для гуртків",
    description:
      "Публікуєте програми, надсилаєте оцінки й підключаєтесь до шкіл у єдиному цифровому середовищі.",
  },
];

const workflowSteps = [
  "Родина або школа створює запит на зарахування результатів позашкільного навчання.",
  "Гурток передає опис програми, оцінки та прогрес у цифровому форматі.",
  "Школа приймає рішення, а всі сторони бачать узгоджений статус в одному процесі.",
];

const registerRoles = [
  {
    role: "school",
    tone: "blue",
    icon: "🏫",
    title: "Для шкіл",
    description: "Керуйте мережевим навчанням і погоджуйте заміну предметів.",
    features: [
      "Погодження заявок на зарахування",
      "Партнерства з позашкільними закладами",
      "Моніторинг навчального прогресу",
      "Цифрові домовленості та звіти",
    ],
    actionLabel: "Продовжити як школа",
  },
  {
    role: "parent",
    tone: "purple",
    icon: "👨‍👩‍👧",
    title: "Для батьків та учнів",
    description:
      "Знаходьте перевірені програми та відстежуйте освітній маршрут дитини.",
    features: [
      "Каталог перевірених програм",
      "Підбір сумісних напрямів навчання",
      "Перегляд оцінок і прогресу",
      "Подання запитів на зарахування",
    ],
    actionLabel: "Продовжити як родина",
  },
  {
    role: "club",
    tone: "green",
    icon: "🎨",
    title: "Для гуртків",
    description:
      "Розширюйте співпрацю зі школами та передавайте результати навчання в стандартизованому форматі.",
    features: [
      "Публікація програм і напрямів",
      "Перевірка сумісності з навчальними предметами",
      "Керування запитами від шкіл",
      "Надсилання оцінок і звітів",
    ],
    actionLabel: "Продовжити як гурток",
  },
];

type ActivePage = "landing" | "register";

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002";
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export default function SiteHomePage() {
  const [activePage, setActivePage] = useState<ActivePage>("landing");
  const appUrl = getAppUrl();

  const showRegisterPage = () => {
    setActivePage("register");
    scrollToTop();
  };

  const showLandingPage = () => {
    setActivePage("landing");
    scrollToTop();
  };

  return (
    <>
      <main
        className={`page ${activePage === "landing" ? "active" : ""}`}
        id="landingPage"
      >
        <div className="px-4 py-6 md:px-8">
          <div className="mx-auto flex min-h-screen max-w-6xl flex-col">
            <header className="flex flex-wrap items-center justify-between gap-4 py-4">
              <button
                className="inline-flex items-center gap-3 text-left"
                type="button"
                onClick={showLandingPage}
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-xl text-white shadow-[0_12px_30px_rgba(37,99,235,0.28)]">
                  📘
                </span>
                <span>
                  <span className="block text-lg font-semibold tracking-tight text-slate-950">
                    EduSync
                  </span>
                  <span className="block text-sm text-slate-500">
                    Платформа визнання позашкільної освіти
                  </span>
                </span>
              </button>

              <div className="flex flex-wrap gap-3">
                <Link
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white/70"
                  href={`${appUrl}/auth/login`}
                >
                  Увійти
                </Link>
                <button
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-[0_14px_34px_rgba(37,99,235,0.24)] transition hover:bg-blue-700"
                  type="button"
                  onClick={showRegisterPage}
                >
                  Почати
                </button>
              </div>
            </header>

            <section className="grid flex-1 items-center gap-10 py-12 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.26em] text-blue-700">
                  Публічний сайт EduSync
                </p>
                <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">
                  EduSync з&apos;єднує школу, гурток і родину в одному цифровому
                  процесі.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                  Пояснюємо, як працює визнання результатів позашкільного
                  навчання, і даємо швидкий вхід у рольову реєстрацію для кожної
                  сторони процесу.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    type="button"
                    onClick={showRegisterPage}
                  >
                    Почати
                  </button>
                  <Link
                    className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white/70"
                    href={`${appUrl}/auth/login`}
                  >
                    Перейти в кабінет
                  </Link>
                </div>

                <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium text-slate-600">
                  <span className="rounded-full border border-white/80 bg-white/70 px-4 py-2 shadow-sm">
                    Верифіковані ролі
                  </span>
                  <span className="rounded-full border border-white/80 bg-white/70 px-4 py-2 shadow-sm">
                    Єдиний статус заявок
                  </span>
                  <span className="rounded-full border border-white/80 bg-white/70 px-4 py-2 shadow-sm">
                    Цифрові результати навчання
                  </span>
                </div>
              </div>

              <div className="rounded-[2rem] border border-blue-100 bg-white/90 p-6 shadow-[0_32px_90px_rgba(37,99,235,0.14)] backdrop-blur">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Ролі
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      3
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Процес
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      1 маршрут
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Формат
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      online
                    </p>
                  </div>
                </div>

                <h2 className="mt-6 text-xl font-semibold text-slate-950">
                  Як працює процес
                </h2>
                <ol className="mt-6 space-y-4">
                  {workflowSteps.map((step, index) => (
                    <li
                      key={step}
                      className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-6 text-slate-700">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            <section className="pb-12">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Для кого платформа
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    Окремий сценарій для кожного учасника
                  </h2>
                </div>
                <button
                  className="hidden rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white/70 md:inline-flex"
                  type="button"
                  onClick={showRegisterPage}
                >
                  Обрати роль
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {audienceCards.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-6 shadow-sm"
                  >
                    <h3 className="text-lg font-semibold text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <footer className="border-t border-slate-200 py-6 text-sm text-slate-500">
              EduSync допомагає школам, родинам і гурткам працювати з визнанням
              результатів позашкільної освіти без розриву між системами.
            </footer>
          </div>
        </div>
      </main>

      <section
        className={`page register-page ${
          activePage === "register" ? "active" : ""
        }`}
        id="registerPage"
      >
        <div className="register-wrap px-4 md:px-8">
          <div className="register-top">
            <button
              className="inline-flex items-center gap-3 text-left"
              id="registerBrand"
              type="button"
              onClick={showLandingPage}
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-xl text-white">
                📘
              </span>
              <span className="text-lg font-semibold tracking-tight text-slate-950">
                EduSync
              </span>
            </button>

            <Link
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
              href={`${appUrl}/auth/login`}
            >
              Увійти
            </Link>
          </div>

          <div className="register-hero">
            <h1>Почніть роботу з EduSync</h1>
            <p>
              Оберіть роль, щоб створити акаунт і підключити школу, родину або
              гурток до спільного цифрового процесу.
            </p>
          </div>

          <div className="role-grid">
            {registerRoles.map((item) => (
              <article key={item.role} className="role-card">
                <div className={`role-top ${item.tone}`}>
                  <div className="role-icon">{item.icon}</div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>

                <div className="role-body">
                  <ul>
                    {item.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>

                  <Link
                    className={`btn-role ${item.tone}`}
                    href={`${appUrl}/auth/register?role=${item.role}`}
                  >
                    {item.actionLabel} →
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="register-bottom">
            <p>
              Вже маєте акаунт?{" "}
              <Link href={`${appUrl}/auth/login`}>Увійти</Link>
            </p>
            <div className="register-meta">
              <span>Безкоштовний старт</span>
              <span>Без банківської картки</span>
              <span>Налаштування за кілька хвилин</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

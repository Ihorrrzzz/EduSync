import Link from "next/link";

const roleDescriptions = [
  {
    title: "Для батьків та учнів",
    description:
      "Єдина точка входу, де видно визнання результатів позашкільного навчання.",
  },
  {
    title: "Для шкіл",
    description:
      "Школи отримують структуровані результати від гуртків і можуть їх підтвердити.",
  },
  {
    title: "Для гуртків",
    description:
      "Позашкільні заклади передають оцінки та предметні результати в узгодженому форматі.",
  },
];

const steps = [
  "Користувач реєструється як parent, school або club.",
  "Гурток передає результати навчання через цифровий кабінет.",
  "Школа працює з підтвердженням, а батьки бачать загальний прогрес.",
];

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002";
}

export default function SiteHomePage() {
  const appUrl = getAppUrl();

  return (
    <main className="px-4 py-6 md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between py-4">
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            EduSync
          </span>
          <div className="flex gap-3">
            <Link
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              href={`${appUrl}/auth/login`}
            >
              Увійти
            </Link>
            <Link
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              href={`${appUrl}/auth/register`}
            >
              Зареєструватись
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 md:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-700">
              Освітня платформа
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">
              EduSync з&apos;єднує школу, гурток і родину в одному цифровому процесі.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Публічний сайт пояснює, як працює система визнання позашкільної
              освіти. Робочі кабінети з авторизацією винесені в окремий app.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                href={`${appUrl}/auth/register`}
              >
                Почати роботу
              </Link>
              <Link
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                href={`${appUrl}/auth/login`}
              >
                Перейти в кабінет
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-white/80 p-6 shadow-[0_30px_80px_rgba(37,99,235,0.12)] backdrop-blur">
            <h2 className="text-xl font-semibold text-slate-900">
              Що користувач бачить у системі
            </h2>
            <ol className="mt-6 space-y-4">
              {steps.map((step, index) => (
                <li
                  key={step}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-slate-700">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="pb-10">
          <div className="grid gap-4 md:grid-cols-3">
            {roleDescriptions.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-slate-900">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

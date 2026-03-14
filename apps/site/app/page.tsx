"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";

const navLinks = [
  { href: "#how", label: "Як це працює" },
  { href: "#ai", label: "AI-порівняння" },
  { href: "#users", label: "Для користувачів" },
  { href: "#dashboards", label: "Платформа" },
  { href: "#trust", label: "Довіра" },
];

const heroStats = [
  { value: "10K+", label: "активних шкіл" },
  { value: "500K+", label: "батьків і учнів" },
  { value: "2K+", label: "підключених гуртків" },
];

const processSteps = [
  {
    number: "01",
    icon: "🏫",
    title: "Школа приєднується до платформи",
    description:
      "Школа реєструється, приймає умови мережевої форми освіти та відкриває можливість партнерства з гуртками.",
  },
  {
    number: "02",
    icon: "👨‍👩‍👧",
    title: "Батьки обирають гурток",
    description:
      "Батьки знаходять перевірену програму для дитини та подають заявку на заміну предмета.",
  },
  {
    number: "03",
    icon: "🧠",
    title: "AI порівнює програми",
    description:
      "Система аналізує відповідність програми гуртка державним або затвердженим шкільним стандартам.",
  },
  {
    number: "04",
    icon: "✅",
    title: "Школа розглядає та схвалює",
    description:
      "Адміністрація бачить висновок AI, прогалини в темах та ухвалює рішення щодо погодження заміни.",
  },
  {
    number: "05",
    icon: "📝",
    title: "Підписується цифрова угода",
    description:
      "Школа й гурток укладають формальну угоду про співпрацю, відповідальність та перенесення оцінок.",
  },
  {
    number: "06",
    icon: "📋",
    title: "Оцінки та звіти передаються",
    description:
      "Гурток веде відвідуваність, виставляє оцінки й надсилає результати безпосередньо в шкільну систему.",
  },
];

const aiFeatures = [
  {
    icon: "✓",
    color: "#22c55e",
    title: "Наскільки збігається",
    description: "Відсоток відповідності програми офіційним стандартам.",
  },
  {
    icon: "▣",
    color: "#c084fc",
    title: "Які компетентності покриті",
    description: "Детальний розбір навичок і результатів навчання.",
  },
  {
    icon: "!",
    color: "#f2b318",
    title: "Які теми відсутні",
    description:
      "Зрозуміле виділення прогалин, які потребують доопрацювання.",
  },
  {
    icon: "◎",
    color: "#60a5fa",
    title: "Рекомендація щодо заміни",
    description: "Повна або часткова придатність для зарахування предмета.",
  },
];

const userCards = [
  {
    icon: "🏢",
    title: "Для шкіл",
    description:
      "Керуйте мережевою формою освіти з повною прозорістю та контролем за погодженням заміни предметів.",
    features: [
      "Погодження заміни предметів",
      "Керування партнерськими угодами",
      "Перегляд журналів і оцінок від гуртків",
      "Контроль освітніх маршрутів учнів",
      "Підписання цифрових договорів",
    ],
  },
  {
    icon: "♡",
    title: "Для батьків",
    description:
      "Знаходьте відповідні програми для дитини, отримуйте рекомендації AI та відстежуйте прогрес.",
    features: [
      "Пошук гуртків і програм",
      "AI-рекомендації щодо відповідності",
      "Подання заявок на заміну предмета",
      "Перегляд оцінок і прогресу",
      "Доступ до документів і статусів",
    ],
  },
  {
    icon: "🎓",
    title: "Для гуртків",
    description:
      "Розвивайте партнерства зі школами, публікуйте програми та ведіть звітність у єдиному форматі.",
    features: [
      "Завантаження навчальних програм",
      "Перевірка сумісності з програмою МОН",
      "Управління співпрацею зі школами",
      "Ведення відвідуваності й оцінювання",
      "Формування офіційних звітів",
    ],
  },
];

const trustCards = [
  {
    icon: "☑",
    title: "Перевірені програми",
    description:
      "Усі освітні програми проходять перевірку й зіставляються з офіційними стандартами.",
  },
  {
    icon: "⇄",
    title: "Прозоре перенесення оцінок",
    description:
      "Чіткий, контрольований процес передачі результатів навчання від гуртків до шкіл.",
  },
  {
    icon: "✍",
    title: "Цифрові договори",
    description:
      "Юридично значимі угоди про співпрацю та перенесення оцінок, підписані в електронному форматі.",
  },
  {
    icon: "👥",
    title: "Зрозуміла відповідальність",
    description:
      "Ролі та зони відповідальності школи, батьків і гуртка визначені на кожному етапі маршруту.",
  },
  {
    icon: "🛡",
    title: "Безпечний документообіг",
    description:
      "Захищене зберігання, передавання та архівування всіх документів і погоджень.",
  },
  {
    icon: "🔒",
    title: "Захист даних",
    description:
      "Платформа підтримує вимоги до конфіденційності освітніх даних та персональної інформації.",
  },
];

const testimonials = [
  {
    quote:
      "AI-порівняння програм дало нам упевненість у погодженні заміни предметів. Прозорість процесу справді вражає.",
    name: "Марія Соколова",
    role: "Директорка, школа №127",
  },
  {
    quote:
      "Нарешті є платформа, де я бачу прогрес дитини і в школі, і в гуртку в одному місці. Перенесення оцінок працює без хаосу.",
    name: "Олексій Петров",
    role: "Батько двох учнів",
  },
  {
    quote:
      "Ми співпрацюємо вже з 15 школами, а платформа автоматизувала і звітність, і документи. Це реально змінило процес.",
    name: "Олена Іванова",
    role: "Директорка мовного центру",
  },
];

const footerColumns = [
  {
    title: "Платформа",
    links: [
      { href: "#how", label: "Як це працює" },
      { href: "#ai", label: "AI-порівняння" },
      { href: "#dashboards", label: "Можливості" },
      { href: "#trust", label: "Безпека" },
    ],
  },
  {
    title: "Для користувачів",
    links: [
      { href: "#users", label: "Для шкіл" },
      { href: "#users", label: "Для батьків" },
      { href: "#users", label: "Для гуртків" },
      { href: "#cta", label: "Почати" },
    ],
  },
  {
    title: "Компанія",
    links: [
      { href: "#home", label: "Про платформу" },
      { href: "#testimonials", label: "Відгуки" },
      { href: "#footer", label: "Контакти" },
      { href: "#footer", label: "Блог" },
    ],
  },
  {
    title: "Юридичне",
    links: [
      { href: "#footer", label: "Privacy Policy" },
      { href: "#footer", label: "Terms of Use" },
      { href: "#footer", label: "Documents" },
      { href: "#footer", label: "Compliance" },
    ],
  },
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

const dashboardData = {
  school: {
    title: "Шкільний дашборд",
    description: "Керуйте мережевим навчанням, погодженнями та партнерствами.",
    metrics: [
      { label: "👥 Активні учні", value: "847", color: "#2563ff", border: "#bfd8ff" },
      { label: "🗂 Запити на розгляді", value: "24", color: "#9333ea", border: "#ead5ff" },
      { label: "🎓 Партнерські гуртки", value: "12", color: "#16a34a", border: "#bbf7d0" },
    ],
    rows: [
      {
        title: "Анна Петрова",
        description: "Англійська мова → Мовний центр International",
        badge: "Очікує",
        badgeClass: "pending",
      },
      {
        title: "Іван Сидоров",
        description: "Музичне мистецтво → City Music Academy",
        badge: "Схвалено",
        badgeClass: "approved",
      },
      {
        title: "Марія Іванова",
        description: "Фізична культура → Sports Complex Olymp",
        badge: "Розгляд",
        badgeClass: "reviewing",
      },
    ],
  },
  parent: {
    title: "Батьківський дашборд",
    description: "Відстежуйте заявки, прогрес дитини та освітні маршрути.",
    metrics: [
      { label: "👦 Підключені діти", value: "2", color: "#2563ff", border: "#bfd8ff" },
      { label: "🧠 AI-збіги", value: "14", color: "#9333ea", border: "#ead5ff" },
      { label: "📄 Активні запити", value: "3", color: "#16a34a", border: "#bbf7d0" },
    ],
    rows: [
      {
        title: "Запит на заміну англійської",
        description: "Рівень відповідності 92% · школа ще розглядає заявку",
        badge: "У розгляді",
        badgeClass: "reviewing",
      },
      {
        title: "Маршрут з фортепіано",
        description: "Відвідуваність 100% · доступний новий місячний звіт",
        badge: "Активно",
        badgeClass: "approved",
      },
      {
        title: "Програма з плавання",
        description: "Угоду підписано · перенесення оцінок готове",
        badge: "Синхронізовано",
        badgeClass: "active",
      },
    ],
  },
  club: {
    title: "Дашборд гуртка",
    description: "Публікуйте програми, працюйте зі школами та ведіть офіційну звітність.",
    metrics: [
      { label: "📚 Опубліковані програми", value: "18", color: "#2563ff", border: "#bfd8ff" },
      { label: "🏫 Партнерські школи", value: "15", color: "#9333ea", border: "#ead5ff" },
      { label: "📝 Звітів цього місяця", value: "41", color: "#16a34a", border: "#bbf7d0" },
    ],
    rows: [
      {
        title: "Програма English Intensive",
        description: "Відповідність 92% · готова до подання в школу",
        badge: "Перевірено",
        badgeClass: "approved",
      },
      {
        title: "Нова угода зі школою №127",
        description: "Потрібен підпис директора та активація співпраці",
        badge: "Очікує",
        badgeClass: "pending",
      },
      {
        title: "Звіт з відвідуваності",
        description: "Група англійської для 9 класу · надіслано цього тижня",
        badge: "Надіслано",
        badgeClass: "active",
      },
    ],
  },
} as const;

type ActivePage = "landing" | "register";
type DashboardTab = keyof typeof dashboardData;

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002";
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export default function SiteHomePage() {
  const [activePage, setActivePage] = useState<ActivePage>("landing");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDashboard, setActiveDashboard] = useState<DashboardTab>("school");
  const appUrl = getAppUrl();

  const showRegisterPage = () => {
    setActivePage("register");
    setIsMenuOpen(false);
    scrollToTop();
  };

  const showLandingPage = () => {
    setActivePage("landing");
    setIsMenuOpen(false);
    scrollToTop();
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <main
        className={`page ${activePage === "landing" ? "active" : ""}`}
        id="landingPage"
      >
        <header className="site-header">
          <div className="container header-inner">
            <button className="brand brand-button" type="button" onClick={showLandingPage}>
              <span className="brand-mark">📘</span>
              <span>EduSync</span>
            </button>

            <nav className={`nav ${isMenuOpen ? "open" : ""}`} id="navMenu">
              {navLinks.map((item) => (
                <a key={item.href} href={item.href} onClick={closeMenu}>
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="header-actions">
              <Link className="btn btn-ghost" href={`${appUrl}/auth/login`}>
                Увійти
              </Link>
              <button className="btn btn-primary" type="button" onClick={showRegisterPage}>
                Почати
              </button>
              <button
                aria-label="Відкрити меню"
                className="menu-toggle"
                id="menuToggle"
                type="button"
                onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
              >
                ☰
              </button>
            </div>
          </div>
        </header>

        <section className="hero" id="home">
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">Офіційне визнання позакласного навчання</span>
              <h1>
                Платформа для <span className="accent">зарахування</span>
                <br />
                позакласної освіти як частини
                <br />
                шкільної програми
              </h1>
              <p>
                Школи, батьки та гуртки працюють в одній системі: порівнюють
                програми за допомогою AI, укладають угоди, ведуть оцінювання та
                прозоро переносять результати навчання.
              </p>

              <div className="hero-actions">
                <button className="btn btn-primary" type="button" onClick={showRegisterPage}>
                  Почати роботу →
                </button>
                <a className="btn btn-secondary" href="#how">
                  ▷ Дивитися як це працює
                </a>
              </div>

              <div className="stats">
                {heroStats.map((item) => (
                  <div key={item.label} className="stat">
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-visual">
              <div className="window-card">
                <div className="window-top">
                  <span className="dot"></span>
                  Platform Dashboard
                </div>

                <div className="dashboard-preview">
                  <div className="preview-header">
                    <div>
                      <h3>Спільний освітній маршрут</h3>
                      <p>
                        Школа, батьки та гурток бачать одну й ту саму узгоджену
                        картину.
                      </p>
                    </div>
                    <div className="preview-pill">
                      <i></i>
                      Curriculum match verified
                    </div>
                  </div>

                  <div className="preview-body">
                    <div className="mini-card">
                      <h4>Для шкіл</h4>
                      <p>
                        Погодження заміни предметів, перегляд журналів,
                        партнерські гуртки та документи.
                      </p>
                      <ul className="check-list">
                        <li>Перевірка заявок батьків</li>
                        <li>Контроль перенесення оцінок</li>
                        <li>Підписання договорів</li>
                      </ul>
                    </div>

                    <div className="mini-card compare-card">
                      <div className="score-box">
                        <div>
                          <div>Загальна відповідність</div>
                          <strong>92%</strong>
                        </div>
                        <div className="ring"></div>
                      </div>

                      <div className="bar-list">
                        <div className="bar-row">
                          <span>
                            <b>Граматика</b>
                            <b>98%</b>
                          </span>
                          <div className="bar">
                            <i style={{ "--w": "98%", "--c": "#22c55e" } as CSSProperties}></i>
                          </div>
                        </div>
                        <div className="bar-row">
                          <span>
                            <b>Усне мовлення</b>
                            <b>95%</b>
                          </span>
                          <div className="bar">
                            <i style={{ "--w": "95%", "--c": "#22c55e" } as CSSProperties}></i>
                          </div>
                        </div>
                        <div className="bar-row">
                          <span>
                            <b>Читання</b>
                            <b>88%</b>
                          </span>
                          <div className="bar">
                            <i style={{ "--w": "88%", "--c": "#2563ff" } as CSSProperties}></i>
                          </div>
                        </div>
                        <div className="bar-row">
                          <span>
                            <b>Письмо</b>
                            <b>85%</b>
                          </span>
                          <div className="bar">
                            <i style={{ "--w": "85%", "--c": "#f2b318" } as CSSProperties}></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="how">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">ПРОЦЕС</span>
              <h2>Як це працює</h2>
              <p>
                Прозорий покроковий процес, що поєднує школу, батьків та заклад
                позакласної освіти в одному середовищі.
              </p>
            </div>

            <div className="steps-grid">
              {processSteps.map((item) => (
                <article key={item.number} className="step-card">
                  <div className="num">{item.number}</div>
                  <div className="icon-box">{item.icon}</div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section ai-section" id="ai">
          <div className="container ai-grid">
            <div className="ai-copy">
              <span className="eyebrow eyebrow-inverse">✨ AI-порівняння програм</span>
              <h2>Розумне зіставлення освітніх програм</h2>
              <p>
                AI порівнює програму гуртка з офіційною шкільною програмою та
                пояснює, які компетентності покриті, які теми відсутні, і чи
                можлива повна або часткова заміна предмета.
              </p>

              <div className="feature-stack">
                {aiFeatures.map((item) => (
                  <div key={item.title} className="feature-row">
                    <div className="feature-icon" style={{ background: item.color }}>
                      {item.icon}
                    </div>
                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="report-card">
              <div className="report-head">
                <h3>AI Comparison Report</h3>
                <div className="verified">✔ Verified</div>
              </div>

              <div className="score-box">
                <div>
                  <div>Overall Match</div>
                  <strong>92%</strong>
                </div>
                <div className="ring"></div>
              </div>

              <div className="bar-list report-bars">
                <div className="bar-row">
                  <span>
                    <b>Grammar &amp; Syntax</b>
                    <b className="text-green">98%</b>
                  </span>
                  <div className="bar">
                    <i style={{ "--w": "98%", "--c": "#22c55e" } as CSSProperties}></i>
                  </div>
                </div>
                <div className="bar-row">
                  <span>
                    <b>Speaking Skills</b>
                    <b className="text-green">95%</b>
                  </span>
                  <div className="bar">
                    <i style={{ "--w": "95%", "--c": "#22c55e" } as CSSProperties}></i>
                  </div>
                </div>
                <div className="bar-row">
                  <span>
                    <b>Reading Comprehension</b>
                    <b className="text-blue">88%</b>
                  </span>
                  <div className="bar">
                    <i style={{ "--w": "88%", "--c": "#2563ff" } as CSSProperties}></i>
                  </div>
                </div>
                <div className="bar-row">
                  <span>
                    <b>Writing</b>
                    <b className="text-yellow">85%</b>
                  </span>
                  <div className="bar">
                    <i style={{ "--w": "85%", "--c": "#f2b318" } as CSSProperties}></i>
                  </div>
                </div>
              </div>

              <div className="recommendation">
                <h4>Рекомендація</h4>
                <p>
                  <strong className="text-verified">Повна заміна схвалена.</strong>{" "}
                  Програма відповідає ключовим компетентностям шкільного курсу
                  англійської мови для 9 класу.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="users">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">ДЛЯ ВСІХ</span>
              <h2>Три типи користувачів, одна платформа</h2>
              <p>
                Окремі інструменти та інтерфейси спеціально для шкіл, батьків і
                закладів позакласної освіти.
              </p>
            </div>

            <div className="users-grid">
              {userCards.map((item) => (
                <article key={item.title} className="user-card">
                  <div className="icon-box">{item.icon}</div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <ul>
                    {item.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <a className="btn btn-primary" href="#dashboards">
                    Дізнатися більше
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="dashboards">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">ОГЛЯД ПЛАТФОРМИ</span>
              <h2>Потужні дашборди для кожної ролі</h2>
              <p>
                Інтуїтивні інтерфейси, створені спеціально для шкіл, батьків і
                закладів позакласної освіти.
              </p>
            </div>

            <div className="dashboard-tabs-wrap">
              <div className="dashboard-tabs">
                <button
                  className={`tab-btn ${activeDashboard === "school" ? "active" : ""}`}
                  type="button"
                  onClick={() => setActiveDashboard("school")}
                >
                  Шкільний дашборд
                </button>
                <button
                  className={`tab-btn ${activeDashboard === "parent" ? "active" : ""}`}
                  type="button"
                  onClick={() => setActiveDashboard("parent")}
                >
                  Батьківський дашборд
                </button>
                <button
                  className={`tab-btn ${activeDashboard === "club" ? "active" : ""}`}
                  type="button"
                  onClick={() => setActiveDashboard("club")}
                >
                  Дашборд гуртка
                </button>
              </div>
            </div>

            {(Object.keys(dashboardData) as DashboardTab[]).map((tab) => {
              const panel = dashboardData[tab];

              return (
                <div
                  key={tab}
                  className={`dashboard-panel ${
                    activeDashboard === tab ? "active" : ""
                  }`}
                  data-panel={tab}
                >
                  <div className="panel-top">
                    <h3>{panel.title}</h3>
                    <p>{panel.description}</p>
                  </div>
                  <div className="panel-body">
                    <div className="metrics">
                      {panel.metrics.map((metric) => (
                        <div
                          key={metric.label}
                          className="metric"
                          style={{ borderColor: metric.border }}
                        >
                          <div>{metric.label}</div>
                          <strong style={{ color: metric.color }}>{metric.value}</strong>
                        </div>
                      ))}
                    </div>
                    <div className="record-list">
                      {panel.rows.map((row) => (
                        <div key={row.title} className="list-row">
                          <div>
                            <h4>{row.title}</h4>
                            <p>{row.description}</p>
                          </div>
                          <span className={`badge ${row.badgeClass}`}>{row.badge}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="section" id="trust">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">ПРОЗОРІСТЬ І ДОВІРА</span>
              <h2>Побудовано на довірі та відповідальності</h2>
              <p>
                Кожен крок процесу прозорий, безпечний і створений для довіри між
                школами, батьками та освітніми провайдерами.
              </p>
            </div>

            <div className="trust-grid">
              {trustCards.map((item) => (
                <article key={item.title} className="trust-card">
                  <div className="icon-box">{item.icon}</div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="testimonials">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">ВІДГУКИ</span>
              <h2>Платформі довіряють школи, батьки й гуртки</h2>
              <p>
                Короткі історії від користувачів, для яких процес зарахування
                позакласної освіти став простішим і прозорішим.
              </p>
            </div>

            <div className="testimonials-grid">
              {testimonials.map((item) => (
                <article key={item.name} className="testimonial-card">
                  <div className="stars">★★★★★</div>
                  <p>{item.quote}</p>
                  <h4>{item.name}</h4>
                  <span>{item.role}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="cta" id="cta">
          <div className="container">
            <div className="cta-card">
              <h2>Побудуйте прозорий освітній маршрут для кожної дитини</h2>
              <p>
                Приєднуйтесь до платформи, яка поєднує школи, батьків та освітніх
                провайдерів і дозволяє офіційно зараховувати позакласні програми
                як частину шкільного навчання.
              </p>
              <div className="cta-actions">
                <button className="btn btn-secondary" type="button" onClick={showRegisterPage}>
                  Зареєструватися зараз →
                </button>
                <a className="btn btn-secondary" href="#footer">
                  Запросити демо
                </a>
              </div>
              <div className="cta-meta">
                <span>◉ Безкоштовний старт</span>
                <span>◉ Простий онбординг</span>
                <span>◉ Підтримка команди</span>
              </div>
            </div>
          </div>
        </section>

        <footer className="site-footer" id="footer">
          <div className="container">
            <div className="footer-grid">
              <div className="footer-brand">
                <button className="brand brand-button brand-light" type="button" onClick={showLandingPage}>
                  <span className="brand-mark">📘</span>
                  <span>EduSync</span>
                </button>
                <p>
                  Офіційне визнання позакласної освіти як частини шкільної
                  програми.
                </p>
              </div>

              {footerColumns.map((column) => (
                <div key={column.title} className="footer-col">
                  <h4>{column.title}</h4>
                  {column.links.map((link) => (
                    <a key={link.label} href={link.href}>
                      {link.label}
                    </a>
                  ))}
                </div>
              ))}
            </div>

            <div className="footer-bottom">
              <span>© 2026 EduSync. All rights reserved.</span>
              <div className="socials">
                <a aria-label="Twitter" href="#">
                  𝕏
                </a>
                <a aria-label="GitHub" href="#">
                  ⌘
                </a>
                <a aria-label="LinkedIn" href="#">
                  in
                </a>
              </div>
            </div>
          </div>
        </footer>
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
              className="brand brand-button"
              id="registerBrand"
              type="button"
              onClick={showLandingPage}
            >
              <span className="brand-mark">📘</span>
              <span>EduSync</span>
            </button>

            <Link className="btn btn-secondary register-login" href={`${appUrl}/auth/login`}>
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
              Вже маєте акаунт? <Link href={`${appUrl}/auth/login`}>Увійти</Link>
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

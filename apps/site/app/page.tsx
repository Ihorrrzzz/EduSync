"use client";

import {
  ArrowLeft,
  ArrowRight,
  Github,
  GraduationCap,
  Linkedin,
  Sparkles,
  Twitter,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";
import {
  aiFeatures,
  dashboardData,
  footerColumns,
  heroStats,
  navLinks,
  processSteps,
  registerRoles,
  testimonials,
  trustGroups,
  userCards,
  type DashboardTab,
} from "../lib/page-content";
import { getAppUrl } from "../lib/public-env";

type ActivePage = "landing" | "register";

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export default function SiteHomePage() {
  const [activePage, setActivePage] = useState<ActivePage>("landing");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDashboard, setActiveDashboard] = useState<DashboardTab>("school");
  const testimonialsRef = useRef<HTMLDivElement | null>(null);
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

  const scrollTestimonials = (direction: "prev" | "next") => {
    const testimonialsNode = testimonialsRef.current;

    if (!testimonialsNode) {
      return;
    }

    const offset = Math.max(testimonialsNode.clientWidth * 0.82, 320);

    testimonialsNode.scrollBy({
      left: direction === "next" ? offset : -offset,
      behavior: "smooth",
    });
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
              <span className="brand-mark">
                <GraduationCap strokeWidth={2.2} />
              </span>
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
                  Кабінет EduSync
                </div>

                <div className="dashboard-preview">
                  <div className="preview-header">
                    <div>
                      <span className="preview-kicker">Запит на зарахування №241</span>
                      <h3>Заміна предмета «Англійська мова» для 9-Б класу</h3>
                      <p>
                        Ліцей №127, мовний центр «Горизонт» та родина учня працюють у
                        спільному цифровому маршруті без дублювання документів.
                      </p>
                    </div>
                    <div className="preview-pill">
                      <i></i>
                      AI-порівняння завершено
                    </div>
                  </div>

                  <div className="preview-body">
                    <div className="preview-stack">
                      <div className="mini-card request-card">
                        <div className="mini-card-head">
                          <div>
                            <span className="mini-kicker">Картка запиту</span>
                            <h4>Заявка від батьків</h4>
                          </div>
                          <span className="mini-badge reviewing">На розгляді</span>
                        </div>
                        <div className="request-rows">
                          <div className="request-row">
                            <span>Учениця</span>
                            <strong>Анна Петрова</strong>
                          </div>
                          <div className="request-row">
                            <span>Провайдер</span>
                            <strong>Мовний центр «Горизонт»</strong>
                          </div>
                          <div className="request-row">
                            <span>Предмет</span>
                            <strong>Англійська мова</strong>
                          </div>
                        </div>
                        <ul className="check-list">
                          <li>AI-збіг програми: 92%</li>
                        </ul>
                      </div>
                    </div>

                    <div className="mini-card compare-card">
                      <div className="score-box">
                        <div>
                          <div>Загальний збіг</div>
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
              {processSteps.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.number}
                    className={`step-card ${item.highlight === "Ключова перевага" ? "key-step" : ""}`}
                  >
                    <div className="num">{item.number}</div>
                    <div className="step-label">{item.highlight}</div>
                    <div className="icon-box">
                      <Icon strokeWidth={2.1} />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section ai-section" id="ai">
          <div className="container ai-grid">
            <div className="ai-copy">
              <span className="eyebrow eyebrow-inverse">
                <Sparkles className="h-4 w-4" strokeWidth={2.2} />
                AI-порівняння програм
              </span>
              <h2>Розумне зіставлення освітніх програм</h2>
              <p>
                AI порівнює програму гуртка з офіційною шкільною програмою та
                пояснює, які компетентності покриті, які теми відсутні, і чи
                можлива повна або часткова заміна предмета.
              </p>

              <div className="feature-stack">
                {aiFeatures.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="feature-row">
                      <div className="feature-icon" style={{ background: item.color }}>
                        <Icon className="h-6 w-6" strokeWidth={2.2} />
                      </div>
                      <div>
                        <h4>{item.title}</h4>
                        <p>{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="report-card">
              <div className="report-head">
                <h3>AI-звіт зіставлення програми</h3>
                <div className="verified">Підтверджено</div>
              </div>

              <div className="score-box">
                <div>
                  <div>Загальний збіг</div>
                  <strong>92%</strong>
                </div>
                <div className="ring"></div>
              </div>

              <div className="bar-list report-bars">
                <div className="bar-row">
                  <span>
                    <b>Граматика та синтаксис</b>
                    <b className="text-green">98%</b>
                  </span>
                  <div className="bar">
                    <i style={{ "--w": "98%", "--c": "#22c55e" } as CSSProperties}></i>
                  </div>
                </div>
                <div className="bar-row">
                  <span>
                    <b>Усне мовлення</b>
                    <b className="text-green">95%</b>
                  </span>
                  <div className="bar">
                    <i style={{ "--w": "95%", "--c": "#22c55e" } as CSSProperties}></i>
                  </div>
                </div>
                <div className="bar-row">
                  <span>
                    <b>Читання та розуміння</b>
                    <b className="text-blue">88%</b>
                  </span>
                  <div className="bar">
                    <i style={{ "--w": "88%", "--c": "#2563ff" } as CSSProperties}></i>
                  </div>
                </div>
                <div className="bar-row">
                  <span>
                    <b>Письмо</b>
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

              <div className="explain-grid">
                <div className="explain-card">
                  <span>Чому рекомендовано</span>
                  <strong>Покрито основні мовні компетентності, регулярне оцінювання та практика.</strong>
                </div>
                <div className="explain-card warning">
                  <span>Що відсутнє</span>
                  <strong>Потрібна перевірка письмових робіт та відповідності шкільним критеріям оцінювання.</strong>
                </div>
                <div className="explain-card neutral">
                  <span>Формат заміни</span>
                  <strong>AI рекомендує повну заміну, якщо школа підтвердить модуль письма.</strong>
                </div>
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
              {userCards.map((item) => {
                const Icon = item.icon;

                return (
                  <article key={item.title} className={`user-card ${item.cardClass}`}>
                    <div className="role-badge">{item.badge}</div>
                    <div className="icon-box">
                      <Icon strokeWidth={2.1} />
                    </div>
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
                    <div className="role-note">{item.note}</div>
                  </article>
                );
              })}
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
                    <div className="panel-chips">
                      {panel.chips.map((chip) => (
                        <span key={chip} className="panel-chip">
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="panel-body">
                    <div className="metrics">
                      {panel.metrics.map((metric) => {
                        const Icon = metric.icon;

                        return (
                          <div
                            key={metric.label}
                            className="metric"
                            style={{ borderColor: metric.border }}
                          >
                            <div className="metric-label">
                              <span className="metric-icon" style={{ color: metric.color }}>
                                <Icon strokeWidth={2.1} />
                              </span>
                              <span>{metric.label}</span>
                            </div>
                            <strong style={{ color: metric.color }}>{metric.value}</strong>
                          </div>
                        );
                      })}
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

            <div className="trust-groups">
              {trustGroups.map((group) => (
                <div key={group.title} className="trust-group">
                  <div className="trust-group-head">
                    <h3>{group.title}</h3>
                    <p>{group.description}</p>
                  </div>

                  <div className="trust-grid trust-grid-group">
                    {group.cards.map((item) => {
                      const Icon = item.icon;

                      return (
                        <article key={item.title} className="trust-card">
                          <div className="icon-box">
                            <Icon strokeWidth={2.1} />
                          </div>
                          <h3>{item.title}</h3>
                          <p>{item.description}</p>
                        </article>
                      );
                    })}
                  </div>
                </div>
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

            <div className="testimonials-toolbar">
              <p>
                Гортайте картки відгуків, щоб переглянути історії різних типів
                користувачів і побачити, як платформа працює для шкіл, родин та
                освітніх провайдерів.
              </p>
              <div className="testimonials-actions">
                <button
                  aria-label="Прокрутити відгуки ліворуч"
                  className="testimonial-control"
                  type="button"
                  onClick={() => scrollTestimonials("prev")}
                >
                  <ArrowLeft strokeWidth={2.1} />
                </button>
                <button
                  aria-label="Прокрутити відгуки праворуч"
                  className="testimonial-control"
                  type="button"
                  onClick={() => scrollTestimonials("next")}
                >
                  <ArrowRight strokeWidth={2.1} />
                </button>
              </div>
            </div>

            <div
              ref={testimonialsRef}
              aria-label="Відгуки користувачів EduSync"
              className="testimonials-scroller"
            >
              {testimonials.map((item) => (
                <article key={item.name} className="testimonial-card testimonial-slide">
                  <div className="testimonial-top">
                    <div className="testimonial-avatar">{item.initials}</div>
                    <div className="testimonial-meta">
                      <strong>{item.organization}</strong>
                      <span>{item.role}</span>
                    </div>
                  </div>
                  <div className="stars">★★★★★</div>
                  <p>{item.quote}</p>
                  <h4>{item.name}</h4>
                  <span>{item.organization}</span>
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
                <button className="btn btn-cta-primary" type="button" onClick={showRegisterPage}>
                  Обрати роль та почати →
                </button>
                <a className="btn btn-cta-secondary" href="#footer">
                  Запросити демонстрацію
                </a>
              </div>
              <div className="cta-meta">
                <span>◉ Для шкіл, родин і гуртків</span>
                <span>◉ Прозорий цифровий процес</span>
                <span>◉ Підтримка впровадження</span>
              </div>
            </div>
          </div>
        </section>

        <footer className="site-footer" id="footer">
          <div className="container">
            <div className="footer-grid">
              <div className="footer-brand">
                <button className="brand brand-button brand-light" type="button" onClick={showLandingPage}>
                  <span className="brand-mark">
                    <GraduationCap strokeWidth={2.2} />
                  </span>
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
              <span>© 2026 EduSync. Некомерційний освітній продукт.</span>
              <div className="socials">
                <a aria-label="Twitter" href="#">
                  <Twitter strokeWidth={2.1} />
                </a>
                <a aria-label="GitHub" href="#">
                  <Github strokeWidth={2.1} />
                </a>
                <a aria-label="LinkedIn" href="#">
                  <Linkedin strokeWidth={2.1} />
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
              <span className="brand-mark">
                <GraduationCap strokeWidth={2.2} />
              </span>
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
            <div className="register-helper">
              Оберіть роль, яка найточніше відповідає вашим потребам, щоб побачити
              релевантний кабінет, сценарії роботи та потрібні інструменти.
            </div>
          </div>

          <div className="role-grid">
            {registerRoles.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.role} className="role-card">
                  <div className={`role-top ${item.tone}`}>
                    <span className="role-eyebrow">{item.eyebrow}</span>
                    <div className="role-icon">
                      <Icon strokeWidth={2.1} />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>

                  <div className="role-body">
                    <ul>
                      {item.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>

                    <div className="role-actions">
                      <Link
                        className={`btn-role ${item.tone}`}
                        href={`${appUrl}/auth/register?role=${item.role}`}
                      >
                        {item.actionLabel} →
                      </Link>
                      <Link
                        className="btn-role btn-role-ghost"
                        href={`${appUrl}/dashboard?guest=${item.role}`}
                      >
                        {item.guestLabel}
                      </Link>
                    </div>
                    <div className="role-note-small">{item.note}</div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="register-bottom">
            <p>
              Вже маєте акаунт? <Link href={`${appUrl}/auth/login`}>Увійти</Link>
            </p>
            <div className="register-meta">
              <span>Для учасників освітнього процесу</span>
              <span>Некомерційна ініціатива</span>
              <span>Зрозуміле підключення до платформи</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

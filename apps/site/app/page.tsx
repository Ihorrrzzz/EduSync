"use client";

import {
  Github,
  GraduationCap,
  Linkedin,
  Sparkles,
  Twitter,
} from "lucide-react";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import {
  aiFeatures,
  dashboardData,
  footerColumns,
  heroStats,
  navLinks,
  processSteps,
  registerRoles,
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
              <span className="eyebrow">Процес для шкільного розгляду позашкільного навчання</span>
              <h1>
                Платформа для
                <br />
                <span className="accent">запитів</span> на врахування позашкільного
                <br />
                навчання школою
              </h1>
              <p>
                Школи, батьки та гуртки працюють в одному процесі: готують
                структуровані докази, порівнюють програму за допомогою AI і
                фіксують фінальне рішення школи.
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
                  <div key={item.label} className={`stat stat-${item.tone}`}>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                    <small>{item.note}</small>
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
                      <span className="preview-kicker">Запит на врахування №241</span>
                      <h3>Розгляд програми «Англійська мова» для 9-Б класу</h3>
                      <p>
                        Ліцей №127, мовний центр «Горизонт» та родина учня
                        працюють з одним пакетом доказів і прозорим шкільним розглядом.
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
                          <li>AI-рекомендація: сильна</li>
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
                AI порівнює програму гуртка з обраним шкільним предметом і
                пояснює, які результати навчання покриті, які теми потребують
                ручної перевірки та який рекомендаційний рівень виглядає безпечним.
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
                <div className="verified">Лише рекомендація</div>
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
                  <strong className="text-verified">Сильний кандидат для розгляду.</strong>{" "}
                  Програма виглядає близькою до шкільного курсу англійської мови,
                  але фінальне рішення все одно приймає школа.
                </p>
              </div>

              <div className="explain-grid">
                <div className="explain-card">
                  <span>Чому рекомендовано</span>
                  <strong>Покрито основні мовні компетентності, регулярну практику та частину письма.</strong>
                </div>
                <div className="explain-card warning">
                  <span>Що відсутнє</span>
                  <strong>Потрібна перевірка письмових робіт та шкільних критеріїв оцінювання.</strong>
                </div>
                <div className="explain-card neutral">
                  <span>Безпечний висновок</span>
                  <strong>AI радить розглядати програму як сильного кандидата, а не автоматично її зараховувати.</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="users">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">ДЛЯ КОРИСТУВАЧІВ</span>
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
                    <div className="user-card-footer">
                      <div className="role-note">{item.note}</div>
                      <a className="btn btn-primary" href="#dashboards">
                        Дізнатися більше
                      </a>
                    </div>
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
              <h2>Огляд платформи</h2>
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

        <section className="cta" id="cta">
          <div className="container">
            <div className="cta-card">
              <h2>Запустіть прозорий процес для шкільного розгляду</h2>
              <p>
                Платформа поєднує школу, родину та гурток навколо одного запиту,
                пакета доказів і фінального рішення школи без фейкових обіцянок.
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
                <span>◉ AI тільки як дорадчий шар</span>
                <span>◉ Фінальне слово за школою</span>
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
                  Платформа підтримки рішень для шкільного розгляду доказів від
                  позашкільних програм.
                </p>
              </div>

              {footerColumns.map((column) => (
                <div key={column.title} className="footer-col">
                  <h4>{column.title}</h4>
                  {column.links.map((link) => (
                    <Link key={link.label} href={link.href}>
                      {link.label}
                    </Link>
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

                    <div className="role-footer">
                      <div className="role-note-small">{item.note}</div>
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
                    </div>
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

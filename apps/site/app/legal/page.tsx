import { ArrowLeft, ExternalLink, GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { legalResources } from "../../lib/page-content";

export const metadata: Metadata = {
  title: "Юридична база | EduSync",
  description: "Офіційні нормативні акти, на які спирається сторінка EduSync.",
};

export default function LegalPage() {
  return (
    <main className="legal-page">
      <div className="container legal-shell">
        <div className="legal-back">
          <Link className="btn btn-secondary" href="/">
            <ArrowLeft strokeWidth={2.1} />
            Повернутися на головну
          </Link>
        </div>

        <section className="legal-hero">
          <Link className="brand brand-button legal-brand" href="/">
            <span className="brand-mark">
              <GraduationCap strokeWidth={2.2} />
            </span>
            <span>EduSync</span>
          </Link>
          <span className="eyebrow">ЮРИДИЧНА БАЗА</span>
          <h1>Нормативні акти</h1>
          <p>
            Тут зібрані офіційні документи Верховної Ради України, на які можна
            посилатися як на чинну нормативну основу для організації цієї форми
            здобуття освіти.
          </p>
        </section>

        <section className="legal-grid" aria-label="Нормативні документи">
          {legalResources.map((item) => (
            <article key={item.href} className="legal-card">
              <span className="legal-kicker">Офіційний документ</span>
              <h2>{item.title}</h2>
              <div className="legal-meta">{item.meta}</div>
              <p>{item.description}</p>
              <a
                className="legal-link"
                href={item.href}
                rel="noreferrer"
                target="_blank"
              >
                Відкрити текст документа
                <ExternalLink strokeWidth={2.1} />
              </a>
            </article>
          ))}
        </section>

        <div className="legal-note">
          EduSync не замінює юридичну консультацію. Для офіційного тлумачення та
          практичного застосування норм слід користуватися повним текстом
          документів на zakon.rada.gov.ua та внутрішніми рішеннями закладу
          освіти.
        </div>
      </div>
    </main>
  );
}

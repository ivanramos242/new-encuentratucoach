"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { CoachCard } from "@/components/directory/coach-card";
import { MembershipCoachLandingEnhancer } from "@/components/marketing/membership-coach-landing-enhancer";
import { trackAcquisitionEvent } from "@/lib/acquisition-analytics";
import type { CoachProfile } from "@/types/domain";

type MembershipCoachLandingProps = {
  annualPrice: string;
  exampleCoach: CoachProfile | null;
  joinHref: string;
  joinLabel: string;
  monthlyPrice: string;
  plans: Array<{
    code: "monthly" | "annual";
    ctaHref: string;
    ctaLabel: string;
    discountLabel: string | null;
    intervalLabel: string;
    name: string;
    originalPrice: string | null;
    price: string;
  }>;
  proof: {
    certifiedCount: number;
    publishedCount: number;
    totalReviews: number;
    exampleClicks: number;
    exampleViews: number;
    searchExamples: string[];
  };
};

function CoachJoinLink({ href, label, source }: { href: string; label: string; source: string }) {
  return (
    <Link
      className="btn primary"
      href={href}
      onClick={() => {
        trackAcquisitionEvent("coach_join_click", { source, event_category: "coach_growth" });
        if (href.includes("checkout") || href.includes("plan=")) {
          trackAcquisitionEvent("coach_checkout_start", { source, event_category: "coach_growth" });
        }
      }}
    >
      <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
      {label}
    </Link>
  );
}

export function MembershipCoachLanding({
  annualPrice,
  exampleCoach,
  joinHref,
  joinLabel,
  monthlyPrice,
  plans,
  proof,
}: MembershipCoachLandingProps) {
  const previewStats = useMemo(
    () => [
      {
        icon: "fa-address-card",
        title: proof.publishedCount > 0 ? `${proof.publishedCount}+ perfiles` : "Perfiles profesionales listos para publicarse",
        text: "Fichas enfocadas en especialidad, precio, modalidad y contacto visible.",
      },
      {
        icon: "fa-shield-heart",
        title: proof.totalReviews > 0 ? `${proof.totalReviews}+ reseñas` : "Confianza visible desde el perfil",
        text:
          proof.totalReviews > 0
            ? "Contexto adicional para reforzar la decisión del cliente."
            : "Certificación, propuesta de valor y estructura para convertir mejor.",
      },
    ],
    [proof.publishedCount, proof.totalReviews],
  );

  const platformSignals = useMemo(
    () => [
      {
        icon: "fa-earth-europe",
        text: proof.publishedCount > 0 ? `${proof.publishedCount}+ perfiles activos.` : "Perfiles optimizados para ciudad, especialidad y modalidad.",
      },
      {
        icon: "fa-circle-check",
        text:
          proof.certifiedCount > 0
            ? `${proof.certifiedCount}+ coaches con verificación visible.`
            : "Señales de confianza visibles para reforzar autoridad.",
      },
      {
        icon: "fa-comments",
        text: proof.totalReviews > 0 ? `${proof.totalReviews}+ reseñas publicadas.` : "Estructura preparada para convertir visitas en conversaciones.",
      },
    ],
    [proof.certifiedCount, proof.publishedCount, proof.totalReviews],
  );

  const exampleSignals = useMemo(
    () => [
      {
        icon: "fa-eye",
        text:
          proof.exampleViews > 0
            ? `${proof.exampleViews} visitas aproximadas en el perfil de referencia.`
            : "Ejemplo de ficha orientada a captar visitas cualificadas.",
      },
      {
        icon: "fa-bullseye",
        text:
          proof.exampleClicks > 0
            ? `${proof.exampleClicks} clics acumulados en canales de contacto.`
            : "Canales de contacto visibles y listos para convertir.",
      },
      {
        icon: "fa-arrow-trend-up",
        text: "Con mejor ficha, sube la probabilidad de pasar de visita a conversación.",
      },
    ],
    [proof.exampleClicks, proof.exampleViews],
  );

  useEffect(() => {
    trackAcquisitionEvent("coach_membership_view", {
      event_category: "coach_growth",
    });

    const pricingSection = document.getElementById("etc-membresia");
    if (!pricingSection || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          trackAcquisitionEvent("coach_pricing_view", {
            event_category: "coach_growth",
          });
          observer.disconnect();
        });
      },
      { threshold: 0.35 },
    );

    observer.observe(pricingSection);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="etc-coach-landing" id="etcLanding">
      <MembershipCoachLandingEnhancer />
      <div className="wrap">
        <section className="hero" aria-label="Membresía para coaches">
          <div className="hero-grid">
            <div>
              <div className="kicker">
                <span>Membresía para coaches</span>
                <span style={{ opacity: 0.55 }}>-</span>
                <span>
                  <b>visibilidad</b>
                </span>
                <span style={{ opacity: 0.55 }}>-</span>
                <span>clientes y métricas</span>
              </div>

              <h1 className="hero-title">Haz visible tu perfil y capta clientes con una plataforma especializada</h1>
              <p className="hero-lead">
                EncuentraTuCoach está pensada para coaches que quieren aparecer en búsquedas con intención real, convertir mejor su perfil y tener un canal estable de captación sin depender solo de redes sociales.
              </p>

              <div className="hero-cta">
                <CoachJoinLink href={joinHref} label={joinLabel} source="membership_hero" />
                <a className="btn" href="#etc-membresia">
                  <i className="fa-solid fa-tags" aria-hidden="true" />
                  Ver precio
                </a>
                <a className="btn" href="#etc-pruebas">
                  <i className="fa-solid fa-chart-line" aria-hidden="true" />
                  Ver pruebas
                </a>
              </div>

              <div className="micro" aria-label="Beneficios clave">
                <div className="item">
                  <i className="fa-solid fa-percent" aria-hidden="true" />
                  <span>Sin comisión por cliente</span>
                </div>
                <div className="item">
                  <i className="fa-solid fa-id-badge" aria-hidden="true" />
                  <span>Perfil profesional visible</span>
                </div>
                <div className="item">
                  <i className="fa-solid fa-chart-column" aria-hidden="true" />
                  <span>Métricas para mejorar conversión</span>
                </div>
              </div>
            </div>

            <aside className="hero-card" aria-label="Vista previa">
              <div className="inner">
                <div className="preview">
                  <div className="top">
                    <span className="badge">
                      <i className="fa-solid fa-id-badge" aria-hidden="true" /> Perfil profesional
                    </span>
                    <span className="badge">
                      <i className="fa-solid fa-chart-column" aria-hidden="true" /> Métricas
                    </span>
                  </div>
                  <div className="body">
                    <div className="grid2">
                      {previewStats.map((item) => (
                        <div key={item.title} className="stat">
                          <div className="stat-title">
                            <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
                            <b>{item.title}</b>
                          </div>
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>
                    {exampleCoach ? <div className="mock-img membership-coach-card"><CoachCard coach={exampleCoach} density="airy" /></div> : null}
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <div className="toc section-card" id="etc-indice">
            <strong>
              <i className="fa-solid fa-compass-drafting" aria-hidden="true" /> Índice rápido
            </strong>
            <ul>
              <li>
                <a href="#etc-para-quien">
                  <i className="fa-solid fa-user-check" aria-hidden="true" /> Quién debería unirse
                </a>
              </li>
              <li>
                <a href="#etc-clientes">
                  <i className="fa-solid fa-users" aria-hidden="true" /> Qué tipo de cliente puede captar aquí
                </a>
              </li>
              <li>
                <a href="#etc-como-funciona">
                  <i className="fa-solid fa-list-check" aria-hidden="true" /> Cómo funciona
                </a>
              </li>
              <li>
                <a href="#etc-incluye">
                  <i className="fa-solid fa-box-open" aria-hidden="true" /> Qué incluye
                </a>
              </li>
              <li>
                <a href="#etc-pruebas">
                  <i className="fa-solid fa-chart-simple" aria-hidden="true" /> Pruebas y demanda
                </a>
              </li>
              <li>
                <a href="#etc-membresia">
                  <i className="fa-solid fa-euro-sign" aria-hidden="true" /> Precio
                </a>
              </li>
              <li>
                <a href="#etc-objeciones">
                  <i className="fa-solid fa-circle-question" aria-hidden="true" /> Objeciones
                </a>
              </li>
              <li>
                <a href="#etc-no-es">
                  <i className="fa-solid fa-ban" aria-hidden="true" /> Para quién no es
                </a>
              </li>
            </ul>
          </div>
        </section>

        <section id="etc-para-quien">
          <div className="section-head">
            <div>
              <h2 className="h2">Quién debería unirse</h2>
              <div className="sub">La membresía funciona mejor cuando ya tienes una propuesta clara y quieres más visibilidad cualificada.</div>
            </div>
          </div>
          <div className="grid cols-3">
            <div className="card">
              <div className="icon">
                <i className="fa-solid fa-bullseye" aria-hidden="true" />
              </div>
              <h3>Coach con nicho definido</h3>
              <p>Especialidad clara, objetivo del cliente bien explicado y oferta fácil de entender.</p>
            </div>
            <div className="card">
              <div className="icon">
                <i className="fa-solid fa-chart-line" aria-hidden="true" />
              </div>
              <h3>Coach que quiere demanda estable</h3>
              <p>Más allá de redes sociales, necesitas un activo que siga captando búsquedas y comparaciones.</p>
            </div>
            <div className="card">
              <div className="icon">
                <i className="fa-solid fa-screwdriver-wrench" aria-hidden="true" />
              </div>
              <h3>Coach que quiere optimizar su perfil</h3>
              <p>Con métricas, reseñas y señales de confianza para convertir mejor cada visita.</p>
            </div>
          </div>
        </section>

        <section id="etc-clientes">
          <div className="section-head">
            <div>
              <h2 className="h2">Qué tipo de cliente puedes captar aquí</h2>
              <div className="sub">Usuarios que ya están buscando coach por ciudad, modalidad o especialidad y quieren comparar antes de escribir.</div>
            </div>
          </div>
          <div className="section-card">
            <article>
              <ul className="icon-list">
                <li>
                  <i className="fa-solid fa-laptop" aria-hidden="true" /> Clientes que buscan coach online con flexibilidad y precio visible.
                </li>
                <li>
                  <i className="fa-solid fa-location-dot" aria-hidden="true" /> Clientes que prefieren coach presencial por ciudad y cercanía.
                </li>
                <li>
                  <i className="fa-solid fa-magnifying-glass-chart" aria-hidden="true" /> Clientes que comparan especialidad, reseñas y certificación antes de contactar.
                </li>
              </ul>
            </article>
          </div>
        </section>

        <section id="etc-como-funciona">
          <div className="section-head">
            <div>
              <h2 className="h2">Cómo funciona en 3 pasos</h2>
              <div className="sub">Simple, accionable y orientado a conversión.</div>
            </div>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-head">
                <i className="fa-solid fa-user-plus" aria-hidden="true" />
                <h3>Activa tu cuenta</h3>
              </div>
              <p>Crea tu cuenta de coach y elige tu plan.</p>
            </div>
            <div className="step">
              <div className="step-head">
                <i className="fa-solid fa-pen-ruler" aria-hidden="true" />
                <h3>Publica un perfil que convierta</h3>
              </div>
              <p>Especialidad, ciudad, precio, propuesta de valor y contacto visible.</p>
            </div>
            <div className="step">
              <div className="step-head">
                <i className="fa-solid fa-gauge-high" aria-hidden="true" />
                <h3>Mejora con datos reales</h3>
              </div>
              <p>Mide visitas, clics y señales de interés para optimizar tu ficha.</p>
            </div>
          </div>
        </section>

        <section id="etc-incluye">
          <div className="section-head">
            <div>
              <h2 className="h2">Qué incluye la membresía</h2>
              <div className="sub">Todo lo necesario para convertir visibilidad en oportunidades de contacto.</div>
            </div>
          </div>
          <div className="adv-grid">
            {[
              { icon: "fa-id-badge", title: "Perfil profesional activo en el directorio" },
              { icon: "fa-map-location-dot", title: "Presencia en landings por ciudad y especialidad" },
              { icon: "fa-star", title: "Reseñas visibles para aumentar confianza" },
              { icon: "fa-certificate", title: "Certificación para reforzar autoridad" },
              { icon: "fa-paper-plane", title: "Mensajería interna y contacto directo" },
              { icon: "fa-chart-column", title: "Métricas privadas para mejorar conversión" },
            ].map((item, index) => (
              <div className="adv-card" key={item.title}>
                <span className="num" aria-hidden="true">
                  {index + 1}
                </span>
                <div className="adv-title">
                  <div className="icon">
                    <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
                  </div>
                  <p>{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="etc-pruebas">
          <div className="section-head">
            <div>
              <h2 className="h2">Señales de plataforma y demanda</h2>
              <div className="sub">Visibilidad, confianza y ejemplos concretos de búsqueda, sin mostrar contadores vacíos.</div>
            </div>
          </div>
          <div className="grid grid2">
            <div className="section-card">
              <article>
                <h3>
                  <i className="fa-solid fa-shield-halved" aria-hidden="true" /> Señales de plataforma
                </h3>
                <ul className="icon-list">
                  {platformSignals.map((item) => (
                    <li key={item.text}>
                      <i className={`fa-solid ${item.icon}`} aria-hidden="true" /> {item.text}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
            <div className="section-card">
              <article>
                <h3>
                  <i className="fa-solid fa-address-card" aria-hidden="true" /> Ejemplo de perfil
                </h3>
                <ul className="icon-list">
                  {exampleSignals.map((item) => (
                    <li key={item.text}>
                      <i className={`fa-solid ${item.icon}`} aria-hidden="true" /> {item.text}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
          <div className="section-card" style={{ marginTop: 18 }}>
            <article>
              <h3>
                <i className="fa-solid fa-binoculars" aria-hidden="true" /> Búsquedas que generan intención
              </h3>
              <ul className="features">
                {proof.searchExamples.map((item) => (
                  <li key={item}>
                    <i className="fa-solid fa-check" aria-hidden="true" /> {item}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section id="etc-membresia">
          <div className="section-head">
            <div>
              <h2 className="h2">Precio claro para una propuesta clara</h2>
              <div className="sub">Sin comisión por cliente y con opción mensual o anual.</div>
            </div>
          </div>
          <div className="grid pricing">
            {plans.map((plan) => (
              <div className="pricebox" key={plan.code}>
                <div className="headline">
                  <span className="badge">
                    <i className="fa-solid fa-layer-group" aria-hidden="true" /> {plan.name}
                  </span>
                </div>
                <div className="price">
                  {plan.price} <span style={{ fontSize: "1.05rem", fontWeight: 950 }}>/ {plan.intervalLabel}</span>
                  {plan.originalPrice ? <small>Antes {plan.originalPrice}</small> : null}
                </div>
                {plan.discountLabel ? (
                  <div className="callout" style={{ marginTop: 6 }}>
                    <b>Descuento activo:</b> {plan.discountLabel}
                  </div>
                ) : null}
                <ul className="features">
                  <li>
                    <i className="fa-solid fa-circle-check" aria-hidden="true" /> Visibilidad en el directorio
                  </li>
                  <li>
                    <i className="fa-solid fa-circle-check" aria-hidden="true" /> Reseñas y confianza
                  </li>
                  <li>
                    <i className="fa-solid fa-circle-check" aria-hidden="true" /> Métricas privadas
                  </li>
                  <li>
                    <i className="fa-solid fa-circle-check" aria-hidden="true" /> Contacto directo
                  </li>
                </ul>
                <div className="price-actions">
                  <CoachJoinLink href={plan.ctaHref} label={plan.ctaLabel} source={`membership_plan_${plan.code}`} />
                  <Link className="btn" href="/coaches">
                    <i className="fa-solid fa-user-group" aria-hidden="true" />
                    Ver directorio
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="section-card" style={{ marginTop: 18 }}>
            <article>
              <div className="callout">
                <b>Referencia rápida:</b> {monthlyPrice}/mes o {annualPrice}/año.
              </div>
            </article>
          </div>
        </section>

        <section id="etc-objeciones">
          <div className="section-head">
            <div>
              <h2 className="h2">Objeciones frecuentes</h2>
              <div className="sub">Reducimos dudas antes de que bloqueen la decisión.</div>
            </div>
          </div>
          <div className="section-card faq">
            <details>
              <summary>
                <div className="q">
                  <span>
                    <i className="fa-solid fa-handshake-angle" aria-hidden="true" /> ¿Mis clientes siguen siendo míos?
                  </span>
                </div>
              </summary>
              <p>Sí. La plataforma te da visibilidad y contacto, pero tú gestionas la relación profesional.</p>
            </details>
            <details>
              <summary>
                <div className="q">
                  <span>
                    <i className="fa-solid fa-signature" aria-hidden="true" /> ¿Puedo seguir desarrollando mi marca propia?
                  </span>
                </div>
              </summary>
              <p>Sí. La membresía funciona como canal adicional de captación, no como sustituto de tu marca.</p>
            </details>
            <details>
              <summary>
                <div className="q">
                  <span>
                    <i className="fa-solid fa-money-bill-wave" aria-hidden="true" /> ¿Cobráis comisión por cliente?
                  </span>
                </div>
              </summary>
              <p>No. El modelo es de membresía fija, sin comisión por contacto.</p>
            </details>
          </div>
        </section>

        <section id="etc-no-es">
          <div className="section-head">
            <div>
              <h2 className="h2">Para quién no es esta membresía</h2>
              <div className="sub">Filtrar también mejora la calidad de los leads y la satisfacción.</div>
            </div>
          </div>
          <div className="section-card">
            <article>
              <ul className="icon-list">
                <li>
                  <i className="fa-solid fa-ban" aria-hidden="true" /> No encaja si todavía no puedes explicar con claridad qué haces, para quién y cómo trabajas.
                </li>
                <li>
                  <i className="fa-solid fa-hourglass-end" aria-hidden="true" /> No encaja si esperas clientes sin optimizar tu perfil ni responder con rapidez.
                </li>
                <li>
                  <i className="fa-solid fa-user-slash" aria-hidden="true" /> No encaja si buscas solo networking y no un canal de captación y conversión.
                </li>
              </ul>
            </article>
          </div>
        </section>

        <section id="etc-contacto">
          <div className="section-head">
            <div>
              <h2 className="h2">Siguiente paso</h2>
              <div className="sub">Si encajas con este perfil, crea tu cuenta y activa tu ficha.</div>
            </div>
          </div>
          <div className="section-card">
            <article>
              <CoachJoinLink href={joinHref} label={joinLabel} source="membership_final" />
            </article>
          </div>
        </section>
      </div>

      <div className="sticky-cta" id="etcSticky" aria-label="Acción rápida">
        <div className="bar">
          <div className="txt">
            <b>¿Listo para captar clientes como coach?</b>
            <span>Membresía: {monthlyPrice}/mes o {annualPrice}/año</span>
          </div>
          <CoachJoinLink href={joinHref} label={joinLabel} source="membership_sticky" />
        </div>
      </div>
    </div>
  );
}

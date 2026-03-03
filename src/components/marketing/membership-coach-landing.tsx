import Link from "next/link";
import { CoachCard } from "@/components/directory/coach-card";
import { MembershipCoachLandingEnhancer } from "@/components/marketing/membership-coach-landing-enhancer";
import type { CoachProfile } from "@/types/domain";

type MembershipCoachLandingProps = {
  annualPrice: string;
  exampleCoach: CoachProfile | null;
  joinHref: string;
  joinLabel: string;
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
  monthlyPrice: string;
};

export function MembershipCoachLanding({
  annualPrice,
  exampleCoach,
  joinHref,
  joinLabel,
  monthlyPrice,
  plans,
}: MembershipCoachLandingProps) {
  const planFeatures = {
    annual: [
      "Todo lo del plan mensual",
      "Ahorro anual frente al pago mes a mes",
      "Prioridad en mejoras y roadmap",
      "Preparado para nuevas funciones premium",
    ],
    monthly: [
      "Perfil profesional activo en el directorio",
      "SEO en directorio y landings por ciudad",
      "Reseñas y certificación para confianza",
      "Métricas para mejorar conversión",
    ],
  } as const;

  return (
    <div className="etc-coach-landing" id="etcLanding">
      <MembershipCoachLandingEnhancer />
      <div className="wrap">
        <section className="hero" aria-label="Introducción">
          <div className="hero-grid">
            <div>
              <div className="kicker">
                <span>Guía + estrategia</span>
                <span style={{ opacity: 0.55 }}>-</span>
                <span>
                  <b>SEO</b> para coaches
                </span>
                <span style={{ opacity: 0.55 }}>-</span>
                <span>Enfoque conversión</span>
              </div>

              <h1 className="hero-title">
                Plataformas para trabajar como coach: cómo elegir y captar clientes en una plataforma de coaching online
              </h1>

              <p className="hero-lead">
                Si eres coach y quieres crecer, una buena <strong>plataforma de coaching</strong> te da visibilidad,
                confianza con reseñas y contactos con intención real de compra. Esta guía de{" "}
                <strong>plataformas para trabajar como coach</strong> está orientada a conversión.
              </p>

              <div className="hero-cta">
                <a className="btn primary" href="#etc-membresia" aria-label="Ver beneficios y precio">
                  Ver beneficios y precio
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="m19 12-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </a>
                <a className="btn" href="#etc-ventajas" aria-label="Ver ventajas">
                  Ver 8 ventajas
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="m19 12-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </a>
                <Link className="btn" href="/coaches" aria-label="Ver directorio de coaches">
                  Ver directorio
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="m13 5 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </Link>
              </div>

              <div className="micro" aria-label="Beneficios clave">
                <div className="item">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M20 7 10 17l-5-5"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Sin comisión por cliente</span>
                </div>
                <div className="item">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 20a8 8 0 1 0-8-8 8 8 0 0 0 8 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>Más visibilidad y leads</span>
                </div>
                <div className="item">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>Mensajería interna</span>
                </div>
                <Link className="item" href="/coaches" aria-label="Ir al directorio de coaches">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>Ejemplos de perfiles</span>
                </Link>
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
                      <i className="fa-solid fa-chart-column" aria-hidden="true" /> Estadísticas
                    </span>
                  </div>

                  <div className="body">
                    <div className="grid2">
                      <div className="stat">
                        <b>+ Visibilidad</b>
                        <span>Directorio + SEO</span>
                      </div>
                      <div className="stat">
                        <b>+ Confianza</b>
                        <span>Reseñas verificables</span>
                      </div>
                    </div>

                    {exampleCoach ? (
                      <div className="mock-img membership-coach-card">
                        <CoachCard coach={exampleCoach} density="airy" />
                      </div>
                    ) : (
                      <div className="mock-img" style={{ padding: "12px" }}>
                        <p style={{ color: "rgba(11,18,32,.72)", fontWeight: 700 }}>
                          No se pudo cargar la tarjeta de Carla Gómez en este momento.
                        </p>
                        <Link className="btn" href="/coaches" style={{ marginTop: 10, width: "100%" }}>
                          Ver directorio de coaches
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <div className="toc section-card" id="etc-indice" aria-label="Índice">
            <strong>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: "var(--brand-1)", height: 18, width: 18 }}>
                <path d="M8 6h13M8 12h13M8 18h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
              Índice (SEO + lectura rápida)
            </strong>
            <ul>
              <li><a href="#etc-que-es">Qué es una plataforma para coaches</a></li>
              <li><a href="#etc-tipos">Tipos de plataformas (comparativa)</a></li>
              <li><a href="#etc-ventajas">Ventajas de EncuentraTuCoach (8)</a></li>
              <li><a href="#etc-como-funciona">Cómo funciona en 3 pasos</a></li>
              <li><a href="#etc-membresia">Precio y qué incluye</a></li>
              <li><a href="#etc-guia">Guía + checklist SEO/ventas</a></li>
              <li><a href="#etc-faq">FAQs</a></li>
              <li><a href="#etc-contacto">Contacto</a></li>
            </ul>
          </div>
        </section>

        <section id="etc-que-es" aria-label="Qué es una plataforma para coaches">
          <div className="section-head">
            <div>
              <h2 className="h2">Qué es una plataforma para trabajar como coach</h2>
              <div className="sub">
                Las <strong>plataformas para trabajar como coach</strong> más rentables suelen combinar{" "}
                <strong>tráfico SEO</strong>, <strong>confianza con reseñas</strong> y <strong>contacto directo</strong>.
                Si buscas ventas, prioriza una <strong>plataforma especializada</strong>.
              </div>
            </div>
          </div>

          <div className="grid cols-3">
            <div className="card">
              <div className="icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M8 10h8M8 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3>Directorio / marketplace</h3>
              <p>Te encuentran buscando coach por ciudad o especialidad. Es el canal más cercano a la compra.</p>
            </div>

            <div className="card">
              <div className="icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M7 3v4M17 3v4M4 9h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M6 5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <h3>Herramientas de gestión</h3>
              <p>Agenda y pagos mejoran eficiencia, pero sin tráfico no escalan ventas.</p>
            </div>

            <div className="card">
              <div className="icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M18 8h4M20 6v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3>Comunidad / networking</h3>
              <p>Funciona mejor cuando ya tienes posicionamiento y perfil optimizado.</p>
            </div>
          </div>
        </section>

        <section id="etc-tipos" aria-label="Tipos de plataformas para coaches">
          <div className="section-head">
            <div>
              <h2 className="h2">Tipos de plataformas para coaches (comparativa rápida)</h2>
              <div className="sub">Elige según tu objetivo principal: captación o gestión.</div>
            </div>
          </div>
          <div className="section-card compare">
            <div className="compare-grid">
              <div className="compare-card recommend">
                <div className="compare-head">
                  <div className="chip"><b>Recomendado</b> para ventas</div>
                  <div className="chip">Captación: <b>Alta</b></div>
                </div>
                <div className="compare-body">
                  <h3 style={{ fontWeight: 950, margin: 0 }}>Directorio especializado (EncuentraTuCoach)</h3>
                  <div className="mini">Ideal para trabajar como coach online con SEO, reseñas y contacto directo.</div>
                  <ul className="compare-list">
                    <li><strong>Pros:</strong> tráfico SEO, prueba social y contacto directo.</li>
                    <li><strong>Mejor para:</strong> coach online y coach por ciudad/especialidad.</li>
                    <li><strong>Clave:</strong> perfil con propuesta de valor + CTA + reseñas.</li>
                  </ul>
                </div>
                <div className="compare-cta">
                  <div className="hint">Acción rápida: mira el directorio y replica los mejores perfiles.</div>
                  <Link className="btn primary" href="/coaches">Ver directorio de coaches</Link>
                </div>
              </div>

              <div className="compare-card">
                <div className="compare-head">
                  <div className="chip">Eficiencia: <b>Alta</b></div>
                  <div className="chip">Captación: <b>Baja</b></div>
                </div>
                <div className="compare-body">
                  <h3 style={{ fontWeight: 950, margin: 0 }}>Suite de herramientas (agenda / pagos)</h3>
                  <div className="mini">Perfecta si ya tienes tráfico y quieres operar mejor.</div>
                  <ul className="compare-list">
                    <li><strong>Pros:</strong> menos no-shows y procesos.</li>
                    <li><strong>Contras:</strong> no suele traer clientes por sí misma.</li>
                    <li><strong>Clave:</strong> combinar con una plataforma especializada.</li>
                  </ul>
                </div>
                <div className="compare-cta">
                  <div className="hint">Si tu foco es vender, empieza por captación.</div>
                  <a className="btn" href="#etc-membresia">Ver membresía</a>
                </div>
              </div>

              <div className="compare-card">
                <div className="compare-head">
                  <div className="chip">Volumen: <b>Medio</b></div>
                  <div className="chip">Marca: <b>Limitada</b></div>
                </div>
                <div className="compare-body">
                  <h3 style={{ fontWeight: 950, margin: 0 }}>Plataforma corporativa</h3>
                  <div className="mini">Útil para acceso a empresas, pero con menos control de branding.</div>
                  <ul className="compare-list">
                    <li><strong>Pros:</strong> estabilidad si hay flujo constante.</li>
                    <li><strong>Contras:</strong> menos control de oferta.</li>
                    <li><strong>Clave:</strong> canal extra, no único.</li>
                  </ul>
                </div>
                <div className="compare-cta">
                  <div className="hint">Complementario si ya tienes posicionamiento.</div>
                  <a className="btn" href="#etc-guia">Ver checklist</a>
                </div>
              </div>

              <div className="compare-card">
                <div className="compare-head">
                  <div className="chip">Autoridad: <b>Alta</b></div>
                  <div className="chip">Cierre: <b>Medio</b></div>
                </div>
                <div className="compare-body">
                  <h3 style={{ fontWeight: 950, margin: 0 }}>Comunidad / formacion</h3>
                  <div className="mini">Buena para networking y aprendizaje, pero la venta depende de tu marca.</div>
                  <ul className="compare-list">
                    <li><strong>Pros:</strong> soporte, método y colaboraciones.</li>
                    <li><strong>Contras:</strong> no asegura demanda.</li>
                    <li><strong>Clave:</strong> combinar con SEO transaccional.</li>
                  </ul>
                </div>
                <div className="compare-cta">
                  <div className="hint">Si quieres cierre, reduce fricción en tu perfil.</div>
                  <a className="btn" href="#etc-ventajas">Ver ventajas</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="etc-ventajas" aria-label="Ventajas de EncuentraTuCoach">
          <div className="section-head">
            <div>
              <h2 className="h2">Ventajas de unirte a EncuentraTuCoach (8 razones)</h2>
              <div className="sub">
                En plataformas para trabajar como coach, lo que convierte es <strong>visibilidad</strong> +{" "}
                <strong>confianza</strong> + <strong>contacto directo</strong>.
              </div>
            </div>
            <a className="btn primary" href="#etc-membresia" aria-label="Ver membresía">Ver precio</a>
          </div>

          <div className="adv-grid" aria-label="Lista de 8 ventajas">
            {[
              ["Portal de coaches", "Perfil con propuesta clara, especialidad, ubicación, precio y CTA."],
              ["Promociones y anuncios", "Impulso de visibilidad para captar demanda y no depender solo de redes."],
              ["Valoraciones", "Prueba social visible para aumentar conversiones en coach online."],
              ["Comunicación directa", "Mensajería para responder rápido y cerrar antes."],
              ["Estadísticas de perfil", "Datos para mejorar CTR y conversión por nicho."],
              ["Networking profesional", "Colaboraciones y referidos para conseguir clientes como coach."],
              ["Sin comisiones", "Tu margen no se reduce por cliente."],
              ["Descuentos por miembro", "Beneficios en servicios habituales para coaches."],
            ].map(([title, text], index) => (
              <div className="adv-card" key={title}>
                <span className="num" aria-hidden="true">{index + 1}</span>
                <div className="adv-title">
                  <div className="icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M4 5h16v14H4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M8 9h8M8 13h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h3>{title}</h3>
                </div>
                <p>{text}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }} className="section-card">
            <article>
              <div className="callout">
                <b>Conversión:</b> el camino más corto es <b>ver ventajas - ver precio - unirse</b>. Por eso repetimos
                CTA y reducimos fricción.
              </div>
              <a className="btn primary" href="#etc-membresia" style={{ justifyContent: "center", width: "100%" }}>
                Quiero unirme y crear mi perfil
              </a>
            </article>
          </div>
        </section>

        <section id="etc-como-funciona" aria-label="Cómo funciona">
          <div className="section-head">
            <div>
              <h2 className="h2">Cómo funciona en 3 pasos</h2>
              <div className="sub">Simple y orientado a resultados: perfil listo, contacto y seguimiento.</div>
            </div>
          </div>

          <div className="steps">
            <div className="step">
              <h3>Únete como profesional</h3>
              <p>Activa tu cuenta de coach.</p>
            </div>
            <div className="step">
              <h3>Optimiza tu perfil</h3>
              <p>Especialidad clara, propuesta en 1 frase y CTA.</p>
            </div>
            <div className="step">
              <h3>Recibe solicitudes</h3>
              <p>Mensajería + reseñas + estadísticas para mejorar conversión mes a mes.</p>
            </div>
          </div>
        </section>

        <section id="etc-membresia" aria-label="Membresía">
          <div className="section-head">
            <div>
              <h2 className="h2">Membresía para coaches</h2>
              <div className="sub">
                Precio claro y beneficios claros. Ideal para trabajar como coach online en plataforma especializada.
              </div>
            </div>
          </div>

          <div className="grid grid2">
            {plans.map((plan) => (
              <div className="pricebox" aria-label={`Precio ${plan.name}`} key={plan.code}>
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
                  {planFeatures[plan.code].map((feature) => (
                    <li key={`${plan.code}-${feature}`}>
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M20 7 10 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="price-actions">
                  <Link className="btn primary" href={plan.ctaHref} style={{ flex: 1 }} aria-label={plan.ctaLabel}>
                    {plan.ctaLabel}
                  </Link>
                  <Link className="btn" href="/coaches" style={{ flex: 1 }} aria-label="Ver directorio de coaches">
                    Ver directorio
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="section-card" aria-label="Resumen" style={{ marginTop: 18 }}>
            <article>
              <h3>Para quién es esta membresía</h3>
              <p>
                Para coaches que quieren un canal estable de captación. Si comparas{" "}
                <strong>plataformas para trabajar como coach</strong>, prioriza SEO, reseñas y contacto directo.
              </p>

              <div className="callout">
                <b>Acción recomendada:</b> abre el{" "}
                <Link href="/coaches" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
                  directorio de coaches
                </Link>{" "}
                e identifica los perfiles más completos.
              </div>

              <h3>Qué optimiza más tu conversión</h3>
              <ul>
                <li>Headline: Coach de nicho para tipo de cliente.</li>
                <li>3 bullets: problema - método - resultado.</li>
                <li>Oferta simple: sesión + pack.</li>
                <li>Reseñas visibles y actuales.</li>
              </ul>

              <Link className="btn primary" href={joinHref} style={{ justifyContent: "center", width: "100%" }}>
                {joinLabel}
              </Link>

              <div className="fine">
                Tip SEO: en tu perfil usa frases como <strong>coach de [especialidad] en [ciudad]</strong>,{" "}
                <strong>coach online para [objetivo]</strong> y <strong>coaching para [tipo de cliente]</strong>.
              </div>
            </article>
          </div>
        </section>

        <section id="etc-guia" aria-label="Guía completa">
          <div className="section-head">
            <div>
              <h2 className="h2">Guía: cómo elegir plataformas para trabajar como coach (SEO + ventas)</h2>
              <div className="sub">
                Bloque optimizado para captar coaches con palabras clave comerciales sin perder intención transaccional.
              </div>
            </div>
          </div>
          <div className="section-card">
            <article>
              <h3>1) Elige según tu objetivo: clientes o eficiencia</h3>
              <p>
                Si tu prioridad es vender, necesitas una plataforma de coaching con SEO y demanda con intención. Si
                eliges solo herramientas, mejoras gestión pero no captación.
              </p>
              <h3>2) Señales de una plataforma que convierte</h3>
              <ul>
                <li><strong>SEO:</strong> páginas por especialidad y ciudad.</li>
                <li><strong>Prueba social:</strong> reseñas visibles.</li>
                <li><strong>Contacto directo:</strong> menos pasos, más cierres.</li>
                <li><strong>Perfil con estructura:</strong> propuesta + CTA + oferta.</li>
                <li><strong>Medición:</strong> estadísticas para iterar.</li>
              </ul>
              <div className="callout">
                <b>Regla:</b> si no entienden en 5 segundos qué haces y cómo contactarte, pierdes conversión.
              </div>
              <h3>3) Frases clave para posicionar mejor tu perfil</h3>
              <ul>
                <li>coach de [especialidad] en [ciudad]</li>
                <li>coach online para [objetivo concreto]</li>
                <li>coaching para [tipo de cliente]</li>
                <li>sesiones de coaching [online o presencial] en [ciudad]</li>
                <li>acompañamiento en [problema] para [resultado]</li>
                <li>coach profesional de [nicho] con [metodología]</li>
              </ul>
              <a className="btn primary" href="#etc-membresia" style={{ justifyContent: "center", width: "100%" }}>
                Ver precio y unirme ahora
              </a>
            </article>
          </div>
        </section>

        <section id="etc-faq" aria-label="Preguntas frecuentes">
          <div className="section-head">
            <div>
              <h2 className="h2">FAQs</h2>
              <div className="sub">Respuestas para eliminar objeciones y aumentar conversión.</div>
            </div>
          </div>
          <div className="section-card faq">
            <details>
              <summary>
                <div className="q">
                  <span>¿Si trabajo con EncuentraTuCoach, mis clientes siguen siendo míos?</span>
                  <svg className="chev" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </summary>
              <p>Sí. La plataforma te da visibilidad y herramientas, pero tú gestionas tu relación profesional.</p>
            </details>

            <details>
              <summary>
                <div className="q">
                  <span>¿Puedo seguir desarrollando mi marca propia?</span>
                  <svg className="chev" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </summary>
              <p>Sí. Puedes usar el directorio como canal adicional mientras construyes tu marca.</p>
            </details>

            <details>
              <summary>
                <div className="q">
                  <span>¿Cobráis comisión por los clientes?</span>
                  <svg className="chev" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </summary>
              <p>No. Tú defines tus honorarios y el cliente te contacta directamente.</p>
            </details>

            <details>
              <summary>
                <div className="q">
                  <span>¿Qué hago si no tengo reseñas todavía?</span>
                  <svg className="chev" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </summary>
              <p>Empieza con 3 a 5 testimonios reales y pide reseña al finalizar cada proceso.</p>
            </details>
          </div>
        </section>

        <section id="etc-contacto" aria-label="Contacto">
          <div className="section-head">
            <div>
              <h2 className="h2">Contacto y acciones rápidas</h2>
              <div className="sub">
                Si ya decidiste trabajar como coach en una plataforma especializada, este es el siguiente paso.
              </div>
            </div>
          </div>
          <div className="section-card contact-grid">
            <div className="contact-card">
              <h3>Crear cuenta coach</h3>
              <p>Activa tu cuenta y publica tu perfil.</p>
              <Link className="btn primary" href={joinHref}>{joinLabel}</Link>
            </div>
            <div className="contact-card">
              <h3>Ver perfiles que convierten</h3>
              <p>Analiza la estructura de perfiles para replicar la oferta.</p>
              <Link className="btn" href="/coaches">Ir al directorio</Link>
            </div>
            <div className="contact-card">
              <h3>Hablar con el equipo</h3>
              <p>Resuelve dudas de membresía, onboarding y posicionamiento.</p>
              <Link className="btn" href="/contacto">Contactar</Link>
            </div>
          </div>
        </section>
      </div>

      <div className="sticky-cta" id="etcSticky" aria-label="Acción rápida">
        <div className="bar">
          <div className="txt">
            <b>¿Listo para captar clientes como coach?</b>
            <span>
              Membresía: {monthlyPrice}/mes o {annualPrice}/año (sin comisión por cliente)
            </span>
          </div>
          <Link className="btn primary" href={joinHref} aria-label={joinLabel}>
            {joinLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

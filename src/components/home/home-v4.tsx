"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LatestCoachesSlider } from "@/components/home/latest-coaches-slider";
import type { CoachProfile } from "@/types/domain";

type Suggestion = {
  href: string;
  label: string;
  meta: string;
};

type HomeV4Props = {
  coaches: CoachProfile[];
};

const CITY_SUGGESTIONS: Suggestion[] = [
  { href: "/coaches/ciudad/madrid", label: "Coach Madrid", meta: "Ciudad" },
  { href: "/coaches/ciudad/barcelona", label: "Busco coach Barcelona", meta: "Ciudad" },
  { href: "/coaches/ciudad/valencia", label: "Coach en Valencia", meta: "Ciudad" },
  { href: "/coaches/ciudad/sevilla", label: "Coach en Sevilla", meta: "Ciudad" },
  { href: "/coaches/ciudad/bilbao", label: "Coach en Bilbao", meta: "Ciudad" },
  { href: "/coaches/ciudad/malaga", label: "Coach en Malaga", meta: "Ciudad" },
];

const SPECIALTY_SUGGESTIONS: Suggestion[] = [
  { href: "/coaches/categoria/personal", label: "Coaching personal", meta: "Especialidad" },
  { href: "/coaches/categoria/carrera", label: "Coaching de carrera", meta: "Especialidad" },
  { href: "/coaches/categoria/liderazgo", label: "Coach directivo Madrid", meta: "Especialidad" },
  { href: "/coaches/categoria/bioemocional", label: "Coaching bioemocional", meta: "Especialidad" },
  { href: "/coaches/categoria/pareja", label: "Coaching de pareja", meta: "Especialidad" },
  { href: "/coaches/modalidad/online", label: "Coach online", meta: "Modalidad" },
  { href: "/coaches/certificados", label: "Coach profesional Madrid", meta: "Verificado" },
  { href: "/coaches/ciudad/madrid", label: "Coach madrid precio", meta: "Comparativa" },
  { href: "/coaches/ciudad/madrid", label: "Servicios de coaching madrid", meta: "Servicio" },
  { href: "/coaches/ciudad/madrid", label: "Coaching madrid", meta: "Servicio" },
  { href: "/coaches", label: "Buscar coach", meta: "Directorio" },
  { href: "/coaches", label: "Encontrar coach", meta: "Directorio" },
  { href: "/coaches", label: "Busco coach", meta: "Directorio" },
  { href: "/coaches", label: "Alvaro maximo psicologo", meta: "Busqueda" },
];

const REVIEWS = [
  [
    {
      text: "Estaba buscando un coach que entendiera mi momento profesional y en dos dias ya tenia una primera sesion definida.",
      name: "Carlos Martinez",
      tag: "Emprendimiento",
      avatar: "https://encuentratucoach.es/wp-content/uploads/2024/05/portrait-square-05.jpg",
    },
    {
      text: "Probe coaching online por primera vez y fue muy practico. En pocas sesiones consegui claridad y foco.",
      name: "Laura Serrano",
      tag: "Coaching personal",
      avatar: "https://encuentratucoach.es/wp-content/uploads/2024/05/portrait-square-07.jpg",
    },
  ],
  [
    {
      text: "Buscaba un coach directivo en Madrid. Compare perfiles, enfoque y precio, y elegi rapido.",
      name: "David Gomez",
      tag: "Liderazgo",
      avatar: "https://encuentratucoach.es/wp-content/uploads/2024/05/pexels-chloekalaartist-1043474-e1715543775565.jpg",
    },
    {
      text: "Me ayudo mucho poder filtrar por precio y por modalidad. En menos de una semana ya estaba trabajando objetivos concretos.",
      name: "Marta Rios",
      tag: "Habitos",
      avatar: "https://encuentratucoach.es/wp-content/uploads/2024/05/portrait-square-11.jpg",
    },
  ],
  [
    {
      text: "Estaba bloqueado con una decision de carrera y con coaching profesional consegui un plan accionable.",
      name: "Javier Molina",
      tag: "Carrera",
      avatar: "https://encuentratucoach.es/wp-content/uploads/2024/05/pexels-linkedin-2182970-e1715522386290.jpg",
    },
    {
      text: "El sello de coach certificado y las resenas me dieron mucha confianza para elegir mejor coach en Madrid.",
      name: "Nuria Pardo",
      tag: "Autoestima",
      avatar: "https://encuentratucoach.es/wp-content/uploads/2024/05/pexels-danxavier-1239291-1-e1715543579493.jpg",
    },
  ],
] as const;

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function HomeV4({ coaches }: HomeV4Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [openSuggestions, setOpenSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [activeReviewSlide, setActiveReviewSlide] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: "is-success" | "is-error" } | null>(null);

  const suggestions = useMemo(() => {
    const q = normalize(query);
    const all = [...CITY_SUGGESTIONS, ...SPECIALTY_SUGGESTIONS];
    const directSearch: Suggestion = {
      href: query.trim() ? `/coaches?q=${encodeURIComponent(query.trim())}` : "/coaches",
      label: query.trim() ? `Buscar "${query.trim()}"` : "Buscar en el directorio",
      meta: "Directo",
    };

    const filtered = !q
      ? all
      : all.filter((item) => {
          const text = normalize(item.label);
          return text.includes(q);
        });

    return [directSearch, ...filtered].slice(0, 10);
  }, [query]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveReviewSlide((current) => (current + 1) % REVIEWS.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const prefersReducedMotion = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const root = document.getElementById("etcHomeV4");
    if (!root) return;

    root.classList.add("is-ready");
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      root.querySelectorAll(".etc-reveal").forEach((el) => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    root.querySelectorAll(".etc-reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const hasPopup = url.searchParams.has("etc_popup");
    const hasMail = url.searchParams.has("etc_mail");
    const hasErr = url.searchParams.has("etc_err");

    if (!hasPopup && !hasMail && !hasErr) return;

    window.setTimeout(() => {
      if (hasErr || hasMail) {
        setToast({ type: "is-error", message: "No se pudo enviar el mensaje. Intentalo de nuevo." });
      } else {
        setToast({ type: "is-success", message: "Mensaje enviado correctamente." });
      }
    }, 0);

    url.searchParams.delete("etc_popup");
    url.searchParams.delete("etc_mail");
    url.searchParams.delete("etc_err");
    const clean = `${url.pathname}${url.search ? `?${url.searchParams.toString()}` : ""}${url.hash}`;
    window.history.replaceState({}, "", clean);

    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, []);

  function goToSuggestion(index: number) {
    const target = suggestions[index];
    if (!target) return;
    setOpenSuggestions(false);
    router.push(target.href);
  }

  function submitSearch() {
    const target = query.trim() ? `/coaches?q=${encodeURIComponent(query.trim())}` : "/coaches";
    router.push(target);
  }

  return (
    <div className="etc-home-v4" id="etcHomeV4">
      <div className="wrap">
        <section className="hero" aria-label="Buscar coach">
          <div className="hero-inner">
            <div className="hero-grid">
              <div>
                <div className="kicker">
                  <span>Directorio de</span>
                  <span style={{ opacity: 0.55 }}>-</span>
                  <span>
                    <b>coaches en Espana</b>
                  </span>
                  <span style={{ opacity: 0.55 }}>-</span>
                  <span>online o presencial</span>
                </div>

                <h1 className="h1">Buscar un coach nunca ha sido tan facil</h1>

                <p className="lead">
                  Compara perfiles por especialidad, ciudad, modalidad y presupuesto. Contacta directamente con el
                  profesional y empieza con un plan claro. Si ves el distintivo de <strong>coach certificado</strong>,
                  revisamos documentacion real.
                </p>

                <div className="searchwrap" aria-label="Busqueda principal">
                  <form
                    className="searchbar"
                    onSubmit={(event) => {
                      event.preventDefault();
                      submitSearch();
                    }}
                  >
                    <div className="inputwrap" role="search" aria-label="Buscar coach por ciudad o especialidad">
                      <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                      <input
                        value={query}
                        onChange={(event) => {
                          setQuery(event.target.value);
                          setActiveSuggestion(-1);
                        }}
                        onFocus={() => setOpenSuggestions(true)}
                        onBlur={() => window.setTimeout(() => setOpenSuggestions(false), 120)}
                        onKeyDown={(event) => {
                          if (!openSuggestions) return;

                          if (event.key === "ArrowDown") {
                            event.preventDefault();
                            setActiveSuggestion((prev) => Math.min(suggestions.length - 1, prev + 1));
                          } else if (event.key === "ArrowUp") {
                            event.preventDefault();
                            setActiveSuggestion((prev) => Math.max(0, prev - 1));
                          } else if (event.key === "Enter" && activeSuggestion >= 0) {
                            event.preventDefault();
                            goToSuggestion(activeSuggestion);
                          } else if (event.key === "Escape") {
                            setOpenSuggestions(false);
                          }
                        }}
                        placeholder="Ej: coach madrid, coach online, coach profesional madrid..."
                        inputMode="search"
                        aria-autocomplete="list"
                      />
                    </div>
                    <button className="btn primary" type="submit" aria-label="Buscar en el directorio">
                      Buscar
                    </button>
                  </form>

                  <div className={`sugg ${openSuggestions ? "is-open" : ""}`} aria-label="Sugerencias" role="listbox">
                    {suggestions.map((item, index) => (
                      <button
                        key={`${item.label}-${item.href}`}
                        className={`row ${index === activeSuggestion ? "is-active" : ""}`}
                        type="button"
                        onMouseDown={() => goToSuggestion(index)}
                      >
                        <i className="fa-solid fa-location-dot" aria-hidden="true" />
                        <span className="label">{item.label}</span>
                        <span className="meta">{item.meta}</span>
                      </button>
                    ))}
                  </div>

                  <div className="chips" aria-label="Accesos rapidos">
                    <button className="chip" type="button" onClick={() => router.push("/coaches/certificados")}>
                      <i className="fa-solid fa-check-double" aria-hidden="true" /> Certificados
                    </button>
                    <button className="chip" type="button" onClick={() => router.push("/coaches/modalidad/online")}>
                      <i className="fa-solid fa-video" aria-hidden="true" /> Online
                    </button>
                    <button className="chip" type="button" onClick={() => router.push("/coaches")}>
                      <i className="fa-solid fa-location-dot" aria-hidden="true" /> Presencial
                    </button>
                    <button className="chip" type="button" onClick={() => router.push("/coaches/categoria/personal")}>
                      <i className="fa-solid fa-compass" aria-hidden="true" /> Coaching personal
                    </button>
                    <button className="chip" type="button" onClick={() => router.push("/coaches/categoria/carrera")}>
                      <i className="fa-solid fa-briefcase" aria-hidden="true" /> Carrera
                    </button>
                    <button className="chip" type="button" onClick={() => router.push("/coaches/categoria/liderazgo")}>
                      <i className="fa-solid fa-people-group" aria-hidden="true" /> Liderazgo
                    </button>
                  </div>

                  <div className="popular-grid" aria-label="Busquedas populares">
                    <div className="popular-card">
                      <h3>Busquedas por ciudad</h3>
                      <div className="popular-links">
                        {CITY_SUGGESTIONS.slice(0, 4).map((city) => (
                          <Link key={city.label} className="plink" href={city.href}>
                            <i className="fa-solid fa-arrow-right" aria-hidden="true" /> {city.label.replace("Coach ", "")}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="popular-card">
                      <h3>Especialidades populares</h3>
                      <div className="popular-links">
                        <Link className="plink" href="/coaches/categoria/personal">
                          <i className="fa-solid fa-arrow-right" aria-hidden="true" /> Coaching personal
                        </Link>
                        <Link className="plink" href="/coaches/categoria/carrera">
                          <i className="fa-solid fa-arrow-right" aria-hidden="true" /> Carrera
                        </Link>
                        <Link className="plink" href="/coaches/categoria/liderazgo">
                          <i className="fa-solid fa-arrow-right" aria-hidden="true" /> Liderazgo
                        </Link>
                        <Link className="plink" href="/coaches/modalidad/online">
                          <i className="fa-solid fa-arrow-right" aria-hidden="true" /> Coach online
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="coach-cta-hero" aria-label="Acceso para coaches">
                    <div className="left">
                      <div className="ico" aria-hidden="true">
                        <i className="fa-solid fa-id-badge" aria-hidden="true" />
                      </div>
                      <div>
                        <b>Eres coach?</b>
                        <p>Unete a la plataforma y crea tu perfil para conseguir clientes en Madrid, Barcelona y online.</p>
                      </div>
                    </div>
                    <div className="actions">
                      <Link className="btn ghost" href="/membresia" aria-label="Ir a membresia para coaches">
                        Ver membresia
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="hero-side" aria-label="Vista previa">
                <div className="inner">
                  <div className="mini">
                    <div className="top">
                      <span className="badge">
                        <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" /> Busqueda guiada
                      </span>
                      <span className="badge">
                        <i className="fa-solid fa-shield-halved" aria-hidden="true" /> Perfiles verificados
                      </span>
                    </div>

                    <div className="body">
                      <div className="mock-img">
                        <Image
                          src="https://encuentratucoach.es/wp-content/uploads/2026/01/pexels-tima-miroshnichenko-5336951.jpg"
                          alt="Imagen de ejemplo de sesion de coaching"
                          width={1400}
                          height={900}
                          sizes="(max-width: 980px) 100vw, 38vw"
                        />
                      </div>

                      <div className="feature-list" aria-label="Puntos clave">
                        <div className="feat">
                          <i className="fa-solid fa-compass" aria-hidden="true" />
                          <div>
                            <b>Elige por objetivo</b>
                            <span>Vida, carrera, liderazgo, pareja, bioemocional y mas.</span>
                          </div>
                        </div>

                        <div className="feat">
                          <i className="fa-solid fa-check-double" aria-hidden="true" />
                          <div>
                            <b>Distintivo de verificacion</b>
                            <span>Visible cuando hay documentacion revisada.</span>
                          </div>
                        </div>
                      </div>

                      <div className="mini-actions" aria-label="Acciones rapidas">
                        <Link className="btn primary" href="/coaches" aria-label="Ver coaches en el directorio">
                          Ver coaches ahora
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section aria-label="Ultimos coaches destacados" className="etc-reveal">
          <div className="section-head">
            <div>
              <h2 className="h2">Ultimos perfiles anadidos</h2>
              <div className="sub">Explora perfiles del directorio y elige por encaje real.</div>
            </div>
            <Link className="btn" href="/coaches" aria-label="Ver todos">
              Ver todos
            </Link>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <LatestCoachesSlider coaches={coaches} />
          </div>
        </section>

        <section id="etc-categorias" aria-label="Explorar por tipo de coaching" className="etc-reveal">
          <div className="section-head">
            <div>
              <h2 className="h2">Explora por tipo de coaching</h2>
              <div className="sub">Empieza por especialidad y luego afina por modalidad y presupuesto.</div>
            </div>
            <Link className="btn" href="/coaches" aria-label="Abrir directorio">
              Abrir directorio
            </Link>
          </div>

          <div className="cat-grid" aria-label="Categorias">
            <Link className="cat-card" href="/coaches/categoria/bioemocional">
              <h3>Bioemocional</h3>
              <p>Gestion emocional, creencias y cambios profundos con estructura.</p>
              <span className="go">
                <i className="fa-solid fa-arrow-right" aria-hidden="true" /> Ver coaches bioemocionales
              </span>
            </Link>
            <Link className="cat-card" href="/coaches/categoria/personal">
              <h3>Coaching personal</h3>
              <p>Autoestima, habitos, disciplina, foco y objetivos personales.</p>
              <span className="go">
                <i className="fa-solid fa-arrow-right" aria-hidden="true" /> Ver coaching personal
              </span>
            </Link>
            <Link className="cat-card" href="/coaches/categoria/carrera">
              <h3>Carrera</h3>
              <p>Cambio laboral, entrevistas y claridad profesional.</p>
              <span className="go">
                <i className="fa-solid fa-arrow-right" aria-hidden="true" /> Ver coaching de carrera
              </span>
            </Link>
            <Link className="cat-card" href="/coaches/categoria/liderazgo">
              <h3>Liderazgo</h3>
              <p>Comunicacion, equipos, decisiones y rendimiento directivo.</p>
              <span className="go">
                <i className="fa-solid fa-arrow-right" aria-hidden="true" /> Ver liderazgo
              </span>
            </Link>
            <Link className="cat-card" href="/coaches/categoria/pareja">
              <h3>Pareja</h3>
              <p>Comunicacion, acuerdos, limites y objetivos compartidos.</p>
              <span className="go">
                <i className="fa-solid fa-arrow-right" aria-hidden="true" /> Ver pareja
              </span>
            </Link>
            <Link className="cat-card" href="/coaches/categoria/deportivo">
              <h3>Deportivo</h3>
              <p>Mentalidad, consistencia y rendimiento.</p>
              <span className="go">
                <i className="fa-solid fa-arrow-right" aria-hidden="true" /> Ver deportivo
              </span>
            </Link>
          </div>
        </section>

        <section aria-label="Como se si necesito un coach" className="etc-reveal">
          <div className="section-head">
            <div>
              <h2 className="h2">Como saber si te conviene trabajar con un coach</h2>
              <div className="sub">Si te identificas con varios puntos, un coach acelera tu avance.</div>
            </div>
          </div>

          <div className="need-grid" aria-label="Indicadores">
            <div className="need-card">
              <h3>Senales claras y comunes</h3>
              <p>Especialmente util cuando sabes lo que quieres, pero te falta estructura o constancia.</p>

              <div className="need-list">
                {[
                  ["Te cuesta decidir", "Das vueltas a lo mismo y sientes bloqueo."],
                  ["Empiezas fuerte y lo dejas", "Falta un sistema realista para sostener el cambio."],
                  ["Quieres mejorar sin plan", "Objetivos difusos y sin pasos concretos."],
                  ["Necesitas accountability", "Con seguimiento semanal avanzas mas rapido."],
                ].map(([title, text]) => (
                  <div className="need-item" key={title}>
                    <i className="fa-solid fa-circle-check" aria-hidden="true" />
                    <div>
                      <b>{title}</b>
                      <span>{text}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="need-actions">
                <Link className="btn primary" href="/coaches">
                  Buscar coaches
                </Link>
                <a className="btn" href="#etc-categorias">
                  Explorar especialidades
                </a>
              </div>
            </div>

            <div className="need-side" aria-label="Imagen de apoyo">
              <Image
                src="https://encuentratucoach.es/wp-content/uploads/2026/01/pexels-liza-summer-6382642.jpg"
                alt="Imagen de apoyo para toma de decisiones"
                width={1400}
                height={900}
                sizes="(max-width: 980px) 100vw, 40vw"
              />
            </div>
          </div>
        </section>

        <section aria-label="Buscar por ciudad" className="etc-reveal">
          <div className="section-head">
            <div>
              <h2 className="h2">Buscar por ciudad</h2>
              <div className="sub">Si prefieres presencial, entra por ciudad. Para online, busca en toda Espana.</div>
            </div>
          </div>

          <div className="city-grid" aria-label="Ciudades">
            {[
              ["Coaches en Madrid", "/coaches/ciudad/madrid", "https://encuentratucoach.es/wp-content/uploads/2024/05/pexels-alexazabache-3757144.jpg"],
              ["Coaches en Barcelona", "/coaches/ciudad/barcelona", "https://encuentratucoach.es/wp-content/uploads/2026/01/pexels-olenagoldman-998736.jpg"],
              ["Coaches en Valencia", "/coaches/ciudad/valencia", "https://encuentratucoach.es/wp-content/uploads/2024/05/pexels-julia-gnclvz-530087601-16702611.jpg"],
              ["Coaches en Sevilla", "/coaches/ciudad/sevilla", "https://encuentratucoach.es/wp-content/uploads/2024/05/pexels-jose-rodriguez-ortega-2189823-16778460.jpg"],
              ["Coaches en Bilbao", "/coaches/ciudad/bilbao", "https://encuentratucoach.es/wp-content/uploads/de_fb_uploads/pexels-jesus-esteban-san-jose-11194232-14638004-1.jpg"],
              ["Coaches en Malaga", "/coaches/ciudad/malaga", "https://encuentratucoach.es/wp-content/uploads/2026/01/pexels-vlasceanu-29151125.jpg"],
            ].map(([title, href, src]) => (
              <Link key={title} className="city-card" href={href} aria-label={title}>
                <Image src={src} alt={title} width={1400} height={900} sizes="(max-width: 980px) 100vw, 31vw" />
                  <div className="label">
                    <b>{title}</b>
                    <span>
                      <i className="fa-solid fa-arrow-right" aria-hidden="true" /> Ver
                    </span>
                  </div>
                </Link>
            ))}
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <div
              style={{
                alignItems: "center",
                color: "rgba(11,18,32,.78)",
                display: "flex",
                flexWrap: "wrap",
                fontWeight: 800,
                gap: 14,
                justifyContent: "space-between",
                padding: "20px 22px",
              }}
            >
              <div>Si prefieres online, filtra por modalidad online y amplia opciones.</div>
              <Link className="btn primary" href="/coaches/modalidad/online">
                Ver coaches online
              </Link>
            </div>
          </div>
        </section>

        <section aria-label="Como elegir un coach" className="etc-reveal">
          <div className="section-head">
            <div>
              <h2 className="h2">Como elegir un coach sin perder tiempo</h2>
              <div className="sub">Checklist rapida para elegir por encaje y avanzar desde la primera sesion.</div>
            </div>
          </div>

          <div className="choose-grid">
            <div className="choose-panel">
              <h3>Checklist en 3 pasos</h3>
              <p>En menos de 5 minutos puedes hacer shortlist de 2 o 3 perfiles.</p>
              <div className="choose-list">
                {[
                  ["Define el objetivo", "Ejemplo: quiero cambiar de trabajo sin bajar ingresos."],
                  ["Elige modalidad", "Online para flexibilidad, presencial para contexto local."],
                  ["Valida confianza", "Revisa certificacion, especialidad y resenas."],
                ].map(([title, text], index) => (
                  <div className="choose-item" key={title}>
                    <div className="num">{index + 1}</div>
                    <div>
                      <b>{title}</b>
                      <span>{text}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="choose-actions">
                <Link className="btn primary" href="/coaches">
                  Ir a buscar
                </Link>
                <Link className="btn" href="/coaches/certificados">
                  Ver certificados
                </Link>
              </div>
            </div>

            <div className="choose-side">
              <div className="top">
                <span className="pill">
                  <i className="fa-solid fa-clock" aria-hidden="true" /> 2 minutos
                </span>
                <span className="pill">
                  <i className="fa-solid fa-star" aria-hidden="true" /> Mejor encaje
                </span>
              </div>

              <div className="body">
                <div className="mini-card">
                  <b>Pregunta inicial recomendada</b>
                  <p>Mi objetivo es X, ahora estoy en Y y mi mayor bloqueo es Z. Como lo trabajariamos?</p>
                  <div className="tags">
                    <span className="tag">Mensaje claro</span>
                    <span className="tag">Objetivo</span>
                    <span className="tag">Proceso</span>
                  </div>
                </div>

                <div className="mini-card">
                  <b>Regla practica</b>
                  <p>Si tras la primera sesion no tienes claridad y siguiente paso concreto, cambia de perfil.</p>
                  <div className="tags">
                    <span className="tag">Claridad</span>
                    <span className="tag">Plan</span>
                  </div>
                </div>

                <Link className="btn primary" href="/coaches/categoria/personal">
                  Empezar por coaching personal
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Online vs presencial" className="etc-reveal">
          <div className="section-head">
            <div>
              <h2 className="h2">Coaching online vs presencial</h2>
              <div className="sub">Elige por estilo de vida. Si dudas, prueba ambos formatos.</div>
            </div>
          </div>

          <div className="card compare">
            <div className="grid2">
              <div className="compare-card">
                <h3>Online</h3>
                <ul>
                  <li>
                    <i className="fa-solid fa-check" aria-hidden="true" /> Flexibilidad y cero desplazamientos
                  </li>
                  <li>
                    <i className="fa-solid fa-check" aria-hidden="true" /> Acceso a profesionales de toda Espana
                  </li>
                  <li>
                    <i className="fa-solid fa-check" aria-hidden="true" /> Suele ser mas economico
                  </li>
                  <li>
                    <i className="fa-solid fa-check" aria-hidden="true" /> Ideal para agendas apretadas
                  </li>
                </ul>
                <div className="actions">
                  <Link className="btn primary" href="/coaches/modalidad/online">
                    Ver online
                  </Link>
                  <Link className="btn" href="/coaches/certificados">
                    Online certificados
                  </Link>
                </div>
              </div>

              <div className="compare-card">
                <h3>Presencial</h3>
                <ul>
                  <li>
                    <i className="fa-solid fa-check" aria-hidden="true" /> Conexion y compromiso
                  </li>
                  <li>
                    <i className="fa-solid fa-check" aria-hidden="true" /> Lectura completa del lenguaje corporal
                  </li>
                  <li>
                    <i className="fa-solid fa-check" aria-hidden="true" /> Util si valoras cercania
                  </li>
                  <li>
                    <i className="fa-solid fa-check" aria-hidden="true" /> Perfecto para contexto local
                  </li>
                </ul>
                <div className="actions">
                  <Link className="btn primary" href="/coaches/ciudad/madrid">
                    Ver presencial
                  </Link>
                  <Link className="btn" href="/coaches/certificados">
                    Presencial certificados
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="etc-faq" aria-label="Preguntas frecuentes" className="etc-reveal">
          <div className="section-head">
            <div>
              <h2 className="h2">Resolvemos tus FAQs</h2>
              <div className="sub">Respuestas directas para elegir con confianza.</div>
            </div>
          </div>

          <div className="grid" style={{ gap: 14 }}>
            <details>
              <summary>
                <div className="q">
                  <span>Cuanto cuesta una sesion de coaching en Madrid?</span>
                  <svg className="chev" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </summary>
              <div className="a">El rango habitual esta entre 60 EUR y 150 EUR segun especialidad, experiencia y modalidad.</div>
            </details>

            <details>
              <summary>
                <div className="q">
                  <span>Funciona igual el coaching online que el presencial?</span>
                  <svg className="chev" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </summary>
              <div className="a">En muchos objetivos, si. Online aporta flexibilidad y presencial puede aportar cercania local.</div>
            </details>

            <details>
              <summary>
                <div className="q">
                  <span>Como encontrar coach profesional en Madrid mas rapido?</span>
                  <svg className="chev" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </summary>
              <div className="a">Define objetivo en una frase, filtra por especialidad y revisa certificacion y resenas.</div>
            </details>

            <details>
              <summary>
                <div className="q">
                  <span>Cuanto suele durar un proceso de coaching?</span>
                  <svg className="chev" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </summary>
              <div className="a">Objetivos puntuales: 3 a 6 sesiones. Cambios de carrera o habitos: 8 a 12 sesiones.</div>
            </details>
          </div>
        </section>

        <section aria-label="Pregunta a un coach" id="etc-pregunta-coach" className="etc-reveal">
          <div className="section-head">
            <div>
              <h2 className="h2">Pregunta a un coach</h2>
              <div className="sub">Si tienes dudas, publica tu pregunta y recibe respuestas de coaches de la plataforma.</div>
            </div>
            <Link className="btn coach-outline" href="/pregunta-a-un-coach" aria-label="Ir a Pregunta a un Coach">
              <i className="fa-solid fa-circle-question" aria-hidden="true" />
              Pregunta Coach
            </Link>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div className="grid2" style={{ alignItems: "center" }}>
              <div className="grid" style={{ gap: 12 }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 980, letterSpacing: "-0.2px" }}>Resuelve dudas antes de elegir</div>
                <div style={{ color: "rgba(11,18,32,.78)", fontWeight: 800 }}>
                  Explica tu situacion en 3 o 5 lineas y pregunta lo que necesites. Puedes publicar de forma anonima.
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 6 }}>
                  <Link className="btn coach-solid" href="/pregunta-a-un-coach">
                    <i className="fa-solid fa-paper-plane" aria-hidden="true" />
                    Hacer una pregunta
                  </Link>
                  <Link className="btn coach-outline" href="/pregunta-a-un-coach">
                    <i className="fa-solid fa-comments" aria-hidden="true" />
                    Ver preguntas
                  </Link>
                </div>
              </div>

              <div className="mock-img" style={{ borderRadius: 26 }}>
                <Image
                  src="https://encuentratucoach.es/wp-content/uploads/2026/01/pexels-shkrabaanthony-5244025.jpg"
                  alt="Imagen de ejemplo de preguntas y respuestas"
                  width={1400}
                  height={900}
                  sizes="(max-width: 980px) 100vw, 40vw"
                />
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Opiniones" className="etc-reveal">
          <div className="section-head">
            <div>
              <h2 className="h2">Opiniones reales de usuarios</h2>
              <div className="sub">Experiencias reales que ayudan a elegir con confianza.</div>
            </div>
          </div>

          <div className="card" id="etcTrust">
            <div className="trust-top">
              <div className="rating-line" aria-label="Valoracion media">
                <div className="stars" aria-hidden="true">
                  <i className="fa-solid fa-star" aria-hidden="true" /> <i className="fa-solid fa-star" aria-hidden="true" /> <i className="fa-solid fa-star" aria-hidden="true" /> <i className="fa-solid fa-star" aria-hidden="true" /> <i className="fa-solid fa-star-half-stroke" aria-hidden="true" />
                </div>
                <div className="rating">
                  4.8/5 <small>media de valoraciones</small>
                </div>
              </div>
              <Link className="btn" href="/coaches" aria-label="Ver coaches">
                Ver coaches
              </Link>
            </div>

            <div className="trust-slider" aria-label="Slider de resenas">
              <div className="track" style={{ transform: `translate3d(-${activeReviewSlide * 100}%,0,0)` }}>
                {REVIEWS.map((slide, slideIndex) => (
                  <div className="slide" key={`slide-${slideIndex}`}>
                    {slide.map((review) => (
                      <div className="quote" key={review.name}>
                        <div className="stars" aria-hidden="true">
                          <i className="fa-solid fa-star" aria-hidden="true" /> <i className="fa-solid fa-star" aria-hidden="true" /> <i className="fa-solid fa-star" aria-hidden="true" /> <i className="fa-solid fa-star" aria-hidden="true" /> <i className="fa-solid fa-star-half-stroke" aria-hidden="true" />
                        </div>
                        <p>{`"${review.text}"`}</p>
                        <div className="who">
                          <Image src={review.avatar} alt={`Avatar de ${review.name}`} width={400} height={400} />
                          <div>
                            <b>{review.name}</b>
                            <span>{review.tag}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="slider-controls" aria-label="Controles del slider">
                <button
                  className="navbtn"
                  type="button"
                  onClick={() => setActiveReviewSlide((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length)}
                  aria-label="Anterior"
                >
                  <i className="fa-solid fa-arrow-left" aria-hidden="true" />
                </button>
                <div className="dots" aria-label="Indicadores">
                  {REVIEWS.map((_, index) => (
                    <button
                      key={`dot-${index}`}
                      className={`dot ${index === activeReviewSlide ? "is-active" : ""}`}
                      type="button"
                      aria-label={`Ir a resena ${index + 1}`}
                      onClick={() => setActiveReviewSlide(index)}
                    />
                  ))}
                </div>
                <button
                  className="navbtn"
                  type="button"
                  onClick={() => setActiveReviewSlide((prev) => (prev + 1) % REVIEWS.length)}
                  aria-label="Siguiente"
                >
                  <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="CTA final" className="etc-reveal">
          <div className="final">
            <div className="final-grid">
              <div>
                <h2>Empieza hoy y da tu primer paso</h2>
                <p>
                  Entra al directorio, filtra por especialidad, modalidad y presupuesto, y elige por encaje. Si quieres
                  maxima confianza, activa certificados.
                </p>

                <div className="row">
                  <Link className="btn primary" href="/coaches" aria-label="Ir al directorio">
                    Ir al directorio
                  </Link>
                  <Link className="btn" href="/coaches/certificados" aria-label="Ver certificados">
                    Ver certificados
                  </Link>
                </div>

                <div className="coachbox" aria-label="CTA para coaches">
                  <b>Eres coach?</b> Unete a la plataforma y activa tu perfil para conseguir clientes.
                  <div className="row">
                    <Link className="btn coach-outline" href="/membresia" aria-label="Ver membresia para coaches">
                      <i className="fa-solid fa-circle-question" aria-hidden="true" />
                      Ver membresia
                    </Link>
                    <Link className="btn coach-solid" href="/membresia" aria-label="Unirme como coach">
                      <i className="fa-solid fa-id-badge" aria-hidden="true" />
                      Unirme como coach
                    </Link>
                  </div>
                </div>
              </div>

              <div className="final-img" aria-label="Imagen final">
                <Image
                  src="https://encuentratucoach.es/wp-content/uploads/2026/01/pexels-fauxels-3184405.jpg"
                  alt="Imagen de ejemplo de coaching"
                  width={1400}
                  height={900}
                  sizes="(max-width: 980px) 100vw, 40vw"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {toast ? (
        <div className={`etc-toast ${toast.type} is-show`} role="status" aria-live="polite">
          <span className="dot" aria-hidden="true" />
          <span className="txt">{toast.message}</span>
        </div>
      ) : null}
    </div>
  );
}


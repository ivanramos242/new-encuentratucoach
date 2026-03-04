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

const GENERIC_REVIEW_AVATAR = "/home-images/avatar-generic.svg";

const CITY_SUGGESTIONS: Suggestion[] = [
  { href: "/coaches/ciudad/madrid", label: "Coach Madrid", meta: "Ciudad" },
  { href: "/coaches/ciudad/barcelona", label: "Busco coach Barcelona", meta: "Ciudad" },
  { href: "/coaches/ciudad/valencia", label: "Coach en Valencia", meta: "Ciudad" },
  { href: "/coaches/ciudad/sevilla", label: "Coach en Sevilla", meta: "Ciudad" },
  { href: "/coaches/ciudad/bilbao", label: "Coach en Bilbao", meta: "Ciudad" },
  { href: "/coaches/ciudad/malaga", label: "Coach en Málaga", meta: "Ciudad" },
];

const SPECIALTY_SUGGESTIONS: Suggestion[] = [
  { href: "/coaches/categoria/personal", label: "Coaching personal", meta: "Especialidad" },
  { href: "/coaches/categoria/carrera", label: "Coaching de carrera", meta: "Especialidad" },
  { href: "/coaches/categoria/liderazgo", label: "Coach directivo Madrid", meta: "Especialidad" },
  { href: "/coaches/categoria/bioemocional", label: "Coaching bioemocional", meta: "Especialidad" },
  { href: "/coaches/categoria/pareja", label: "Coaching de pareja", meta: "Especialidad" },
  { href: "/coaches/modalidad/online", label: "Coach online", meta: "Modalidad" },
  { href: "/coaches/certificados", label: "Coach profesional Madrid", meta: "Verificado" },
  { href: "/coaches/ciudad/madrid", label: "Coach Madrid precio", meta: "Comparativa" },
  { href: "/coaches/ciudad/madrid", label: "Servicios de coaching Madrid", meta: "Servicio" },
  { href: "/coaches/ciudad/madrid", label: "Coaching Madrid", meta: "Servicio" },
  { href: "/coaches", label: "Buscar coach", meta: "Directorio" },
  { href: "/coaches", label: "Encontrar coach", meta: "Directorio" },
  { href: "/coaches", label: "Busco coach", meta: "Directorio" },
  { href: "/coaches/categoria/ejecutivo", label: "Coaching ejecutivo", meta: "Especialidad" },
];
const TOP_CITY_SPECIALTY_COMBOS: Array<{ label: string; href: string }> = [
  { label: "Coaching personal en Madrid", href: "/coaches/categoria/personal/madrid" },
  { label: "Coaching de carrera en Madrid", href: "/coaches/categoria/carrera/madrid" },
  { label: "Coaching de liderazgo en Barcelona", href: "/coaches/categoria/liderazgo/barcelona" },
  { label: "Coaching de pareja en Valencia", href: "/coaches/categoria/pareja/valencia" },
  { label: "Coaching bioemocional en Sevilla", href: "/coaches/categoria/bioemocional/sevilla" },
  { label: "Coaching deportivo en Bilbao", href: "/coaches/categoria/deportivo/bilbao" },
];
const REVIEWS = [
  [
    {
      text: "Estaba buscando un coach que entendiera mi momento profesional y en dos días ya tenía una primera sesión definida.",
      name: "Carlos Martínez",
      tag: "Emprendimiento",
      avatar: GENERIC_REVIEW_AVATAR,
    },
    {
      text: "Probé coaching online por primera vez y fue muy práctico. En pocas sesiones conseguí claridad y foco.",
      name: "Laura Serrano",
      tag: "Coaching personal",
      avatar: GENERIC_REVIEW_AVATAR,
    },
  ],
  [
    {
      text: "Buscaba un coach directivo en Madrid. Comparé perfiles, enfoque y precio, y elegí rápido.",
      name: "David Gómez",
      tag: "Liderazgo",
      avatar: GENERIC_REVIEW_AVATAR,
    },
    {
      text: "Me ayudó mucho poder filtrar por precio y por modalidad. En menos de una semana ya estaba trabajando objetivos concretos.",
      name: "Marta Ríos",
      tag: "Hábitos",
      avatar: GENERIC_REVIEW_AVATAR,
    },
  ],
  [
    {
      text: "Estaba bloqueado con una decisión de carrera y con coaching profesional conseguí un plan accionable.",
      name: "Javier Molina",
      tag: "Carrera",
      avatar: GENERIC_REVIEW_AVATAR,
    },
    {
      text: "El sello de coach certificado y las reseñas me dieron mucha confianza para elegir mejor coach en Madrid.",
      name: "Nuria Pardo",
      tag: "Autoestima",
      avatar: GENERIC_REVIEW_AVATAR,
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
        setToast({ type: "is-error", message: "No se pudo enviar el mensaje. Inténtalo de nuevo." });
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
                    <b>coaches en España</b>
                  </span>
                  <span style={{ opacity: 0.55 }}>-</span>
                  <span>online o presencial</span>
                </div>

                <h1 className="h1">Buscar un coach nunca ha sido tan fácil</h1>

                <p className="lead">
                  Compara perfiles por especialidad, ciudad, modalidad y presupuesto. Contacta directamente con el
                  profesional y empieza con un plan claro. Si ves el distintivo de <strong>coach certificado</strong>,
                  revisamos documentación real.
                </p>

                <div className="searchwrap" aria-label="Búsqueda principal">
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
                        placeholder="Ej: coach Madrid, coach online, coach profesional en Madrid..."
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

                  <div className="chips" aria-label="Accesos rápidos">
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

                  <div className="popular-grid" aria-label="Búsquedas populares">
                    <div className="popular-card">
                      <h3>Búsquedas por ciudad</h3>
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
                        <b>¿Eres coach?</b>
                        <p>Únete a la plataforma y crea tu perfil para conseguir clientes en Madrid, Barcelona y online.</p>
                      </div>
                    </div>
                    <div className="actions">
                      <Link className="btn ghost" href="/membresia" aria-label="Ir a membresía para coaches">
                        Ver membresía
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
                        <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" /> Búsqueda guiada
                      </span>
                      <span className="badge">
                        <i className="fa-solid fa-shield-halved" aria-hidden="true" /> Perfiles verificados
                      </span>
                    </div>

                    <div className="body">
                      <div className="mock-img">
                        <Image
                          src="/home-images/coach-generic-1.jpeg"
                          alt="Imagen de ejemplo de sesión de coaching"
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
                            <span>Vida, carrera, liderazgo, pareja, bioemocional y más.</span>
                          </div>
                        </div>

                        <div className="feat">
                          <i className="fa-solid fa-check-double" aria-hidden="true" />
                          <div>
                            <b>Distintivo de verificación</b>
                            <span>Visible cuando hay documentación revisada.</span>
                          </div>
                        </div>
                      </div>

                      <div className="mini-actions" aria-label="Acciones rápidas">
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

        <section aria-label="Últimos coaches destacados" className="etc-reveal">
          <div className="section-head">
            <div>
              <h2 className="h2">Últimos perfiles añadidos</h2>
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

          <div className="cat-grid" aria-label="Categorías">
            <Link className="cat-card" href="/coaches/categoria/bioemocional">
              <h3>Bioemocional</h3>
              <p>Gestión emocional, creencias y cambios profundos con estructura.</p>
              <span className="go">
                <i className="fa-solid fa-arrow-right" aria-hidden="true" /> Ver coaches bioemocionales
              </span>
            </Link>
            <Link className="cat-card" href="/coaches/categoria/personal">
              <h3>Coaching personal</h3>
              <p>Autoestima, hábitos, disciplina, foco y objetivos personales.</p>
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
              <p>Comunicación, equipos, decisiones y rendimiento directivo.</p>
              <span className="go">
                <i className="fa-solid fa-arrow-right" aria-hidden="true" /> Ver liderazgo
              </span>
            </Link>
            <Link className="cat-card" href="/coaches/categoria/pareja">
              <h3>Pareja</h3>
              <p>Comunicación, acuerdos, límites y objetivos compartidos.</p>
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

        <section aria-label="Cómo sé si necesito un coach" className="etc-reveal">
          <div className="section-head">
            <div>
              <h2 className="h2">Cómo saber si te conviene trabajar con un coach</h2>
              <div className="sub">Si te identificas con varios puntos, un coach acelera tu avance.</div>
            </div>
          </div>

          <div className="need-grid" aria-label="Indicadores">
            <div className="need-card">
              <h3>Señales claras y comunes</h3>
              <p>Especialmente útil cuando sabes lo que quieres, pero te falta estructura o constancia.</p>

              <div className="need-list">
                {[
                  ["Te cuesta decidir", "Das vueltas a lo mismo y sientes bloqueo."],
                  ["Empiezas fuerte y lo dejas", "Falta un sistema realista para sostener el cambio."],
                  ["Quieres mejorar sin plan", "Objetivos difusos y sin pasos concretos."],
                  ["Necesitas seguimiento", "Con seguimiento semanal avanzas más rápido."],
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
                src="/home-images/coach-generic-2.jpeg"
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
              <div className="sub">Si prefieres presencial, entra por ciudad. Para online, busca en toda España.</div>
            </div>
          </div>

          <div className="city-grid" aria-label="Ciudades">
            {[
              ["Coaches en Madrid", "/coaches/ciudad/madrid", "/home-images/city-madrid.jpeg"],
              ["Coaches en Barcelona", "/coaches/ciudad/barcelona", "/home-images/city-barcelona.jpeg"],
              ["Coaches en Valencia", "/coaches/ciudad/valencia", "/home-images/city-valencia.jpeg"],
              ["Coaches en Sevilla", "/coaches/ciudad/sevilla", "/home-images/city-sevilla.jpeg"],
              ["Coaches en Bilbao", "/coaches/ciudad/bilbao", "/home-images/city-bilbao.jpeg"],
              ["Coaches en Málaga", "/coaches/ciudad/malaga", "/home-images/city-malaga.jpeg"],
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
              <div>Si prefieres online, filtra por modalidad online y amplía opciones.</div>
              <Link className="btn primary" href="/coaches/modalidad/online">
                Ver coaches online
              </Link>
            </div>
          </div>
        </section>

        <section aria-label="Rutas por ciudad y especialidad" className="etc-reveal">
          <div className="section-head">
            <div>
              <h2 className="h2">Combinaciones más buscadas</h2>
              <div className="sub">
                Accesos directos a páginas transaccionales de ciudad + especialidad para decidir más rápido.
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div className="grid" style={{ gap: 10 }}>
              {TOP_CITY_SPECIALTY_COMBOS.map((combo) => (
                <Link
                  key={combo.href}
                  href={combo.href}
                  className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-white"
                >
                  <i className="fa-solid fa-arrow-right" aria-hidden="true" /> {combo.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section aria-label="Cómo elegir un coach" className="etc-reveal">
          <div className="section-head">
            <div>
              <h2 className="h2">Cómo elegir un coach sin perder tiempo</h2>
              <div className="sub">Lista rápida para elegir por encaje y avanzar desde la primera sesión.</div>
            </div>
          </div>

          <div className="choose-grid">
            <div className="choose-panel">
              <h3>Lista en 3 pasos</h3>
              <p>En menos de 5 minutos puedes hacer una lista corta de 2 o 3 perfiles.</p>
              <div className="choose-list">
                {[
                  ["Define el objetivo", "Ejemplo: quiero cambiar de trabajo sin bajar ingresos."],
                  ["Elige modalidad", "Online para flexibilidad, presencial para contexto local."],
                  ["Valida confianza", "Revisa certificación, especialidad y reseñas."],
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
                  <p>Mi objetivo es X, ahora estoy en Y y mi mayor bloqueo es Z. ¿Cómo lo trabajaríamos?</p>
                  <div className="tags">
                    <span className="tag">Mensaje claro</span>
                    <span className="tag">Objetivo</span>
                    <span className="tag">Proceso</span>
                  </div>
                </div>

                <div className="mini-card">
                  <b>Regla práctica</b>
                  <p>Si tras la primera sesión no tienes claridad y un siguiente paso concreto, cambia de perfil.</p>
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
                    <i className="fa-solid fa-check" aria-hidden="true" /> Acceso a profesionales de toda España
                  </li>
                  <li>
                    <i className="fa-solid fa-check" aria-hidden="true" /> Suele ser más económico
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
                    <i className="fa-solid fa-check" aria-hidden="true" /> Conexión y compromiso
                  </li>
                  <li>
                    <i className="fa-solid fa-check" aria-hidden="true" /> Lectura completa del lenguaje corporal
                  </li>
                  <li>
                    <i className="fa-solid fa-check" aria-hidden="true" /> Útil si valoras cercanía
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

        <section aria-label="Guías clave" className="etc-reveal">
          <div className="section-head">
            <div>
              <h2 className="h2">Guías clave para decidir mejor</h2>
              <div className="sub">Contenido atemporal orientado a intención real antes de pasar al directorio.</div>
            </div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div className="grid" style={{ gap: 10 }}>
              <Link
                href="/que-es-el-coaching-y-para-que-sirve"
                className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-white"
              >
                Qué es el coaching y para qué sirve
              </Link>
              <Link
                href="/precios-coaching-espana"
                className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-white"
              >
                Precios de coaching en España
              </Link>
              <Link
                href="/como-elegir-coach-2026"
                className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-white"
              >
                Cómo elegir coach en 2026
              </Link>
            </div>
          </div>
        </section>

        <section id="etc-faq" aria-label="Preguntas frecuentes" className="etc-reveal">
          <div className="section-head">
            <div>
              <h2 className="h2">Resolvemos tus preguntas frecuentes</h2>
              <div className="sub">Respuestas directas para elegir con confianza.</div>
            </div>
          </div>

          <div className="grid" style={{ gap: 14 }}>
            <details>
              <summary>
                <div className="q">
                  <span>¿Cuánto cuesta una sesión de coaching en Madrid?</span>
                  <svg className="chev" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </summary>
              <div className="a">El rango habitual está entre 60 EUR y 150 EUR según especialidad, experiencia y modalidad.</div>
            </details>

            <details>
              <summary>
                <div className="q">
                  <span>¿Funciona igual el coaching online que el presencial?</span>
                  <svg className="chev" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </summary>
              <div className="a">En muchos objetivos, sí. Online aporta flexibilidad y presencial puede aportar cercanía local.</div>
            </details>

            <details>
              <summary>
                <div className="q">
                  <span>¿Cómo encontrar coach profesional en Madrid más rápido?</span>
                  <svg className="chev" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </summary>
              <div className="a">Define objetivo en una frase, filtra por especialidad y revisa certificación y reseñas.</div>
            </details>

            <details>
              <summary>
                <div className="q">
                  <span>¿Cuánto suele durar un proceso de coaching?</span>
                  <svg className="chev" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </summary>
              <div className="a">Objetivos puntuales: 3 a 6 sesiones. Cambios de carrera o hábitos: 8 a 12 sesiones.</div>
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
                  Explica tu situación en 3 o 5 líneas y pregunta lo que necesites. Puedes publicar de forma anónima.
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
                  src="/home-images/coach-generic-3.jpeg"
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
              <div className="rating-line" aria-label="Valoración media">
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

            <div className="trust-slider" aria-label="Slider de reseñas">
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
                      aria-label={`Ir a reseña ${index + 1}`}
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
                  máxima confianza, activa certificados.
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
                  <b>¿Eres coach?</b> Únete a la plataforma y activa tu perfil para conseguir clientes.
                  <div className="row">
                    <Link className="btn coach-outline" href="/membresia" aria-label="Ver membresía para coaches">
                      <i className="fa-solid fa-circle-question" aria-hidden="true" />
                      Ver membresía
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
                  src="/home-images/coach-generic-4.jpeg"
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






"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LatestCoachesSlider } from "@/components/home/latest-coaches-slider";
import { trackAcquisitionEvent } from "@/lib/acquisition-analytics";
import type { CoachProfile } from "@/types/domain";

type Suggestion = { href: string; label: string; meta: string };

type HomeV4Props = {
  coaches: CoachProfile[];
  stats: {
    certifiedCount: number;
    cityCount: number;
    publishedCount: number;
    totalReviews: number;
  };
};

const QUICK_LINKS: Suggestion[] = [
  { href: "/coaches/certificados", label: "Coaches certificados", meta: "Confianza" },
  { href: "/coaches/modalidad/online", label: "Coach online", meta: "Modalidad" },
  { href: "/coaches/categoria/personal", label: "Coaching personal", meta: "Especialidad" },
  { href: "/coaches/categoria/carrera", label: "Coaching de carrera", meta: "Especialidad" },
  { href: "/coaches/ciudad/madrid", label: "Coach en Madrid", meta: "Ciudad" },
  { href: "/coaches/ciudad/barcelona", label: "Coach en Barcelona", meta: "Ciudad" },
];

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export function HomeV4({ coaches, stats }: HomeV4Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [openSuggestions, setOpenSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  const suggestions = useMemo(() => {
    const q = normalize(query);
    const direct = {
      href: query.trim() ? `/coaches?q=${encodeURIComponent(query.trim())}` : "/coaches",
      label: query.trim() ? `Buscar "${query.trim()}"` : "Buscar en el directorio",
      meta: "Directo",
    };
    const filtered = !q ? QUICK_LINKS : QUICK_LINKS.filter((item) => normalize(item.label).includes(q));
    return [direct, ...filtered].slice(0, 8);
  }, [query]);

  const trustHighlights = useMemo(
    () => [
      {
        icon: "fa-shield-halved",
        title: stats.certifiedCount > 0 ? `${stats.certifiedCount}+ coaches verificados` : "Perfiles con validación documental",
        text: "Con distintivo visible cuando hay revisión documental.",
      },
      {
        icon: "fa-star",
        title: stats.totalReviews > 0 ? `${stats.totalReviews}+ reseñas reales` : "Perfiles pensados para decidir mejor",
        text: stats.totalReviews > 0 ? "Más contexto para elegir con confianza." : "Precio, especialidad y contexto visibles desde la primera visita.",
      },
      {
        icon: "fa-comments",
        title: "Contacto directo",
        text: "Mensajería y canales visibles sin intermediarios.",
      },
    ],
    [stats.certifiedCount, stats.totalReviews],
  );

  const platformHighlights = useMemo(
    () => [
      {
        title: stats.publishedCount > 0 ? `${stats.publishedCount}+ perfiles activos` : "Nuevos perfiles en publicación",
        text: "Oferta visible para comparar por especialidad, ciudad y modalidad.",
      },
      {
        title: stats.cityCount > 0 ? `${stats.cityCount} ciudades con presencia` : "Cobertura en expansión",
        text: "Entrada por ciudad si prefieres cercanía local o perfiles online.",
      },
      {
        title: stats.totalReviews > 0 ? `${stats.totalReviews}+ reseñas visibles` : "Señales de confianza visibles",
        text: "Más contexto antes de escribir o reservar una primera conversación.",
      },
    ],
    [stats.cityCount, stats.publishedCount, stats.totalReviews],
  );

  useEffect(() => {
    trackAcquisitionEvent("client_landing_view", { landing_name: "home", event_category: "client_growth" });
    const root = document.getElementById("etcHomeV4");
    if (!root) return;
    root.classList.add("is-ready");
    root.querySelectorAll(".etc-reveal").forEach((element) => element.classList.add("is-in"));
  }, []);

  function goToSuggestion(index: number) {
    const target = suggestions[index];
    if (!target) return;
    trackAcquisitionEvent("client_directory_search", {
      query: query.trim() || target.label,
      source: "home_suggestion",
    });
    setOpenSuggestions(false);
    router.push(target.href);
  }

  function submitSearch() {
    trackAcquisitionEvent("client_directory_search", {
      query: query.trim() || "browse_directory",
      source: "home_search",
    });
    router.push(query.trim() ? `/coaches?q=${encodeURIComponent(query.trim())}` : "/coaches");
  }

  function handleCoachClick(source: string) {
    trackAcquisitionEvent("coach_join_click", { source, event_category: "coach_growth" });
  }

  return (
    <div className="etc-home-v4" id="etcHomeV4">
      <div className="wrap">
        <section className="hero" aria-label="Buscar coach">
          <div className="hero-inner">
            <div className="hero-grid">
              <div>
                <div className="kicker">
                  <span>Directorio de coaches</span>
                  <span style={{ opacity: 0.55 }}>-</span>
                  <span><b>España</b></span>
                  <span style={{ opacity: 0.55 }}>-</span>
                  <span>online o presencial</span>
                </div>
                <h1 className="h1">Encuentra un coach que encaje contigo por objetivo, ciudad y presupuesto</h1>
                <p className="lead">
                  Compara perfiles por especialidad, modalidad, precio y señales de confianza. Contacta directamente y decide con más criterio desde la primera visita.
                </p>

                <div className="card" style={{ marginTop: 18, padding: 18 }}>
                  <div className="grid3" style={{ gap: 14 }}>
                    {trustHighlights.map((item) => (
                      <div key={item.title} className="feat">
                        <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
                        <div>
                          <b>{item.title}</b>
                          <span>{item.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="searchwrap" aria-label="Búsqueda principal">
                  <form className="searchbar" onSubmit={(event) => { event.preventDefault(); submitSearch(); }}>
                    <div className="inputwrap" role="search" aria-label="Buscar coach por ciudad o especialidad">
                      <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                      <input
                        value={query}
                        onChange={(event) => { setQuery(event.target.value); setActiveSuggestion(-1); }}
                        onFocus={() => setOpenSuggestions(true)}
                        onBlur={() => window.setTimeout(() => setOpenSuggestions(false), 120)}
                        onKeyDown={(event) => {
                          if (!openSuggestions) return;
                          if (event.key === "ArrowDown") { event.preventDefault(); setActiveSuggestion((prev) => Math.min(suggestions.length - 1, prev + 1)); }
                          else if (event.key === "ArrowUp") { event.preventDefault(); setActiveSuggestion((prev) => Math.max(0, prev - 1)); }
                          else if (event.key === "Enter" && activeSuggestion >= 0) { event.preventDefault(); goToSuggestion(activeSuggestion); }
                          else if (event.key === "Escape") setOpenSuggestions(false);
                        }}
                        placeholder="Ej: coach en Madrid, coaching de carrera, coach online..."
                        inputMode="search"
                        aria-autocomplete="list"
                      />
                    </div>
                    <button className="btn primary" type="submit">Buscar</button>
                  </form>

                  <div className={`sugg ${openSuggestions ? "is-open" : ""}`} role="listbox" aria-label="Sugerencias">
                    {suggestions.map((item, index) => (
                      <button key={`${item.href}-${item.label}`} className={`row ${index === activeSuggestion ? "is-active" : ""}`} type="button" onMouseDown={() => goToSuggestion(index)}>
                        <i className="fa-solid fa-location-dot" aria-hidden="true" />
                        <span className="label">{item.label}</span>
                        <span className="meta">{item.meta}</span>
                      </button>
                    ))}
                  </div>

                  <div className="chips" aria-label="Accesos rápidos">
                    {QUICK_LINKS.slice(0, 5).map((item) => (
                      <button key={item.href} className="chip" type="button" onClick={() => router.push(item.href)}>
                        <i className="fa-solid fa-arrow-right" aria-hidden="true" /> {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="hero-side" aria-label="Vista previa del directorio">
                <div className="inner">
                  <div className="mini">
                    <div className="top">
                      <span className="badge"><i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" /> Búsqueda guiada</span>
                      <span className="badge"><i className="fa-solid fa-compass" aria-hidden="true" /> Mejor encaje</span>
                    </div>
                    <div className="body">
                      <div className="mock-img">
                        <Image src="/home-images/coach-generic-1.jpeg" alt="Sesión de coaching" width={1400} height={900} sizes="(max-width: 980px) 100vw, 38vw" />
                      </div>
                      <div className="feature-list">
                        <div className="feat"><i className="fa-solid fa-compass" aria-hidden="true" /><div><b>Empieza por tu objetivo</b><span>Vida, carrera, liderazgo, pareja y más.</span></div></div>
                        <div className="feat"><i className="fa-solid fa-arrow-up-right-dots" aria-hidden="true" /><div><b>Compara sin perder tiempo</b><span>Precio, ciudad, modalidad y señales de confianza.</span></div></div>
                      </div>
                      <div className="mini-actions"><Link className="btn primary" href="/coaches">Ver coaches ahora</Link></div>
                    </div>
                  </div>
                  <div className="card" style={{ padding: 18 }}>
                    <p className="text-sm font-black uppercase tracking-wide text-zinc-500">¿Eres coach?</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-700">Consigue visibilidad, clientes y un perfil profesional en una plataforma especializada.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link className="btn coach-outline" href="/membresia" onClick={() => handleCoachClick("home_hero")}>Ver membresía</Link>
                      <Link className="btn coach-solid" href="/registro?intent=coach" onClick={() => handleCoachClick("home_hero")}>Crear cuenta coach</Link>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="etc-reveal" aria-label="Últimos coaches destacados">
          <div className="section-head"><div><h2 className="h2">Últimos perfiles añadidos</h2><div className="sub">Perfiles reales para comparar por encaje, no por intuición.</div></div><Link className="btn" href="/coaches">Ver todos</Link></div>
          <div className="card" style={{ padding: 22 }}><LatestCoachesSlider coaches={coaches} /></div>
        </section>

        <section className="etc-reveal" aria-label="Prueba social del directorio">
          <div className="section-head"><div><h2 className="h2">Por qué se decide mejor aquí</h2><div className="sub">Señales visibles de oferta, confianza y cobertura.</div></div></div>
          <div className="grid3">
            {platformHighlights.map((item) => (
              <div key={item.title} className="choose-panel">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="etc-reveal" aria-label="Combinaciones más buscadas">
          <div className="section-head"><div><h2 className="h2">Combinaciones más buscadas</h2><div className="sub">Accesos rápidos a landings con intención transaccional.</div></div></div>
          <div className="card" style={{ padding: 22 }}><div className="grid" style={{ gap: 10 }}>{["/coaches/categoria/personal/madrid","/coaches/categoria/carrera/madrid","/coaches/categoria/liderazgo/barcelona","/coaches/categoria/pareja/valencia"].map((href, index) => <Link key={href} href={href} className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-white"><i className="fa-solid fa-arrow-right" aria-hidden="true" /> {["Coaching personal en Madrid","Coaching de carrera en Madrid","Coaching de liderazgo en Barcelona","Coaching de pareja en Valencia"][index]}</Link>)}</div></div>
        </section>

        <section className="etc-reveal" aria-label="Guías clave">
          <div className="section-head"><div><h2 className="h2">Guías clave para decidir mejor</h2><div className="sub">Contenido evergreen para resolver dudas antes de pasar al directorio.</div></div></div>
          <div className="card" style={{ padding: 22 }}><div className="grid" style={{ gap: 10 }}><Link href="/que-es-el-coaching-y-para-que-sirve" className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-white">Qué es el coaching y para qué sirve</Link><Link href="/precios-coaching-espana" className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-white">Precios de coaching en España</Link><Link href="/como-elegir-coach-2026" className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-white">Cómo elegir coach en 2026</Link></div></div>
        </section>

        <section className="etc-reveal" aria-label="CTA final">
          <div className="final">
            <div className="final-grid">
              <div>
                <h2>Empieza hoy con una shortlist mejor</h2>
                <p>Entra al directorio, filtra por especialidad, modalidad y presupuesto, y compara perfiles antes de contactar.</p>
                <div className="row"><Link className="btn primary" href="/coaches">Ir al directorio</Link><Link className="btn" href="/coaches/certificados">Ver certificados</Link></div>
                <div className="coachbox"><b>¿Eres coach?</b> Consigue visibilidad y clientes con un perfil profesional y métricas para mejorar tu conversión.<div className="row"><Link className="btn coach-outline" href="/membresia" onClick={() => handleCoachClick("home_final")}>Ver membresía</Link><Link className="btn coach-solid" href="/registro?intent=coach" onClick={() => handleCoachClick("home_final")}>Crear cuenta coach</Link></div></div>
              </div>
              <div className="final-img"><Image src="/home-images/coach-generic-4.jpeg" alt="Proceso de coaching" width={1400} height={900} sizes="(max-width: 980px) 100vw, 40vw" /></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

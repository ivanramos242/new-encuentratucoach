import Image from "next/image";
import Link from "next/link";
import { LatestCoachesSlider } from "@/components/home/latest-coaches-slider";
import { PageShell } from "@/components/layout/page-shell";
import { listPublicCoachesMerged } from "@/lib/public-coaches";
import { coachCategories, cities } from "@/lib/mock-data";

const quickSearches = [
  { label: "Certificados", href: "/coaches?certified=certified" },
  { label: "Online", href: "/coaches?session=online" },
  { label: "Presencial", href: "/coaches?session=presencial" },
  { label: "Coaching personal", href: "/coaches?cat=personal" },
  { label: "Carrera", href: "/coaches?cat=carrera" },
  { label: "Liderazgo", href: "/coaches?cat=liderazgo" },
];

export async function HomePage() {
  const latest = [...(await listPublicCoachesMerged())]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 10);

  return (
    <PageShell className="pt-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(10,166,166,.18),transparent_36%),radial-gradient(circle_at_95%_10%,rgba(41,182,107,.14),transparent_35%),radial-gradient(circle_at_80%_100%,rgba(20,129,199,.12),transparent_40%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <p className="inline-flex flex-wrap items-center gap-2 rounded-full border border-black/10 bg-white/90 px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm">
              <span>Directorio de coaches en España</span>
              <span className="text-zinc-300">•</span>
              <span>online o presencial</span>
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">
              Buscar un coach nunca ha sido tan fácil
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-700 sm:text-lg">
              Compara perfiles por especialidad, ciudad, modalidad y presupuesto. Contacta directamente con el
              profesional y empieza con un plan claro. Si ves el distintivo de <strong>coach certificado</strong>, es
              porque revisamos documentación real.
            </p>

            <form action="/coaches" className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input type="hidden" name="price_min" value="0" />
              <input type="hidden" name="price_max" value="500" />
              <label className="flex flex-1 items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                </svg>
                <input
                  name="q"
                  className="w-full bg-transparent text-sm font-semibold text-zinc-900 outline-none placeholder:text-zinc-400"
                  placeholder="Ej: Barcelona, coach de vida, carrera, liderazgo..."
                />
              </label>
              <button className="rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:brightness-95">
                Buscar
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {quickSearches.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-black/10 bg-white/90 p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-zinc-500">¿Eres coach?</p>
                  <p className="mt-1 text-sm text-zinc-700">
                    Únete a la plataforma y crea tu perfil para aparecer en el directorio.
                  </p>
                </div>
                <Link
                  href="/membresia"
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                >
                  Ver membresía
                </Link>
              </div>
            </div>
          </div>

          <aside className="rounded-[1.5rem] border border-black/10 bg-white/90 p-4 shadow-md">
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
                  Búsqueda guiada
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  Perfiles verificados
                </span>
              </div>
              <div className="relative mt-4 aspect-[16/10] rounded-2xl bg-zinc-100">
                <Image
                  src="https://encuentratucoach.es/wp-content/uploads/2026/01/pexels-tima-miroshnichenko-5336951.jpg"
                  alt="Sesión de coaching"
                  fill
                  className="rounded-2xl object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-xl border border-black/10 bg-zinc-50 p-3">
                  <p className="font-semibold text-zinc-900">Elige por objetivo</p>
                  <p className="mt-1 text-sm text-zinc-600">Vida, carrera, liderazgo, pareja y más.</p>
                </div>
                <div className="rounded-xl border border-black/10 bg-zinc-50 p-3">
                  <p className="font-semibold text-zinc-900">Certificación visible</p>
                  <p className="mt-1 text-sm text-zinc-600">Mostramos distintivo cuando hay revisión documental.</p>
                </div>
              </div>
              <Link
                href="/coaches"
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Ver coaches ahora
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">Últimos perfiles añadidos</h2>
            <p className="mt-2 max-w-3xl text-zinc-700">
              Explora perfiles del directorio y elige por encaje (especialidad, modalidad y presupuesto).
            </p>
          </div>
          <Link
            href="/coaches"
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Ver todos
          </Link>
        </div>
        <LatestCoachesSlider coaches={latest} />
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Explora por tipo de coaching</h2>
          <p className="mt-3 text-zinc-700">
            Empieza por la especialidad y entra directamente al listado. Luego puedes afinar por modalidad y
            presupuesto.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {coachCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/coaches/categoria/${category.slug}`}
                className="rounded-2xl border border-black/10 bg-zinc-50 p-4 hover:bg-white"
              >
                <p className="font-semibold text-zinc-900">{category.name}</p>
                <p className="mt-1 text-sm text-zinc-600">{category.shortDescription}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Buscar por ciudad</h2>
          <p className="mt-3 text-zinc-700">
            Ideal si quieres presencial o prefieres un profesional con contexto local. Para online, puedes buscar en
            toda España.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {cities.map((city) => (
              <Link
                key={city.slug}
                href={`/coaches/ciudad/${city.slug}`}
                className="flex items-center justify-between rounded-2xl border border-black/10 bg-zinc-50 p-4 hover:bg-white"
              >
                <span className="font-semibold text-zinc-900">{city.name}</span>
                <span className="text-sm text-zinc-500">Ver</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
              Cómo saber si te conviene trabajar con un coach
            </h2>
            <p className="mt-3 text-zinc-700">
              Si te identificas con varios puntos, suele ayudarte a pasar de “pensarlo” a “hacerlo” con un plan y
              seguimiento.
            </p>
            <ul className="mt-5 grid gap-3">
              {[
                ["Te cuesta decidir", "Das vueltas a lo mismo, comparas opciones y te bloqueas."],
                ["Empiezas con fuerza y lo dejas", "Te falta un sistema realista para sostener el cambio."],
                ["Quieres mejorar, pero sin plan", "Objetivos difusos y sin prioridades ni pasos concretos."],
                ["Necesitas accountability", "Te ayuda un seguimiento periódico para avanzar."],
              ].map(([title, desc]) => (
                <li key={title} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                  <p className="font-semibold text-zinc-900">{title}</p>
                  <p className="mt-1 text-sm text-zinc-600">{desc}</p>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/coaches"
                className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Buscar coaches
              </Link>
              <Link
                href="/coaches/categoria/personal"
                className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Explorar especialidades
              </Link>
            </div>
          </div>

          <div className="relative rounded-2xl bg-zinc-100">
            <Image
              src="https://encuentratucoach.es/wp-content/uploads/2026/01/pexels-liza-summer-6382642.jpg"
              alt="Claridad y toma de decisiones"
              fill
              className="rounded-2xl object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
            <div className="min-h-72" />
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">Resolvemos tus FAQs</h2>
            <p className="mt-3 text-zinc-700">Respuestas directas para elegir con confianza.</p>
            <div className="mt-5 grid gap-3">
              {[
                "¿Cuánto cuesta una sesión de coaching en España?",
                "¿Funciona igual el coaching online que el presencial?",
                "¿Cómo sé si un coach está certificado?",
                "¿Cuánto dura un proceso de coaching?",
              ].map((question) => (
                <details key={question} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                  <summary className="cursor-pointer font-semibold text-zinc-900">{question}</summary>
                  <p className="mt-2 text-sm text-zinc-600">
                    Este bloque ya está preparado para conectarse al módulo de FAQs editable desde admin.
                  </p>
                </details>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-6">
            <h3 className="text-xl font-black tracking-tight text-zinc-950">¿Eres coach?</h3>
            <p className="mt-3 text-zinc-700">
              Únete con membresía mensual o anual. Sin comisiones por contacto: pagas tu cuota y mantienes tu perfil
              activo en el directorio.
            </p>
            <ul className="mt-5 grid gap-2 text-sm text-zinc-700">
              <li>Perfil público optimizado para SEO</li>
              <li>Filtros avanzados del directorio</li>
              <li>Reseñas y distintivo de certificación</li>
              <li>Métricas de visitas, retención y clics</li>
            </ul>
            <div className="mt-6 grid gap-3">
              <Link
                href="/membresia"
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Ver membresía
              </Link>
              <Link
                href="/registro/coach"
                className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-center text-sm font-semibold text-zinc-900"
              >
                Crear cuenta de coach
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

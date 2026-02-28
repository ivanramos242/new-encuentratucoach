import Image from "next/image";
import Link from "next/link";
import { LatestCoachesSlider } from "@/components/home/latest-coaches-slider";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { listPublicCoachesMerged } from "@/lib/public-coaches";

const quickSearchLinks = [
  { label: "Coach Madrid", href: "/coaches/ciudad/madrid" },
  { label: "Coach online", href: "/coaches/modalidad/online" },
  { label: "Coach profesional Madrid", href: "/coaches/ciudad/madrid" },
  { label: "Coach directivo Madrid", href: "/coaches/categoria/ejecutivo/madrid" },
  { label: "Coaching Madrid", href: "/coaches/ciudad/madrid" },
  { label: "Coaches certificados", href: "/coaches/certificados" },
];

const cityIntentLinks = [
  {
    title: "Busco coach Madrid",
    text: "Compara perfiles por especialidad, formato y precio en la ciudad con mayor demanda.",
    href: "/coaches/ciudad/madrid",
  },
  {
    title: "Busco coach Barcelona",
    text: "Encuentra opciones presenciales y online para carrera, liderazgo, pareja y coaching personal.",
    href: "/coaches/ciudad/barcelona",
  },
  {
    title: "Coach online en España",
    text: "Amplia la oferta sin limitarte por ciudad y filtra por certificacion y presupuesto.",
    href: "/coaches/modalidad/online",
  },
];

const categoryLinks = [
  { label: "Coaching personal", href: "/coaches/categoria/personal" },
  { label: "Coaching de carrera", href: "/coaches/categoria/carrera" },
  { label: "Coaching de liderazgo", href: "/coaches/categoria/liderazgo" },
  { label: "Coach directivo Madrid", href: "/coaches/categoria/ejecutivo/madrid" },
  { label: "Coaching de pareja", href: "/coaches/categoria/pareja" },
  { label: "Coaching bioemocional", href: "/coaches/categoria/bioemocional" },
];

const cityLinks = [
  { label: "Coach en Madrid", href: "/coaches/ciudad/madrid" },
  { label: "Coach en Barcelona", href: "/coaches/ciudad/barcelona" },
  { label: "Coach en Valencia", href: "/coaches/ciudad/valencia" },
  { label: "Coach en Sevilla", href: "/coaches/ciudad/sevilla" },
  { label: "Coach en Bilbao", href: "/coaches/ciudad/bilbao" },
  { label: "Coach en Malaga", href: "/coaches/ciudad/malaga" },
];

const faqItems = [
  {
    question: "Cuanto cuesta un coach en Madrid?",
    answer:
      "El rango habitual de coach madrid precio depende del nicho y experiencia. En el directorio puedes filtrar por presupuesto para encontrar una opcion ajustada.",
  },
  {
    question: "Busco coach barcelona: por donde empiezo?",
    answer:
      "Empieza por objetivo y modalidad. En la landing de Barcelona puedes comparar perfiles, resenas y disponibilidad para elegir mas rapido.",
  },
  {
    question: "Como encontrar coach profesional en Madrid sin perder tiempo?",
    answer:
      "Define tu objetivo en una frase, revisa especialidad y certificacion, y contacta 2 o 3 perfiles con un mensaje claro sobre tu caso.",
  },
  {
    question: "Es mejor coach online o presencial?",
    answer:
      "Coach online te da flexibilidad y mas oferta en España. Presencial es util si priorizas cercania local y sesiones en persona.",
  },
];

export async function HomePage() {
  const latest = [...(await listPublicCoachesMerged())]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 10);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Buscar coach en Madrid y online",
    url: "https://encuentratucoach.es/",
    description:
      "Directorio para buscar un coach en Madrid, Barcelona y toda España. Compara coach profesional, coach online y servicios de coaching por especialidad.",
    keywords:
      "coach madrid, buscar un coach, coach profesional madrid, coach online, busco coach, coach en madrid, mejor coach madrid, busco coach barcelona, encontrar coach, coach madrid precio, servicios de coaching madrid, buscar coach, coaching madrid, coach directivo madrid, coach profesional en madrid",
  };

  return (
    <>
      <JsonLd data={[faqSchema, webPageSchema]} />
      <PageShell className="pt-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(10,166,166,.18),transparent_36%),radial-gradient(circle_at_95%_10%,rgba(41,182,107,.14),transparent_35%),radial-gradient(circle_at_80%_100%,rgba(20,129,199,.12),transparent_40%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.15fr_.85fr]">
            <div>
              <p className="inline-flex flex-wrap items-center gap-2 rounded-full border border-black/10 bg-white/90 px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm">
                <span>Directorio de coaches en España</span>
                <span className="text-zinc-300">.</span>
                <span>busca por ciudad, tipo y formato</span>
              </p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">
                Buscar un coach en Madrid, Barcelona y online
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-700 sm:text-lg">
                Si dices <strong>busco coach</strong>, aqui puedes comparar rapido por especialidad, modalidad y
                presupuesto. Encuentra <strong>coach profesional madrid</strong>, <strong>coach online</strong> y
                perfiles certificados con contacto directo.
              </p>

              <form action="/coaches" className="mt-6 flex flex-col gap-3 sm:flex-row">
                <label className="flex flex-1 items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                  </svg>
                  <input
                    name="q"
                    className="w-full bg-transparent text-sm font-semibold text-zinc-900 outline-none placeholder:text-zinc-400"
                    placeholder="Ej: coach madrid, coach online, coach directivo madrid"
                    aria-label="Buscar coach por ciudad o especialidad"
                  />
                </label>
                <button className="rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:brightness-95">
                  Buscar coach
                </button>
              </form>

              <div className="mt-4 flex flex-wrap gap-2">
                {quickSearchLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-black/10 bg-white/90 p-3">
                  <p className="text-xs font-black uppercase tracking-wide text-zinc-500">Intento alto</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">Coach en Madrid y Barcelona</p>
                </div>
                <div className="rounded-2xl border border-black/10 bg-white/90 p-3">
                  <p className="text-xs font-black uppercase tracking-wide text-zinc-500">Comparacion</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">Coach madrid precio y servicios</p>
                </div>
                <div className="rounded-2xl border border-black/10 bg-white/90 p-3">
                  <p className="text-xs font-black uppercase tracking-wide text-zinc-500">Conversion</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">Contacto directo con el coach</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-black/10 bg-white/90 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-zinc-500">Eres coach?</p>
                    <p className="mt-1 text-sm text-zinc-700">
                      Activa tu perfil y aparece cuando alguien busca trabajar como coach online o presencial.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href="/membresia"
                      className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                    >
                      Ver membresia
                    </Link>
                    <Link
                      href="/plataformas-para-trabajar-como-coach"
                      className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                    >
                      Guia para coaches
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <aside className="rounded-[1.5rem] border border-black/10 bg-white/90 p-4 shadow-md">
              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <p className="text-sm font-black tracking-tight text-zinc-900">Busquedas top en esta home</p>
                <ul className="mt-3 grid gap-2 text-sm font-semibold text-zinc-700">
                  <li>
                    <Link href="/coaches/ciudad/madrid" className="hover:text-zinc-950">
                      coach madrid
                    </Link>
                  </li>
                  <li>
                    <Link href="/coaches/ciudad/madrid" className="hover:text-zinc-950">
                      coach profesional en madrid
                    </Link>
                  </li>
                  <li>
                    <Link href="/coaches/categoria/ejecutivo/madrid" className="hover:text-zinc-950">
                      coach directivo madrid
                    </Link>
                  </li>
                  <li>
                    <Link href="/coaches/modalidad/online" className="hover:text-zinc-950">
                      coach online
                    </Link>
                  </li>
                </ul>
                <div className="relative mt-4 aspect-[16/10] rounded-2xl bg-zinc-100">
                  <Image
                    src="https://encuentratucoach.es/wp-content/uploads/2026/01/pexels-tima-miroshnichenko-5336951.jpg"
                    alt="Sesion de coaching individual"
                    fill
                    className="rounded-2xl object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                </div>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-xl border border-black/10 bg-zinc-50 p-3">
                    <p className="font-semibold text-zinc-900">Coach madrid precio</p>
                    <p className="mt-1 text-sm text-zinc-600">Filtra por presupuesto y encuentra encaje real.</p>
                  </div>
                  <div className="rounded-xl border border-black/10 bg-zinc-50 p-3">
                    <p className="font-semibold text-zinc-900">Servicios de coaching madrid</p>
                    <p className="mt-1 text-sm text-zinc-600">Personal, carrera, liderazgo, pareja y mas.</p>
                  </div>
                </div>
                <Link
                  href="/coaches/ciudad/madrid"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Ver coach en Madrid
                </Link>
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">Ultimos coaches publicados</h2>
              <p className="mt-2 max-w-3xl text-zinc-700">
                Explora perfiles recientes y encuentra coach por ciudad, especialidad y modalidad.
              </p>
            </div>
            <Link
              href="/coaches"
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Ver todo el directorio
            </Link>
          </div>
          <LatestCoachesSlider coaches={latest} />
        </section>

        <section className="mt-12">
          <div className="mb-5">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
              Intenciones de busqueda con mas conversion
            </h2>
            <p className="mt-2 max-w-3xl text-zinc-700">
              Rutas directas para quien llega buscando un coach en Madrid, Barcelona o formato online.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {cityIntentLinks.map((item) => (
              <article key={item.title} className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black tracking-tight text-zinc-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-700">{item.text}</p>
                <Link
                  href={item.href}
                  className="mt-4 inline-flex rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Ver resultados
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">Buscar coach por especialidad</h2>
            <p className="mt-3 text-zinc-700">
              Empieza por el objetivo para encontrar coach profesional con mejor encaje desde la primera sesion.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {categoryLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm font-semibold text-zinc-900 hover:bg-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">Coaching Madrid y ciudades top</h2>
            <p className="mt-3 text-zinc-700">
              Si prefieres presencial, elige ciudad. Si quieres amplitud de oferta, combina con coach online.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {cityLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm font-semibold text-zinc-900 hover:bg-white"
                >
                  <span>{item.label}</span>
                  <span className="text-zinc-400">Ver</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
                Como elegir el mejor coach en Madrid
              </h2>
              <p className="mt-3 text-zinc-700">
                Para resolver consultas como <strong>mejor coach madrid</strong> o <strong>encontrar coach</strong>,
                usa este flujo rapido:
              </p>
              <ol className="mt-5 grid gap-3">
                <li className="rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-700">
                  <p className="font-semibold text-zinc-900">1. Define objetivo y contexto</p>
                  <p className="mt-1">Personal, carrera, coaching madrid o coach directivo madrid.</p>
                </li>
                <li className="rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-700">
                  <p className="font-semibold text-zinc-900">2. Compara modalidad y precio</p>
                  <p className="mt-1">Revisa formato online/presencial y el rango de coach madrid precio.</p>
                </li>
                <li className="rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-700">
                  <p className="font-semibold text-zinc-900">3. Contacta 2-3 perfiles</p>
                  <p className="mt-1">Pregunta por proceso, resultados esperados y siguiente paso concreto.</p>
                </li>
              </ol>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/coaches/ciudad/madrid"
                  className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Ver coaches en Madrid
                </Link>
                <Link
                  href="/coaches/modalidad/online"
                  className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                >
                  Ver coaches online
                </Link>
              </div>
            </div>

            <div className="relative rounded-2xl bg-zinc-100">
              <Image
                src="https://encuentratucoach.es/wp-content/uploads/2026/01/pexels-liza-summer-6382642.jpg"
                alt="Persona evaluando opciones de coaching"
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
              <h2 className="text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">FAQ para buscar coach</h2>
              <p className="mt-3 text-zinc-700">Respuestas directas para elegir con confianza y convertir antes.</p>
              <div className="mt-5 grid gap-3">
                {faqItems.map((item) => (
                  <details key={item.question} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                    <summary className="cursor-pointer font-semibold text-zinc-900">{item.question}</summary>
                    <p className="mt-2 text-sm text-zinc-600">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-6">
              <h3 className="text-xl font-black tracking-tight text-zinc-950">Canal para coaches (30%)</h3>
              <p className="mt-3 text-zinc-700">
                Si quieres trabajar como coach online y presencial, activa tu membresia y aparece en consultas de alta
                intencion como coach madrid y coach profesional en madrid.
              </p>
              <ul className="mt-5 grid gap-2 text-sm text-zinc-700">
                <li>Perfil publico optimizado por ciudad y categoria.</li>
                <li>Visibilidad en landings transaccionales.</li>
                <li>Sin comision por contacto.</li>
                <li>Resenas y senales de confianza.</li>
              </ul>
              <div className="mt-6 grid gap-3">
                <Link
                  href="/membresia"
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Ver membresia para coaches
                </Link>
                <Link
                  href="/conseguir-clientes-como-coach"
                  className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-center text-sm font-semibold text-zinc-900"
                >
                  Guia para conseguir clientes
                </Link>
              </div>
            </div>
          </div>
        </section>
      </PageShell>
    </>
  );
}

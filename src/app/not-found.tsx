import Link from "next/link";
import { faCompass, faHouse, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PageShell } from "@/components/layout/page-shell";

export default function NotFoundPage() {
  return (
    <PageShell className="pb-20 pt-10 sm:pt-14">
      <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm">
        <div className="grid gap-8 bg-[radial-gradient(circle_at_15%_0%,rgba(6,182,212,.16),transparent_42%),radial-gradient(circle_at_85%_10%,rgba(16,185,129,.14),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,1),rgba(248,250,252,.9))] p-6 sm:p-8 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-700">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Error 404
            </div>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">Página no encontrada</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-700">
              La URL que has abierto no existe o ya no está disponible. Puedes volver al inicio, explorar el directorio
              o buscar coaches por categoría.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                <FontAwesomeIcon icon={faHouse} className="mr-2 h-4 w-4" />
                Volver al inicio
              </Link>
              <Link
                href="/coaches"
                className="inline-flex items-center rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                <FontAwesomeIcon icon={faCompass} className="mr-2 h-4 w-4 text-zinc-500" />
                Explorar coaches
              </Link>
              <Link
                href="/pregunta-a-un-coach/buscar"
                className="inline-flex items-center rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-900 hover:bg-cyan-100"
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} className="mr-2 h-4 w-4" />
                Buscar preguntas
              </Link>
            </div>
          </div>

          <div className="grid content-start gap-4">
            <div className="rounded-3xl border border-black/10 bg-white/90 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Sugerencias</p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                <li>Revisa si la URL tiene algún error al escribirla.</li>
                <li>Usa el directorio para navegar por categoría o ciudad.</li>
                <li>Si venías desde un enlace interno, avísanos y lo corregimos.</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-dashed border-black/15 bg-zinc-50 p-5">
              <p className="text-sm font-semibold text-zinc-900">¿Necesitas ayuda?</p>
              <p className="mt-2 text-sm leading-6 text-zinc-700">
                Puedes escribirnos desde la página de contacto y revisamos el enlace roto.
              </p>
              <Link href="/contacto" className="mt-4 inline-flex text-sm font-semibold text-cyan-700 hover:text-cyan-800">
                Ir a contacto
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

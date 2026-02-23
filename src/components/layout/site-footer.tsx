import Link from "next/link";
import { Container } from "@/components/layout/container";
import { coachCategories, cities } from "@/lib/mock-data";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-black/5 bg-white">
      <Container className="grid gap-10 py-12 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <div className="inline-flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 font-black text-white">
              ET
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Directorio</p>
              <p className="text-lg font-black tracking-tight text-zinc-950">EncuentraTuCoach</p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-600">
            Plataforma SEO-first para encontrar coaches en España por especialidad, ciudad, modalidad y presupuesto.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-zinc-500">Navegación</h2>
          <ul className="mt-4 grid gap-2 text-sm">
            {[
              ["/", "Inicio"],
              ["/coaches", "Nuestros coaches"],
              ["/membresia", "Membresía"],
              ["/blog", "Blog"],
              ["/faqs", "FAQs"],
              ["/contacto", "Contacto"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-zinc-700 hover:text-zinc-950">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-zinc-500">Categorías</h2>
          <ul className="mt-4 grid gap-2 text-sm">
            {coachCategories.slice(0, 6).map((category) => (
              <li key={category.slug}>
                <Link href={`/coaches/categoria/${category.slug}`} className="text-zinc-700 hover:text-zinc-950">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-zinc-500">Ciudades</h2>
          <ul className="mt-4 grid gap-2 text-sm">
            {cities.slice(0, 6).map((city) => (
              <li key={city.slug}>
                <Link href={`/coaches/ciudad/${city.slug}`} className="text-zinc-700 hover:text-zinc-950">
                  Coaches en {city.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
      <div className="border-t border-black/5 py-4">
        <Container className="flex flex-col gap-2 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} EncuentraTuCoach. MVP foundation en Next.js.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/aviso-legal" className="hover:text-zinc-700">
              Aviso legal
            </Link>
            <Link href="/privacidad" className="hover:text-zinc-700">
              Privacidad
            </Link>
            <Link href="/cookies" className="hover:text-zinc-700">
              Cookies
            </Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}

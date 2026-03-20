import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoachCard } from "@/components/directory/coach-card";
import { FavoriteCoachButton } from "@/components/favorites/favorite-coach-button";
import { ContactCoachForm } from "@/components/forms/contact-coach-form";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { getCoachAverageRating, getCoachBySlug, getRelatedCoaches } from "@/lib/directory";
import { coachCategories, faqItems } from "@/lib/mock-data";
import { buildBreadcrumbList, buildMetadata, buildPersonSchema } from "@/lib/seo";
import { formatEuro } from "@/lib/utils";

type ParamsInput = Promise<{ coachSlug: string }>;

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { coachSlug } = await params;
  const coach = getCoachBySlug(coachSlug);
  if (!coach) {
    return buildMetadata({
      title: "Coach no encontrado",
      description: "Perfil no encontrado",
      path: `/coaches/${coachSlug}`,
      noindex: true,
    });
  }

  const primaryCategory = coachCategories.find((item) => item.slug === coach.categories[0])?.name ?? "coach";
  const cityName = coach.cityLabel.split(",")[0]?.trim() || "España";
  const sessionLabel =
    coach.sessionModes.length === 2
      ? "online y presenciales"
      : coach.sessionModes[0] === "online"
        ? "online"
        : "presenciales";

  return buildMetadata({
    title: `${coach.name} – ${primaryCategory} en ${cityName} | Sesiones ${sessionLabel}`,
    description: `Coach ${primaryCategory.toLowerCase()}. Desde ${formatEuro(coach.basePriceEur)}. ${sessionLabel}. Contacto directo y señales de confianza.`,
    path: `/coaches/${coach.slug}`,
  });
}

export default async function CoachProfilePage({ params }: { params: ParamsInput }) {
  const { coachSlug } = await params;
  const coach = getCoachBySlug(coachSlug);
  if (!coach) notFound();

  const rating = getCoachAverageRating(coach);
  const related = getRelatedCoaches(coach, 3);
  const categoryLabels = coach.categories.map(
    (slug) => coachCategories.find((item) => item.slug === slug)?.name ?? slug,
  );
  const cityName = coach.cityLabel.split(",")[0]?.trim() || coach.cityLabel;
  const coachPath = `/coaches/${coach.slug}`;
  const jsonLd = [
    buildBreadcrumbList([
      { name: "Inicio", path: "/" },
      { name: "Coaches", path: "/coaches" },
      { name: coach.name, path: coachPath },
    ]),
    buildPersonSchema({
      name: coach.name,
      description: coach.bio,
      path: coachPath,
      image: coach.heroImageUrl,
      sameAs: [coach.links.web, coach.links.linkedin, coach.links.instagram, coach.links.facebook].filter(Boolean),
      areaServed: [cityName, "España"],
      availableLanguage: coach.languages,
      knowsAbout: coach.specialties,
    }),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageShell className="pb-16 pt-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-zinc-600">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-cyan-700">
                Inicio
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/coaches" className="hover:text-cyan-700">
                Coaches
              </Link>
            </li>
            <li>/</li>
            <li className="font-semibold text-zinc-900">{coach.name}</li>
          </ol>
        </nav>

        <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm">
          <div className="grid gap-8 bg-[radial-gradient(circle_at_10%_0%,rgba(6,182,212,.10),transparent_38%),radial-gradient(circle_at_98%_10%,rgba(16,185,129,.10),transparent_34%)] p-6 lg:grid-cols-[1.1fr_.9fr] lg:p-8">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {categoryLabels.map((label) => (
                    <span
                      key={label}
                      className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-zinc-700"
                    >
                      {label}
                    </span>
                  ))}
                  {coach.certifiedStatus === "approved" ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                      Coach verificado
                    </span>
                  ) : null}
                </div>
                <FavoriteCoachButton coachProfileId={coach.id} />
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">
                {coach.name}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-700">{coach.headline}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MiniStat title="Precio" value={`${formatEuro(coach.basePriceEur)} / sesión`} />
                <MiniStat title="Modalidad" value={coach.sessionModes.join(" · ")} />
                <MiniStat title="Ciudad" value={coach.cityLabel} />
                <MiniStat title="Idiomas" value={coach.languages.join(", ")} />
              </div>

              <div className="mt-6 rounded-3xl border border-black/10 bg-zinc-50 p-5">
                <h2 className="text-xl font-black tracking-tight text-zinc-950">Sobre este coach</h2>
                <p className="mt-3 leading-7 text-zinc-700">{coach.bio}</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <InfoCard title="Especialidades" text={coach.specialties.join(", ")} />
                  <InfoCard
                    title="Valoración"
                    text={
                      rating > 0
                        ? `${rating.toFixed(1)} / 5 con ${coach.reviews.length} reseña${coach.reviews.length > 1 ? "s" : ""}`
                        : "Perfil todavía sin reseñas públicas."
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-zinc-100">
                <div className="relative aspect-[16/11]">
                  <Image
                    src={coach.heroImageUrl}
                    alt={`Imagen de ${coach.name}`}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 42vw"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-black/10 bg-white p-5">
                <h2 className="text-lg font-black tracking-tight text-zinc-950">Contacto rápido</h2>
                <div className="mt-4 grid gap-3">
                  {coach.links.whatsapp ? <ContactRow label="WhatsApp" value={coach.links.whatsapp} href={`https://wa.me/${coach.links.whatsapp.replace(/\D+/g, "")}`} /> : null}
                  {coach.links.email ? <ContactRow label="Email" value={coach.links.email} href={`mailto:${coach.links.email}`} /> : null}
                  {coach.links.phone ? <ContactRow label="Teléfono" value={coach.links.phone} href={`tel:${coach.links.phone}`} /> : null}
                  {coach.links.web ? <ContactRow label="Web" value={coach.links.web} href={coach.links.web} /> : null}
                </div>
              </div>

              <ContactCoachForm coachId={coach.id} coachName={coach.name} />
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">Precios y condiciones</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-700">
              {coach.pricingDetails.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">Preguntas frecuentes</h2>
            <div className="mt-4 space-y-4">
              {faqItems.slice(0, 3).map((faq) => (
                <article key={faq.id} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                  <h3 className="text-sm font-black tracking-tight text-zinc-950">{faq.question}</h3>
                  <div
                    className="mt-2 text-sm leading-6 text-zinc-700"
                    dangerouslySetInnerHTML={{ __html: faq.answerHtml }}
                  />
                </article>
              ))}
            </div>
          </div>
        </section>

        {related.length ? (
          <section className="mt-8 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-zinc-950">Coaches relacionados</h2>
                <p className="mt-1 text-sm text-zinc-700">Perfiles similares por especialidad y ubicación.</p>
              </div>
              <Link href="/coaches" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
                Ver directorio
              </Link>
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {related.map((item) => (
                <CoachCard key={item.id} coach={item} />
              ))}
            </div>
          </section>
        ) : null}
      </PageShell>
    </>
  );
}

function MiniStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</p>
      <p className="mt-1 text-base font-black tracking-tight text-zinc-950">{value}</p>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4">
      <h3 className="text-sm font-black tracking-tight text-zinc-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-700">{text}</p>
    </div>
  );
}

function ContactRow({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
    >
      <span>{label}</span>
      <span className="truncate text-right text-zinc-600">{value}</span>
    </Link>
  );
}

import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileAnalyticsTracker } from "@/components/analytics/profile-analytics-tracker";
import { CoachGalleryLightbox } from "@/components/coach/coach-gallery-lightbox";
import { CoachProfileActionPopups } from "@/components/coach/coach-profile-action-popups";
import { CoachCard } from "@/components/directory/coach-card";
import { ContactCoachForm } from "@/components/forms/contact-coach-form";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { getCoachAverageRating, getRelatedCoachesFrom } from "@/lib/directory";
import { getCoachCategoryLabel } from "@/lib/coach-category-catalog";
import { getPublicCoachBySlugMerged, listPublicCoachesMerged } from "@/lib/public-coaches";
import { buildMetadata } from "@/lib/seo";
import { formatEuro } from "@/lib/utils";

type ParamsInput = Promise<{ coachSlug: string }>;
type SearchParamsInput = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: ParamsInput;
  searchParams: SearchParamsInput;
}): Promise<Metadata> {
  const { coachSlug } = await params;
  const sp = await searchParams;
  const coach = await getPublicCoachBySlugMerged(coachSlug);
  if (!coach) return buildMetadata({ title: "Coach no encontrado", description: "Perfil no encontrado", noindex: true });
  const hasPopupVariant = sp.etc_popup != null || sp.etc_mail != null || sp.etc_err != null;

  return buildMetadata({
    title: `${coach.name} - ${coach.cityLabel}`,
    description: coach.headline,
    path: `/coaches/${coach.slug}`,
    noindex: hasPopupVariant,
  });
}

export default async function CoachProfilePage({ params }: { params: ParamsInput }) {
  const { coachSlug } = await params;
  const coach = await getPublicCoachBySlugMerged(coachSlug);
  if (!coach) notFound();

  const rating = getCoachAverageRating(coach);
  const related = getRelatedCoachesFrom(await listPublicCoachesMerged(), coach, 3);
  const categoryNames = coach.categories
    .map((slug) => getCoachCategoryLabel(slug) ?? slug)
    .join(", ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: coach.name,
    areaServed: "España",
    description: coach.bio,
    image: coach.heroImageUrl,
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/coaches/${coach.slug}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: coach.cityLabel.split(",")[0],
      addressCountry: "ES",
    },
    aggregateRating:
      rating > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(rating.toFixed(1)),
            reviewCount: coach.reviews.filter((review) => review.coachDecision === "approved").length,
          }
        : undefined,
  };
  const coachUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/coaches/${coach.slug}`;
  const seoJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/` },
          { "@type": "ListItem", position: 2, name: "Coaches", item: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/coaches` },
          { "@type": "ListItem", position: 3, name: coach.name, item: coachUrl },
        ],
      },
      {
        "@type": "ProfessionalService",
        name: coach.name,
        areaServed: "Espana",
        description: coach.bio,
        image: coach.heroImageUrl,
        url: coachUrl,
        address: {
          "@type": "PostalAddress",
          addressLocality: coach.cityLabel.split(",")[0],
          addressCountry: "ES",
        },
        sameAs: [coach.links.web, coach.links.linkedin, coach.links.instagram, coach.links.facebook].filter(Boolean),
        telephone: coach.links.phone,
        email: coach.links.email,
        knowsLanguage: coach.languages.length ? coach.languages : undefined,
        makesOffer:
          coach.basePriceEur > 0
            ? {
                "@type": "Offer",
                priceCurrency: "EUR",
                price: coach.basePriceEur,
              }
            : undefined,
        aggregateRating:
          rating > 0
            ? {
                "@type": "AggregateRating",
                ratingValue: Number(rating.toFixed(1)),
                reviewCount: coach.reviews.filter((review) => review.coachDecision === "approved").length,
              }
            : undefined,
      },
    ],
  };

  return (
    <>
      <ProfileAnalyticsTracker coachId={coach.id} />
      <JsonLd data={seoJsonLd ?? jsonLd} />

      <PageShell className="pt-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <section>
            <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
              <div className="relative aspect-[16/8] bg-zinc-100">
                <Image
                  src={coach.heroImageUrl}
                  alt={`Imagen de ${coach.name}`}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="flex flex-wrap gap-2">
                    {coach.categories.map((slug) => (
                      <span
                        key={slug}
                        className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur"
                      >
                        {getCoachCategoryLabel(slug) ?? slug}
                      </span>
                    ))}
                    {coach.certifiedStatus === "approved" ? (
                      <span className="rounded-full border border-white/20 bg-emerald-500/30 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                        Coach certificado
                      </span>
                    ) : null}
                  </div>
                  <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">{coach.name}</h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-white/90 sm:text-base">{coach.headline}</p>
                  <CoachProfileActionPopups coach={{ id: coach.id, name: coach.name, links: coach.links }} />
                </div>
              </div>

              <div className="border-t border-black/5 bg-white/80 px-4 py-3 sm:px-8">
                <nav className="flex gap-2 overflow-x-auto" aria-label="Secciones del perfil">
                  <a href="#inicio" className="rounded-full border border-black/10 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-800">Inicio</a>
                  <a href="#sobre-mi" className="rounded-full border border-black/10 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-800">Sobre mí</a>
                  <a href="#galeria" className="rounded-full border border-black/10 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-800">Galería</a>
                  <a href="#precios" className="rounded-full border border-black/10 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-800">Precios</a>
                  <a href="#resenas" className="rounded-full border border-black/10 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-800">Reseñas</a>
                </nav>
              </div>

              <div className="grid gap-8 p-6 sm:p-8" id="inicio">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard label="Precio" value={`${formatEuro(coach.basePriceEur)} / sesión`} />
                  <StatCard label="Modalidad" value={coach.sessionModes.join(" · ")} />
                  <StatCard label="Ubicación" value={coach.cityLabel} />
                  <StatCard label="Idiomas" value={coach.languages.join(", ")} />
                </div>

                <section id="sobre-mi">
                  <h2 className="text-xl font-black tracking-tight text-zinc-950">Sobre mí</h2>
                  {coach.aboutHtml ? (
                    <div
                      className="prose prose-zinc mt-3 max-w-none prose-a:text-cyan-700"
                      dangerouslySetInnerHTML={{ __html: coach.aboutHtml }}
                    />
                  ) : (
                    <p className="mt-3 leading-7 text-zinc-700">{coach.bio}</p>
                  )}
                  <div className="mt-4 rounded-2xl border border-black/10 bg-zinc-50 p-4">
                    <p className="text-sm font-black uppercase tracking-wide text-zinc-500">Primer paso recomendado</p>
                    <p className="mt-2 text-sm text-zinc-700">
                      “Mi objetivo es X. Ahora mismo estoy en Y. Mi mayor bloqueo es Z. ¿Cómo lo trabajaríamos?”
                    </p>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-zinc-500">Especialidades</p>
                    <p className="mt-1 text-zinc-800">{coach.specialties.join(", ")}</p>
                  </div>
                </section>

                <section id="galeria">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-black tracking-tight text-zinc-950">Galería</h2>
                    <span className="text-xs font-semibold text-zinc-500">Popup / lightbox</span>
                  </div>
                  <CoachGalleryLightbox coachName={coach.name} heroImageUrl={coach.heroImageUrl} galleryImageUrls={coach.galleryImageUrls} />
                </section>

                <section id="precios">
                  <h2 className="text-xl font-black tracking-tight text-zinc-950">Precios y condiciones</h2>
                  <div className="mt-3 rounded-2xl border border-black/10 bg-zinc-50 p-4">
                    <p className="text-lg font-black tracking-tight text-zinc-950">
                      {formatEuro(coach.basePriceEur)}
                      <span className="ml-1 text-sm font-semibold text-zinc-500">precio orientativo por sesión</span>
                    </p>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-700">
                      {coach.pricingDetails.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </section>

                <section id="resenas">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-black tracking-tight text-zinc-950">Reseñas</h2>
                    <Link
                      href={`/coaches/${coach.slug}#dejar-resena`}
                      className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                    >
                      Dejar una reseña
                    </Link>
                  </div>

                  {coach.reviews.filter((review) => review.coachDecision === "approved").length ? (
                    <div className="mt-4 grid gap-3">
                      {coach.reviews
                        .filter((review) => review.coachDecision === "approved")
                        .map((review) => (
                          <article key={review.id} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between gap-4">
                              <p className="font-semibold text-zinc-900">{review.authorName}</p>
                              <p className="text-sm font-semibold text-zinc-600">{review.rating.toFixed(1)} / 5</p>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-zinc-700">{review.body}</p>
                          </article>
                        ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-black/15 bg-zinc-50 p-4 text-sm text-zinc-700">
                      Este perfil todavía no tiene reseñas. Deja la primera aquí.
                    </div>
                  )}
                </section>
              </div>
            </div>

            <section className="mt-8">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-zinc-950">Últimos coaches destacados</h2>
                  <p className="mt-1 text-sm text-zinc-700">
                    Explora perfiles reales del directorio y elige por encaje.
                  </p>
                </div>
                <Link href="/coaches" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
                  Ver todos
                </Link>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {related.map((item) => (
                  <CoachCard key={item.id} coach={item} />
                ))}
              </div>
            </section>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:h-fit">
            <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Contacto rápido</h2>
              <p className="mt-2 text-sm text-zinc-700">Elige tu canal de contacto preferido o envía un mensaje.</p>
              <div className="mt-4 grid gap-2">
                {coach.links.whatsapp ? <ContactLink href={`https://wa.me/${coach.links.whatsapp}`} label="WhatsApp" /> : null}
                {coach.links.phone ? <ContactLink href={`tel:${coach.links.phone}`} label="Llamar" /> : null}
                {coach.links.email ? <ContactLink href={`mailto:${coach.links.email}`} label="Enviar email" /> : null}
                {coach.links.web ? <ContactLink href={coach.links.web} label="Web" external /> : null}
                {coach.links.linkedin ? <ContactLink href={coach.links.linkedin} label="LinkedIn" external /> : null}
                {coach.links.instagram ? <ContactLink href={coach.links.instagram} label="Instagram" external /> : null}
                {coach.links.facebook ? <ContactLink href={coach.links.facebook} label="Facebook" external /> : null}
              </div>
            </div>

            <ContactCoachForm coachId={coach.id} coachName={coach.name} />

            <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Estadísticas (coach)</h2>
              <p className="mt-2 text-sm text-zinc-700">
                Vista previa del módulo de métricas de V1: visitas, retención y clics en enlaces.
              </p>
              <dl className="mt-4 grid gap-3">
                <MetricLine label="Total de visitas" value={String(coach.metrics.totalViews)} />
                <MetricLine label="Tiempo de retención" value={`${coach.metrics.avgViewSeconds}s`} />
                <MetricLine
                  label="Clics en enlaces"
                  value={String(Object.values(coach.metrics.clicks).reduce((sum, value) => sum + value, 0))}
                />
              </dl>
            </div>

            <div className="rounded-3xl border border-black/10 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-5">
              <p className="text-sm font-black uppercase tracking-wide text-zinc-500">SEO y discoverability</p>
              <p className="mt-2 text-sm text-zinc-700">
                Este perfil genera metadata, JSON-LD y está preparado para trackear eventos de contacto y tiempo de
                lectura.
              </p>
              <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4">
                <p className="text-sm font-semibold text-zinc-900">Categorías indexables</p>
                <p className="mt-1 text-sm text-zinc-700">{categoryNames}</p>
              </div>
            </div>
          </aside>
        </div>
      </PageShell>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-black/10 bg-zinc-50 px-4 py-3">
      <dt className="text-sm text-zinc-700">{label}</dt>
      <dd className="text-sm font-black text-zinc-950">{value}</dd>
    </div>
  );
}

function ContactLink({ href, label, external = false }: { href: string; label: string; external?: boolean }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer noopener" : undefined}
      className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-white"
    >
      {label}
    </a>
  );
}

import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileAnalyticsTracker } from "@/components/analytics/profile-analytics-tracker";
import { CoachGalleryLightbox } from "@/components/coach/coach-gallery-lightbox";
import { CoachProfileActionPopups } from "@/components/coach/coach-profile-action-popups";
import { CoachProfileSectionNav } from "@/components/coach/coach-profile-section-nav";
import { CoachCard } from "@/components/directory/coach-card";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { getOptionalSessionUser } from "@/lib/auth-server";
import { getCoachCategoryLabel } from "@/lib/coach-category-catalog";
import { getCoachAverageRating, getRelatedCoachesFrom } from "@/lib/directory";
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

  const sessionUser = await getOptionalSessionUser();
  const canSeeCoachStats =
    sessionUser?.role === "admin" || (sessionUser?.role === "coach" && sessionUser.coachProfileId === coach.id);

  const rating = getCoachAverageRating(coach);
  const approvedReviews = coach.reviews.filter((review) => review.coachDecision === "approved");
  const related = getRelatedCoachesFrom(await listPublicCoachesMerged(), coach, 3);
  const categoryLabels = coach.categories.map((slug) => getCoachCategoryLabel(slug) ?? slug);
  const categoryNames = categoryLabels.join(", ");

  const coachUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/coaches/${coach.slug}`;
  const jsonLd = {
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
        areaServed: "Spain",
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
                reviewCount: approvedReviews.length,
              }
            : undefined,
      },
    ],
  };

  const leadBits = [
    categoryNames ? `Coaching de ${categoryNames}` : "",
    coach.cityLabel ? `en ${coach.cityLabel}` : "",
    coach.sessionModes.length ? `con sesiones ${coach.sessionModes.join(" y ")}` : "",
    coach.languages.length ? `en ${coach.languages.join(", ")}` : "",
  ].filter(Boolean);

  return (
    <>
      <ProfileAnalyticsTracker coachId={coach.id} />
      <JsonLd data={jsonLd} />

      <PageShell className="pt-6">
        <section id="inicio" className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm">
          <div className="grid gap-6 bg-[radial-gradient(circle_at_8%_0%,rgba(6,182,212,.10),transparent_38%),radial-gradient(circle_at_98%_10%,rgba(16,185,129,.10),transparent_36%)] p-5 sm:p-6 xl:grid-cols-[1.15fr_.85fr] xl:p-8">
            <div>
              <div className="flex items-center justify-between gap-3">
                <Link
                  href="/coaches"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white/90 text-zinc-900"
                  aria-label="Volver al directorio"
                >
                  <HeroIcon name="back" />
                </Link>
                <button
                  type="button"
                  data-etc-open-popup="share"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white/90 text-zinc-900"
                  aria-label="Compartir perfil"
                >
                  <HeroIcon name="share" />
                </button>
              </div>

              <p className="mt-4 text-sm font-semibold text-zinc-600">Encuentra • coach en España • online o presencial</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">{coach.name}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-700">{leadBits.join(" · ") || coach.headline}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {categoryLabels.map((label, index) => (
                  <span key={`${label}-${index}`} className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-zinc-800">
                    {label}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {coach.certifiedStatus === "approved" ? <Chip tone="success">Coach certificado</Chip> : null}
                {coach.sessionModes.map((mode) => (
                  <Chip key={mode}>{mode === "online" ? "Sesion Online" : "Sesion Presencial"}</Chip>
                ))}
                <Chip>{coach.cityLabel}</Chip>
                {coach.languages.length ? <Chip>{coach.languages.join(" y ")}</Chip> : null}
                <Chip>{coach.basePriceEur ? `Desde ${formatEuro(coach.basePriceEur)} · sesion` : "Precio a consultar"}</Chip>
              </div>

              <div className="mt-4 rounded-2xl border border-black/10 bg-zinc-50 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-3xl font-black tracking-tight text-zinc-900">
                    {rating > 0 ? rating.toFixed(1).replace(".", ",") : "Sin reseñas"}
                  </div>
                  {rating > 0 ? <div className="text-xl text-amber-500">★★★★★</div> : null}
                </div>
                <p className="mt-1 text-sm text-zinc-700">
                  {approvedReviews.length
                    ? `${rating.toFixed(1).replace(".", ",")} de 5 estrellas (basado en ${approvedReviews.length} reseña${approvedReviews.length > 1 ? "s" : ""})`
                    : "Este perfil todavía no tiene reseñas públicas"}
                </p>
              </div>

              <CoachProfileActionPopups coach={{ id: coach.id, name: coach.name, heroImageUrl: coach.heroImageUrl, headline: coach.headline, links: coach.links }} />

              <p className="mt-3 text-sm text-zinc-600">
                <Link href="/pregunta-a-un-coach" className="font-semibold text-cyan-700 hover:text-cyan-800">¿Tienes dudas? Pregunta a un coach</Link>
                <span> · </span>
                <Link href="/coaches" className="font-semibold text-cyan-700 hover:text-cyan-800">Ver más coaches</Link>
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-zinc-100">
                <div className="relative aspect-[16/10]">
                  <Image src={coach.heroImageUrl} alt={`Imagen de ${coach.name}`} fill className="object-cover" priority sizes="(max-width: 1279px) 100vw, 40vw" />
                </div>
                <div className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-black/35 text-white">
                  <HeroIcon name="zoom" />
                </div>
              </div>

              <div className="rounded-3xl border border-black/10 bg-white p-4">
                <h2 className="text-lg font-black tracking-tight text-zinc-950">Redes y contacto rápido</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {coach.links.whatsapp ? <ContactLink href={`https://wa.me/${coach.links.whatsapp.replace(/\D+/g, "")}`} label="WhatsApp" /> : null}
                  {coach.links.phone ? <ContactLink href={`tel:${coach.links.phone}`} label="Llamar" /> : null}
                  {coach.links.web ? <ContactLink href={coach.links.web} label="Web" external /> : null}
                  {coach.links.instagram ? <ContactLink href={coach.links.instagram} label="Instagram" external /> : null}
                  {coach.links.linkedin ? <ContactLink href={coach.links.linkedin} label="LinkedIn" external /> : null}
                  {coach.links.facebook ? <ContactLink href={coach.links.facebook} label="Facebook" external /> : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <CoachProfileSectionNav
          sections={[
            { id: "inicio", label: "Inicio" },
            { id: "sobre-mi", label: "Sobre Mi" },
            { id: "galeria", label: "Galería" },
            { id: "precios", label: "Precios" },
            { id: "resenas", label: "Reseñas" },
          ]}
        />

        <div className="mt-4 space-y-6">
          <section id="sobre-mi" className="scroll-mt-[calc(var(--site-header-offset,96px)+5rem)] rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">Sobre mi</h2>
            <div className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
              <div>
                {coach.aboutHtml ? (
                  <div className="prose prose-zinc max-w-none prose-a:text-cyan-700" dangerouslySetInnerHTML={{ __html: coach.aboutHtml }} />
                ) : (
                  <p className="leading-7 text-zinc-700">{coach.bio}</p>
                )}
              </div>
              <div className="space-y-3">
                <InfoCard title="Primer paso recomendado" text="Mi objetivo es X. Ahora mismo estoy en Y. Mi mayor bloqueo es Z. ¿Cómo lo trabajaríamos?" />
                <InfoCard title="Precio y condiciones" text={coach.basePriceEur ? `Desde ${formatEuro(coach.basePriceEur)} por sesión. Ver detalles en precios.` : "Consulta el precio y formato en la sección de precios."} />
                {coach.specialties.length ? <InfoCard title="Especialidades" text={coach.specialties.join(", ")} /> : null}
              </div>
            </div>
          </section>

          <section id="galeria" className="scroll-mt-[calc(var(--site-header-offset,96px)+5rem)] rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">Galería</h2>
            <CoachGalleryLightbox coachName={coach.name} heroImageUrl={coach.heroImageUrl} galleryImageUrls={coach.galleryImageUrls} />
          </section>

          <section id="precios" className="scroll-mt-[calc(var(--site-header-offset,96px)+5rem)] rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">Precios</h2>
            <div className="mt-4">
              <p className="text-4xl font-black tracking-tight text-zinc-900">
                {coach.basePriceEur ? formatEuro(coach.basePriceEur) : "Consultar"}
                <span className="ml-2 text-lg font-semibold text-zinc-500">precio orientativo por sesión</span>
              </p>
            </div>
            <div className="my-4 h-px bg-black/10" />
            {coach.pricingDetails.length ? (
              <div className="space-y-2 text-sm leading-6 text-zinc-700">
                {coach.pricingDetails.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-700">Contacta con el coach para confirmar importe, modalidad y duración.</p>
            )}
            <div className="my-4 h-px bg-black/10" />
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniCard title="Modalidad" value={coach.sessionModes.join(" · ") || "A consultar"} />
              <MiniCard title="Ubicación" value={coach.cityLabel} />
            </div>
          </section>

          <section id="resenas" className="scroll-mt-[calc(var(--site-header-offset,96px)+5rem)] rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">Reseñas</h2>
            <div className="mt-4 rounded-2xl border border-black/10 bg-zinc-50 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-3xl font-black tracking-tight text-zinc-900">
                    {rating > 0 ? rating.toFixed(1).replace(".", ",") : "Sin reseñas"}
                  </div>
                  {rating > 0 ? <div className="text-xl text-amber-500">★★★★★</div> : null}
                </div>
              <p className="mt-1 text-sm text-zinc-700">{approvedReviews.length ? `${rating.toFixed(1).replace(".", ",")} de 5 estrellas (basado en ${approvedReviews.length} reseña${approvedReviews.length > 1 ? "s" : ""})` : "Sin reseñas todavía"}</p>
            </div>

            <div className="my-4 h-px bg-black/10" />
            <h3 className="text-xl font-black tracking-tight text-zinc-950">Opiniones</h3>
            {approvedReviews.length ? (
              <div className="mt-3 grid gap-3">
                {approvedReviews.map((review) => (
                  <article key={review.id} className="rounded-2xl border border-black/10 bg-white p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold text-zinc-900">{review.authorName}</p>
                      <p className="text-sm font-semibold text-zinc-600">{review.rating.toFixed(1)} / 5</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-zinc-700">{review.body}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-black/15 bg-zinc-50 p-4 text-sm text-zinc-700">Este perfil todavía no tiene reseñas públicas.</div>
            )}

            <div className="my-4 h-px bg-black/10" />
            <h3 className="text-xl font-black tracking-tight text-zinc-950">Enviar mensaje</h3>
            <div className="mt-3 max-w-2xl">
              <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                <p className="text-sm leading-6 text-zinc-700">
                  Inicia una conversación privada con {coach.name} desde el inbox interno de la plataforma.
                </p>
                {sessionUser?.role === "coach" && sessionUser.coachProfileId === coach.id ? (
                  <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    Estás viendo tu propio perfil. El chat se usa para conversaciones cliente ↔ coach.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Link
                      href={`/mi-cuenta/cliente/mensajes/nuevo?coachSlug=${encodeURIComponent(coach.slug)}&source=${encodeURIComponent(`/coaches/${coach.slug}`)}`}
                      className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
                    >
                      {sessionUser?.role === "client" ? "Enviar mensaje por chat" : "Iniciar chat (login requerido)"}
                    </Link>
                    <p className="text-xs text-zinc-500">
                      Si no has iniciado sesión, te llevaremos a login y volverás aquí para abrir el chat.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {canSeeCoachStats ? (
            <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-2xl font-black tracking-tight text-zinc-950">Estadisticas del coach (privadas)</h2>
              <p className="mt-2 text-sm text-zinc-700">Solo visibles para administradores y para el propietario del perfil.</p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                <MetricLine label="Total de visitas" value={String(coach.metrics.totalViews)} />
                <MetricLine label="Tiempo medio" value={`${coach.metrics.avgViewSeconds}s`} />
                <MetricLine label="Clics en enlaces" value={String(Object.values(coach.metrics.clicks).reduce((sum, value) => sum + value, 0))} />
              </dl>
            </section>
          ) : null}

          {related.length ? (
            <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-zinc-950">Coaches relacionados</h2>
                  <p className="mt-1 text-sm text-zinc-700">Perfiles similares por encaje y especialidad.</p>
                </div>
                <Link href="/coaches" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">Ver todos</Link>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {related.map((item) => (
                  <CoachCard key={item.id} coach={item} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </PageShell>
    </>
  );
}

function Chip({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "success" }) {
  return (
    <span className={tone === "success" ? "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900" : "rounded-full border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-zinc-800"}>
      {children}
    </span>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
      <p className="font-semibold text-zinc-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-700">{text}</p>
    </div>
  );
}

function MiniCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
      <p className="text-sm font-black uppercase tracking-wide text-zinc-500">{title}</p>
      <p className="mt-2 text-xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">
      <dt className="text-sm text-zinc-700">{label}</dt>
      <dd className="mt-1 text-lg font-black text-zinc-950">{value}</dd>
    </div>
  );
}

function HeroIcon({ name }: { name: "back" | "share" | "zoom" }) {
  if (name === "back") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <path d="M14.5 5 8 12l6.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "share") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <path d="M12 16V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M7 8l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 14v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M21 21l-4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.5 7.8v5.4M7.8 10.5h5.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ContactLink({ href, label, external = false }: { href: string; label: string; external?: boolean }) {
  return (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer noopener" : undefined} className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-white">
      {label}
    </a>
  );
}

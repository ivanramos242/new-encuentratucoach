import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { sanitizeRichHtml } from "@/lib/html-sanitize";
import { getPublishedBlogPostBySlug } from "@/lib/blog-service";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getSiteBaseUrl } from "@/lib/site-config";

type ParamsInput = Promise<{ postSlug: string }>;

export const dynamic = "force-dynamic";

function compactSeoTitle(title: string) {
  const normalized = title.replace(/\s+/g, " ").trim();
  if (normalized.length <= 58) return normalized;

  const softBreaks = [" | ", " - ", ": ", " – "];
  for (const token of softBreaks) {
    const [head] = normalized.split(token);
    if (head && head.length >= 28 && head.length <= 58) return head.trim();
  }

  return `${normalized.slice(0, 55).trimEnd()}...`;
}

function compactSeoDescription(description: string) {
  const normalized = description.replace(/\s+/g, " ").trim();
  if (normalized.length <= 155) return normalized;
  return `${normalized.slice(0, 152).trimEnd()}...`;
}

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { postSlug } = await params;
  const post = await getPublishedBlogPostBySlug(postSlug);
  if (!post) {
    return buildMetadata({
      title: "Artículo no encontrado",
      description: "Artículo no encontrado",
      noindex: true,
    });
  }
  return buildMetadata({
    title: compactSeoTitle(post.seoTitle || post.title),
    description: compactSeoDescription(post.seoDescription || post.excerpt),
    path: `/blog/${post.slug}`,
    canonicalUrl: post.canonicalUrl || undefined,
    noindex: post.noindex,
    image: post.coverImageUrl,
    type: "article",
  });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(new Date(value));
}

type RecommendedLink = {
  href: string;
  label: string;
  helper: string;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildPrimaryConversionLink(input: { title: string; excerpt: string; category: string; tags: string[] }): RecommendedLink {
  const haystack = normalize([input.title, input.excerpt, input.category, ...input.tags].join(" "));

  const specialtyLinks: Array<{ keywords: string[]; href: string; label: string }> = [
    { keywords: ["carrera", "empleo", "profesional"], href: "/coaches/categoria/carrera", label: "Ver coaches de carrera" },
    { keywords: ["liderazgo", "directivo", "equipo"], href: "/coaches/categoria/liderazgo", label: "Ver coaches de liderazgo" },
    { keywords: ["personal", "habitos", "autoestima"], href: "/coaches/categoria/personal", label: "Ver coaches personales" },
    { keywords: ["pareja", "relacion"], href: "/coaches/categoria/pareja", label: "Ver coaches de pareja" },
    { keywords: ["ejecutivo"], href: "/coaches/categoria/ejecutivo", label: "Ver coaches ejecutivos" },
    { keywords: ["bioemocional", "emocional"], href: "/coaches/categoria/bioemocional", label: "Ver coaches bioemocionales" },
  ];

  const cityLinks: Array<{ keywords: string[]; href: string; label: string }> = [
    { keywords: ["madrid"], href: "/coaches/ciudad/madrid", label: "Ver coaches en Madrid" },
    { keywords: ["barcelona"], href: "/coaches/ciudad/barcelona", label: "Ver coaches en Barcelona" },
    { keywords: ["valencia"], href: "/coaches/ciudad/valencia", label: "Ver coaches en Valencia" },
    { keywords: ["sevilla"], href: "/coaches/ciudad/sevilla", label: "Ver coaches en Sevilla" },
    { keywords: ["bilbao"], href: "/coaches/ciudad/bilbao", label: "Ver coaches en Bilbao" },
    { keywords: ["malaga"], href: "/coaches/ciudad/malaga", label: "Ver coaches en Málaga" },
  ];

  for (const entry of cityLinks) {
    if (entry.keywords.some((keyword) => haystack.includes(keyword))) {
      return {
        href: entry.href,
        label: entry.label,
        helper: "Pasa a una página transaccional de ciudad y compara perfiles con disponibilidad real.",
      };
    }
  }

  for (const entry of specialtyLinks) {
    if (entry.keywords.some((keyword) => haystack.includes(keyword))) {
      return {
        href: entry.href,
        label: entry.label,
        helper: "Si ya tienes claro el tipo de proceso, compara perfiles de esa especialidad y prioriza el encaje.",
      };
    }
  }

  if (haystack.includes("online")) {
    return {
      href: "/coaches/modalidad/online",
      label: "Ver coaches online",
      helper: "Filtra por modalidad online y pasa de la lectura a una shortlist con opciones inmediatas.",
    };
  }

  if (haystack.includes("precio") || haystack.includes("coste") || haystack.includes("cuanto")) {
    return {
      href: "/pregunta-a-un-coach",
      label: "Preguntar a un coach",
      helper: "Si tu duda sigue siendo de ajuste o presupuesto, usa una consulta breve antes de contactar perfiles.",
    };
  }

  return {
    href: "/coaches",
    label: "Ver directorio de coaches",
    helper: "Pasa del contenido al directorio y compara perfiles por ciudad, objetivo y presupuesto.",
  };
}

export default async function BlogPostPage({ params }: { params: ParamsInput }) {
  const { postSlug } = await params;
  const post = await getPublishedBlogPostBySlug(postSlug);
  if (!post) notFound();
  const baseUrl = getSiteBaseUrl();
  const postPath = `/blog/${post.slug}`;
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: postPath },
  ]);
  const primaryLink = buildPrimaryConversionLink(post);

  return (
    <PageShell className="pt-8">
      <JsonLd data={breadcrumb} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          datePublished: post.publishedAt,
          dateModified: post.publishedAt,
          articleSection: post.category,
          keywords: post.tags.join(", "),
          image: post.coverImageUrl,
          mainEntityOfPage: { "@type": "WebPage", "@id": `${baseUrl}${postPath}` },
          publisher: {
            "@type": "Organization",
            name: "EncuentraTuCoach",
          },
        }}
      />
      <article className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
        <div className="relative aspect-[16/8] bg-zinc-100">
          <Image src={post.coverImageUrl} alt={post.title} fill className="object-cover" priority />
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-zinc-500">
            <span>{post.category}</span>
            <span>•</span>
            <span>{post.readingMinutes} min lectura</span>
            <span>•</span>
            <span>{formatDate(post.publishedAt)}</span>
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">{post.title}</h1>
          <p className="mt-3 text-lg text-zinc-700">{post.excerpt}</p>
          {post.tags.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-black/10 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          <div className="prose-lite mt-6 text-zinc-800" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(post.contentHtml) }} />
          <section className="mt-8 rounded-2xl border border-black/10 bg-zinc-50 p-5">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Siguiente paso recomendado</h2>
            <p className="mt-2 text-sm text-zinc-700">{primaryLink.helper}</p>
            <div className="mt-4">
              <Link href={primaryLink.href} className="inline-flex rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
                {primaryLink.label}
              </Link>
            </div>
          </section>
        </div>
      </article>
    </PageShell>
  );
}

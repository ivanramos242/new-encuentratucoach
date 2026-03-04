import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { PageShell } from "@/components/layout/page-shell";
import { sanitizeRichHtml } from "@/lib/html-sanitize";
import { getPublishedBlogPostBySlug } from "@/lib/blog-service";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getSiteBaseUrl } from "@/lib/site-config";

type ParamsInput = Promise<{ postSlug: string }>;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { postSlug } = await params;
  const post = await getPublishedBlogPostBySlug(postSlug);
  if (!post) {
    return buildMetadata({
      title: "Articulo no encontrado",
      description: "Articulo no encontrado",
      noindex: true,
    });
  }
  return buildMetadata({
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
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
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildRecommendedMoneyLinks(input: { title: string; excerpt: string; category: string; tags: string[] }): RecommendedLink[] {
  const haystack = normalize([input.title, input.excerpt, input.category, ...input.tags].join(" "));
  const links: RecommendedLink[] = [
    { href: "/coaches", label: "Ver directorio" },
    { href: "/coaches/modalidad/online", label: "Coaching online" },
    { href: "/coaches/certificados", label: "Coaches certificados" },
  ];

  const keywordToSpecialty: Array<{ keywords: string[]; href: string; label: string }> = [
    { keywords: ["carrera", "empleo", "profesional"], href: "/coaches/categoria/carrera", label: "Coaches de carrera" },
    { keywords: ["liderazgo", "directivo", "equipo"], href: "/coaches/categoria/liderazgo", label: "Coaches de liderazgo" },
    { keywords: ["personal", "habitos", "autoestima"], href: "/coaches/categoria/personal", label: "Coaching personal" },
    { keywords: ["pareja", "relacion"], href: "/coaches/categoria/pareja", label: "Coaches de pareja" },
    { keywords: ["deportivo", "rendimiento"], href: "/coaches/categoria/deportivo", label: "Coaches deportivos" },
    { keywords: ["ejecutivo"], href: "/coaches/categoria/ejecutivo", label: "Coaching ejecutivo" },
    { keywords: ["bioemocional", "emocional"], href: "/coaches/categoria/bioemocional", label: "Coaching bioemocional" },
  ];

  const keywordToCity: Array<{ keywords: string[]; href: string; label: string }> = [
    { keywords: ["madrid"], href: "/coaches/ciudad/madrid", label: "Coaches en Madrid" },
    { keywords: ["barcelona"], href: "/coaches/ciudad/barcelona", label: "Coaches en Barcelona" },
    { keywords: ["valencia"], href: "/coaches/ciudad/valencia", label: "Coaches en Valencia" },
    { keywords: ["sevilla"], href: "/coaches/ciudad/sevilla", label: "Coaches en Sevilla" },
    { keywords: ["bilbao"], href: "/coaches/ciudad/bilbao", label: "Coaches en Bilbao" },
    { keywords: ["malaga", "málaga"], href: "/coaches/ciudad/malaga", label: "Coaches en Málaga" },
  ];

  for (const entry of keywordToSpecialty) {
    if (entry.keywords.some((keyword) => haystack.includes(normalize(keyword)))) {
      links.push({ href: entry.href, label: entry.label });
      break;
    }
  }

  for (const entry of keywordToCity) {
    if (entry.keywords.some((keyword) => haystack.includes(normalize(keyword)))) {
      links.push({ href: entry.href, label: entry.label });
      break;
    }
  }

  return links
    .filter((link, index, arr) => arr.findIndex((item) => item.href === link.href) === index)
    .slice(0, 5);
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
  const recommendedLinks = buildRecommendedMoneyLinks(post);

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
            <p className="mt-2 text-sm text-zinc-700">
              Si ya tienes claro tu objetivo, pasa a una landing transaccional y compara perfiles con intención de contacto.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {recommendedLinks.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    index === 0
                      ? "rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                      : "rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </article>
    </PageShell>
  );
}

import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { PageShell } from "@/components/layout/page-shell";
import { sanitizeRichHtml } from "@/lib/html-sanitize";
import { getPublishedBlogPostBySlug } from "@/lib/blog-service";
import { buildMetadata } from "@/lib/seo";

type ParamsInput = Promise<{ postSlug: string }>;

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

export default async function BlogPostPage({ params }: { params: ParamsInput }) {
  const { postSlug } = await params;
  const post = await getPublishedBlogPostBySlug(postSlug);
  if (!post) notFound();

  return (
    <PageShell className="pt-8">
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
          mainEntityOfPage: { "@type": "WebPage", "@id": `/blog/${post.slug}` },
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
        </div>
      </article>
    </PageShell>
  );
}

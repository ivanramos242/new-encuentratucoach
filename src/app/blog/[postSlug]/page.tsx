import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { PageShell } from "@/components/layout/page-shell";
import { blogPosts } from "@/lib/mock-data";
import { buildMetadata } from "@/lib/seo";

type ParamsInput = Promise<{ postSlug: string }>;

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { postSlug } = await params;
  const post = blogPosts.find((item) => item.slug === postSlug);
  if (!post) return buildMetadata({ title: "Artículo no encontrado", description: "Artículo no encontrado", noindex: true });
  return buildMetadata({
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    path: `/blog/${post.slug}`,
  });
}

export default async function BlogPostPage({ params }: { params: ParamsInput }) {
  const { postSlug } = await params;
  const post = blogPosts.find((item) => item.slug === postSlug);
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
          articleSection: post.category,
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
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">{post.title}</h1>
          <p className="mt-3 text-lg text-zinc-700">{post.excerpt}</p>
          <div className="prose-lite mt-6 text-zinc-800" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
        </div>
      </article>
    </PageShell>
  );
}

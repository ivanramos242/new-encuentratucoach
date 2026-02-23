import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { blogPosts } from "@/lib/mock-data";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Blog",
  description: "Guías, comparativas y contenido SEO sobre coaching en España.",
  path: "/blog",
});

export default function BlogIndexPage() {
  return (
    <>
      <PageHero
        badge="Blog SEO de la plataforma"
        title="Blog de coaching en España"
        description="Guías y contenido evergreen para resolver dudas, comparar opciones y entender mejor el coaching."
      />
      <PageShell className="pt-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {blogPosts.map((post) => (
            <article key={post.id} className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
              <div className="relative aspect-[16/9] bg-zinc-100">
                <Image src={post.coverImageUrl} alt={post.title} fill className="object-cover" />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <span>{post.category}</span>
                  <span>{post.readingMinutes} min</span>
                </div>
                <h2 className="mt-3 text-xl font-black tracking-tight text-zinc-950">
                  <Link href={`/blog/${post.slug}`} className="hover:text-cyan-700">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-700">{post.excerpt}</p>
                <Link href={`/blog/${post.slug}`} className="mt-4 inline-flex text-sm font-semibold text-cyan-700 hover:text-cyan-800">
                  Leer artículo
                </Link>
              </div>
            </article>
          ))}
        </div>
      </PageShell>
    </>
  );
}

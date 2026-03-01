import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { listPublishedBlogPosts } from "@/lib/blog-service";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Blog",
  description: "Guias, comparativas y contenido SEO sobre coaching en España.",
  path: "/blog",
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(value));
}

export default async function BlogIndexPage() {
  const posts = await listPublishedBlogPosts();

  return (
    <>
      <PageHero
        badge="Blog SEO de la plataforma"
        title="Blog de coaching en España"
        description="Guias y contenido evergreen para resolver dudas, comparar opciones y entender mejor el coaching."
      />
      <PageShell className="pt-8">
        <section className="mb-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Atajos por intencion de busqueda</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/coaches" className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
              Buscar coaches
            </Link>
            <Link
              href="/coaches/modalidad/online"
              className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-white"
            >
              Coaching online
            </Link>
            <Link
              href="/coaches/certificados"
              className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-white"
            >
              Coaches certificados
            </Link>
            <Link
              href="/plataformas-para-trabajar-como-coach"
              className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-white"
            >
              Guia para coaches
            </Link>
          </div>
        </section>
        <div className="grid gap-6 lg:grid-cols-2">
          {posts.map((post) => (
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
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-500">{formatDate(post.publishedAt)}</span>
                  <Link href={`/blog/${post.slug}`} className="inline-flex text-sm font-semibold text-cyan-700 hover:text-cyan-800">
                    Leer articulo
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        {!posts.length ? (
          <section className="mt-6 rounded-3xl border border-black/10 bg-white p-6 text-sm text-zinc-700 shadow-sm">
            No hay articulos publicados todavia.
          </section>
        ) : null}
      </PageShell>
    </>
  );
}

import Link from "next/link";
import { listAdminBlogPosts } from "@/lib/blog-service";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

function seoScore(post: {
  title: string;
  excerpt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  isPublished: boolean;
}) {
  let score = 0;
  if (post.title.length >= 20 && post.title.length <= 70) score += 25;
  if ((post.excerpt || "").length >= 90) score += 20;
  if ((post.seoTitle || "").length >= 20 && (post.seoTitle || "").length <= 70) score += 30;
  if ((post.seoDescription || "").length >= 120 && (post.seoDescription || "").length <= 170) score += 25;
  if (!post.isPublished) score = Math.min(score, 80);
  return score;
}

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qRaw = typeof params.q === "string" ? params.q : "";
  const q = qRaw.trim().toLowerCase();
  const posts = await listAdminBlogPosts();
  const filtered = q
    ? posts.filter((post) => {
        return (
          post.title.toLowerCase().includes(q) ||
          post.slug.toLowerCase().includes(q) ||
          (post.categoryName || "").toLowerCase().includes(q)
        );
      })
    : posts;

  const publishedCount = posts.filter((item) => item.isPublished).length;
  const draftCount = posts.length - publishedCount;

  return (
    <>
      <PageHero
        badge="Admin Blog CMS"
        title="Gestor de blog SEO"
        description="Publica, edita y optimiza articulos con control editorial, metadata y arquitectura de contenidos."
      />
      <PageShell className="pt-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total posts" value={String(posts.length)} />
          <StatCard label="Publicados" value={String(publishedCount)} />
          <StatCard label="Borradores" value={String(draftCount)} />
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Accion</p>
            <Link
              href="/admin/blog/nuevo"
              className="mt-2 inline-flex rounded-xl bg-cyan-700 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
            >
              Nuevo articulo
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
          <form className="flex flex-wrap items-center gap-3">
            <input
              name="q"
              defaultValue={qRaw}
              placeholder="Buscar por titulo, slug o categoria"
              className="min-w-72 flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Buscar
            </button>
            <Link
              href="/admin/blog"
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Limpiar
            </Link>
          </form>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-3 py-2">Post</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Categoria</th>
                  <th className="px-3 py-2">SEO score</th>
                  <th className="px-3 py-2">Actualizado</th>
                  <th className="px-3 py-2">Publicado</th>
                  <th className="px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post) => (
                  <tr key={post.id} className="border-b border-black/5 align-top">
                    <td className="px-3 py-3">
                      <p className="font-semibold text-zinc-900">{post.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">/{post.slug}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          post.isPublished
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {post.isPublished ? "Publicado" : "Borrador"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-zinc-700">{post.categoryName || "General"}</td>
                    <td className="px-3 py-3">
                      <span className="font-semibold text-zinc-900">
                        {seoScore({
                          title: post.title,
                          excerpt: null,
                          seoTitle: post.seoTitle,
                          seoDescription: post.seoDescription,
                          isPublished: post.isPublished,
                        })}
                        /100
                      </span>
                    </td>
                    <td className="px-3 py-3 text-zinc-700">{formatDate(post.updatedAt)}</td>
                    <td className="px-3 py-3 text-zinc-700">{formatDate(post.publishedAt)}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/blog/${post.id}`}
                          className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
                        >
                          Editar
                        </Link>
                        <Link
                          href={`/blog/${post.slug}`}
                          className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
                        >
                          Ver
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-sm text-zinc-600">
                      No hay resultados para esa busqueda.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </PageShell>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-zinc-950">{value}</p>
    </div>
  );
}

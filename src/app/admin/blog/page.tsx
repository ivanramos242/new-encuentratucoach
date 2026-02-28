import Link from "next/link";
import { listAdminBlogPosts } from "@/lib/blog-service";
import { importWordpressBlogAction, publishBlogPostAction } from "@/app/admin/blog/actions";
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

function parseCount(value: string | string[] | undefined) {
  if (typeof value !== "string") return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
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
  const pendingCount = posts.length - publishedCount;

  const imported = params.imported === "1";
  const createdCount = parseCount(params.created);
  const updatedCount = parseCount(params.updated);
  const skippedCount = parseCount(params.skipped);
  const errorCount = parseCount(params.errors);
  const published = params.published === "1";
  const publishError = typeof params.publishError === "string" ? params.publishError : "";
  const importError = typeof params.importError === "string" ? params.importError : "";

  return (
    <>
      <PageHero
        badge="Admin Blog CMS"
        title="Gestor de blog SEO"
        description="Publica, edita y optimiza articulos con control editorial, metadata y arquitectura de contenidos."
      />
      <PageShell className="pt-8">
        {imported ? (
          <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Importacion completada. Creados: {createdCount}, actualizados: {updatedCount}, omitidos: {skippedCount},
            errores: {errorCount}.
          </p>
        ) : null}
        {published ? (
          <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Post publicado correctamente.
          </p>
        ) : null}
        {publishError ? (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {publishError === "not-found"
              ? "No se encontro el post para publicar."
              : "No se pudo publicar el post."}
          </p>
        ) : null}
        {importError ? (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {importError === "missing-path"
              ? "Debes indicar la ruta del archivo JSON."
              : importError === "unsafe-path"
                ? "La ruta indicada no esta dentro del proyecto."
                : importError === "file-not-found"
                  ? "No se encontro el archivo JSON indicado."
                  : importError === "invalid-json"
                    ? "El archivo no contiene JSON valido."
                    : importError === "invalid-export"
                      ? "El formato JSON no corresponde al export esperado de WordPress."
                      : importError === "empty"
                        ? "No se han encontrado posts de tipo 'post' en el archivo."
                        : "No se pudo completar la importacion."}
          </p>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total posts" value={String(posts.length)} />
          <StatCard label="Publicados" value={String(publishedCount)} />
          <StatCard label="Pendientes" value={String(pendingCount)} />
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
          <h2 className="text-lg font-black tracking-tight text-zinc-950">Importar blog desde WordPress</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Importa desde un archivo JSON de exportacion. Los posts se guardan como pendientes para revisarlos y
            publicarlos manualmente.
          </p>
          <form action={importWordpressBlogAction} className="mt-4 flex flex-wrap items-center gap-3">
            <input
              name="jsonPath"
              defaultValue="blog exportado de wp/blog-export.json"
              placeholder="Ruta relativa del JSON (ej: blog exportado de wp/blog-export.json)"
              className="min-w-72 flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Importar como pendiente
            </button>
          </form>
          <p className="mt-2 text-xs text-zinc-500">
            La ruta debe estar dentro de este proyecto. Ejemplo: <code>blog exportado de wp/blog-export.json</code>.
          </p>
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
                        {post.isPublished ? "Publicado" : "Pendiente"}
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
                        {post.isPublished ? (
                          <Link
                            href={`/blog/${post.slug}`}
                            className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
                          >
                            Ver
                          </Link>
                        ) : null}
                        {!post.isPublished ? (
                          <form action={publishBlogPostAction}>
                            <input type="hidden" name="postId" value={post.id} />
                            <button
                              type="submit"
                              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
                            >
                              Publicar
                            </button>
                          </form>
                        ) : null}
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

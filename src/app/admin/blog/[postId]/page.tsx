import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteBlogPostAction, saveBlogPostAction } from "@/app/admin/blog/actions";
import { BlogCoverUploadField } from "@/components/admin/blog-cover-upload-field";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { estimateReadingMinutesFromHtml } from "@/lib/blog-service";

type ParamsInput = Promise<{ postId: string }>;

function formatDateTimeLocal(value: Date | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function scoreSeo(input: { title: string; excerpt: string; seoTitle: string; seoDescription: string; contentHtml: string }) {
  const checks = [
    input.title.length >= 20 && input.title.length <= 70,
    input.excerpt.length >= 90,
    input.seoTitle.length >= 20 && input.seoTitle.length <= 70,
    input.seoDescription.length >= 120 && input.seoDescription.length <= 170,
    input.contentHtml.length >= 700,
  ];
  return checks.filter(Boolean).length * 20;
}

export default async function AdminBlogEditorPage({
  params,
  searchParams,
}: {
  params: ParamsInput;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { postId } = await params;
  const query = await searchParams;
  const isNew = postId === "nuevo";

  const [categories, postRaw] = await Promise.all([
    prisma.blogCategory.findMany({ orderBy: [{ name: "asc" }] }),
    isNew
      ? Promise.resolve(null)
      : prisma.blogPost.findUnique({
          where: { id: postId },
          include: {
            tags: { include: { blogTag: true } },
          },
        }),
  ]);

  if (!isNew && !postRaw) notFound();

  const override = postRaw
    ? await prisma.seoMetaOverride.findUnique({
        where: { routePath: `/blog/${postRaw.slug}` },
      })
    : null;

  const post = {
    id: postRaw?.id || "",
    title: postRaw?.title || "",
    slug: postRaw?.slug || "",
    excerpt: postRaw?.excerpt || "",
    contentHtml: postRaw?.contentHtml || "",
    coverImageUrl: postRaw?.coverImageUrl || "",
    categoryId: postRaw?.categoryId || "",
    seoTitle: postRaw?.seoTitle || "",
    seoDescription: postRaw?.seoDescription || "",
    isPublished: Boolean(postRaw?.isPublished),
    publishedAt: formatDateTimeLocal(postRaw?.publishedAt || null),
    tagsCsv: postRaw?.tags.map((tag) => tag.blogTag.name).join(", ") || "",
    canonicalUrl: override?.canonicalUrl || "",
    noindex: Boolean(override?.noindex),
  };

  const seoScore = scoreSeo({
    title: post.title,
    excerpt: post.excerpt,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    contentHtml: post.contentHtml,
  });
  const readingMinutes = estimateReadingMinutesFromHtml(post.contentHtml);
  const hasSaved = query.saved === "1";
  const errorCode = typeof query.error === "string" ? query.error : "";

  return (
    <>
      <PageHero
        badge="Admin Blog CMS"
        title={isNew ? "Nuevo articulo" : "Editar articulo"}
        description="Editor orientado a SEO tecnico y semantico: estructura, metadata, canonical y estado de indexacion."
      />
      <PageShell className="pt-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Link href="/admin/blog" className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50">
            Volver al listado
          </Link>
          {!isNew && post.slug ? (
            <Link href={`/blog/${post.slug}`} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50">
              Ver articulo
            </Link>
          ) : null}
        </div>

        {hasSaved ? (
          <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Articulo guardado correctamente.
          </p>
        ) : null}
        {errorCode ? (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {errorCode === "title"
              ? "El titulo debe tener al menos 8 caracteres."
              : errorCode === "content"
                ? "El contenido del articulo es demasiado corto."
                : "No se pudo guardar. Revisa los campos."}
          </p>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[1.5fr_.9fr]">
          <form action={saveBlogPostAction} className="space-y-4 rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
            <input type="hidden" name="postId" defaultValue={post.id} />

            <section className="grid gap-4">
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Contenido</h2>
              <label className="grid gap-1 text-sm font-medium text-zinc-800">
                Titulo
                <input
                  name="title"
                  required
                  maxLength={180}
                  defaultValue={post.title}
                  placeholder="Ej: Cuanto cuesta una sesion de coaching en Espana"
                  className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-zinc-800">
                Slug (URL)
                <input
                  name="slug"
                  defaultValue={post.slug}
                  placeholder="Se genera automaticamente si se deja vacio"
                  className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-zinc-800">
                Extracto
                <textarea
                  name="excerpt"
                  rows={3}
                  defaultValue={post.excerpt}
                  maxLength={300}
                  placeholder="Resumen para snippets y listado del blog"
                  className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-zinc-800">
                Contenido HTML
                <textarea
                  name="contentHtml"
                  required
                  rows={18}
                  defaultValue={post.contentHtml}
                  placeholder="<h2>Intro</h2><p>Contenido del articulo...</p>"
                  className="rounded-xl border border-black/10 px-3 py-2 font-mono text-xs outline-none focus:border-cyan-400"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-zinc-800">
                Imagen principal
                <BlogCoverUploadField initialUrl={post.coverImageUrl} />
              </label>
            </section>

            <section className="grid gap-4 border-t border-black/10 pt-4">
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Taxonomia</h2>
              <label className="grid gap-1 text-sm font-medium text-zinc-800">
                Categoria existente
                <select
                  name="categoryId"
                  defaultValue={post.categoryId}
                  className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
                >
                  <option value="">General</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-medium text-zinc-800">
                Nueva categoria (opcional)
                <input
                  name="categoryName"
                  placeholder="Ej: Coaching Ejecutivo"
                  className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-zinc-800">
                Tags (separados por coma)
                <input
                  name="tagsCsv"
                  defaultValue={post.tagsCsv}
                  placeholder="coaching, precios, liderazgo"
                  className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
                />
              </label>
            </section>

            <section className="grid gap-4 border-t border-black/10 pt-4">
              <h2 className="text-lg font-black tracking-tight text-zinc-950">SEO</h2>
              <label className="grid gap-1 text-sm font-medium text-zinc-800">
                SEO title (recomendado 20-70)
                <input
                  name="seoTitle"
                  defaultValue={post.seoTitle}
                  maxLength={70}
                  className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-zinc-800">
                SEO description (recomendado 120-170)
                <textarea
                  name="seoDescription"
                  rows={3}
                  defaultValue={post.seoDescription}
                  maxLength={170}
                  className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-zinc-800">
                Canonical URL (opcional)
                <input
                  name="canonicalUrl"
                  defaultValue={post.canonicalUrl}
                  placeholder="https://encuentratucoach.es/blog/tu-articulo"
                  className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
                />
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-zinc-800">
                <input type="checkbox" name="noindex" defaultChecked={post.noindex} />
                Marcar como noindex
              </label>
            </section>

            <section className="grid gap-4 border-t border-black/10 pt-4">
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Publicacion</h2>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-zinc-800">
                <input type="checkbox" name="isPublished" defaultChecked={post.isPublished} />
                Publicar articulo
              </label>
              <label className="grid gap-1 text-sm font-medium text-zinc-800">
                Fecha de publicacion
                <input
                  type="datetime-local"
                  name="publishedAt"
                  defaultValue={post.publishedAt}
                  className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
                />
              </label>
            </section>

            <div className="flex flex-wrap gap-3 border-t border-black/10 pt-4">
              <button
                type="submit"
                className="rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
              >
                Guardar articulo
              </button>
              <Link
                href="/admin/blog"
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Cancelar
              </Link>
            </div>
          </form>

          <aside className="space-y-4">
            <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
              <h3 className="text-base font-black tracking-tight text-zinc-950">Panel SEO</h3>
              <p className="mt-2 text-sm text-zinc-700">Puntuacion estimada de calidad on-page.</p>
              <p className="mt-3 text-3xl font-black tracking-tight text-zinc-950">{seoScore}/100</p>
              <ul className="mt-3 grid gap-2 text-sm text-zinc-700">
                <li>Titulo: {post.title.length} caracteres</li>
                <li>Meta titulo: {post.seoTitle.length} caracteres</li>
                <li>Meta descripcion: {post.seoDescription.length} caracteres</li>
                <li>Lectura estimada: {readingMinutes} min</li>
              </ul>
            </section>

            <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
              <h3 className="text-base font-black tracking-tight text-zinc-950">Checklist SEO</h3>
              <ul className="mt-3 grid gap-2 text-sm text-zinc-700">
                <li>Usa una keyword principal al inicio del titulo.</li>
                <li>Incluye H2/H3 con variantes semanticas.</li>
                <li>Agrega enlaces internos a categorias y perfiles.</li>
                <li>Incluye FAQ o seccion de preguntas en el contenido.</li>
                <li>Evita contenido duplicado y define canonical si aplica.</li>
              </ul>
            </section>

            {!isNew ? (
              <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
                <h3 className="text-base font-black tracking-tight text-rose-900">Zona de borrado</h3>
                <p className="mt-2 text-sm text-rose-800">Esta accion elimina el post y su metadata SEO asociada.</p>
                <form action={deleteBlogPostAction} className="mt-3">
                  <input type="hidden" name="postId" value={post.id} />
                  <button
                    type="submit"
                    className="rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
                  >
                    Eliminar articulo
                  </button>
                </form>
              </section>
            ) : null}
          </aside>
        </div>
      </PageShell>
    </>
  );
}

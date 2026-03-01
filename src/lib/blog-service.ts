import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PublicBlogPostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  coverImageUrl: string;
  publishedAt: string;
  readingMinutes: number;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type PublicBlogPostDetail = PublicBlogPostSummary & {
  contentHtml: string;
  tags: string[];
  canonicalUrl: string | null;
  noindex: boolean;
};

export type AdminBlogPostListItem = {
  id: string;
  slug: string;
  title: string;
  isPublished: boolean;
  publishedAt: string | null;
  updatedAt: string;
  categoryName: string | null;
  tagsCount: number;
  seoTitle: string | null;
  seoDescription: string | null;
};

type DbPostWithRelations = Prisma.BlogPostGetPayload<{
  include: {
    category: { select: { name: true } };
    tags: { include: { blogTag: { select: { name: true } } } };
  };
}>;

function isMissingBlogTablesError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021" &&
    typeof error.meta?.modelName === "string" &&
    ["BlogPost", "BlogCategory", "BlogTag", "BlogPostTag", "SeoMetaOverride"].includes(error.meta.modelName)
  );
}

function stripHtml(input: string) {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function estimateReadingMinutesFromHtml(contentHtml: string | null | undefined) {
  const text = stripHtml(contentHtml ?? "");
  if (!text) return 1;
  const words = text.split(" ").filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function mapDbPostToPublic(post: DbPostWithRelations, override?: { canonicalUrl: string | null; noindex: boolean } | null): PublicBlogPostDetail {
  const excerpt =
    (post.excerpt || "").trim() || stripHtml(post.contentHtml || "").slice(0, 180) || "Articulo del blog";
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt,
    category: post.category?.name || "General",
    coverImageUrl: post.coverImageUrl || "/favicon.png",
    publishedAt: (post.publishedAt || post.createdAt).toISOString(),
    readingMinutes: estimateReadingMinutesFromHtml(post.contentHtml),
    contentHtml: post.contentHtml || "<p>Contenido no disponible.</p>",
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    tags: post.tags.map((item) => item.blogTag.name),
    canonicalUrl: override?.canonicalUrl ?? null,
    noindex: Boolean(override?.noindex),
  };
}

export async function listPublishedBlogPosts(limit = 60): Promise<PublicBlogPostSummary[]> {
  try {
    const rows = await prisma.blogPost.findMany({
      where: {
        isPublished: true,
        OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
      },
      include: { category: { select: { name: true } } },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return rows.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt:
        (post.excerpt || "").trim() || stripHtml(post.contentHtml || "").slice(0, 180) || "Articulo del blog",
      category: post.category?.name || "General",
      coverImageUrl: post.coverImageUrl || "/favicon.png",
      publishedAt: (post.publishedAt || post.createdAt).toISOString(),
      readingMinutes: estimateReadingMinutesFromHtml(post.contentHtml),
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
    }));
  } catch (error) {
    if (isMissingBlogTablesError(error)) return [];
    throw error;
  }
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<PublicBlogPostDetail | null> {
  try {
    const post = await prisma.blogPost.findFirst({
      where: {
        slug,
        isPublished: true,
        OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
      },
      include: {
        category: { select: { name: true } },
        tags: { include: { blogTag: { select: { name: true } } } },
      },
    });
    if (!post) return null;

    const override = await prisma.seoMetaOverride.findUnique({
      where: { routePath: `/blog/${slug}` },
      select: { canonicalUrl: true, noindex: true },
    });
    return mapDbPostToPublic(post, override);
  } catch (error) {
    if (isMissingBlogTablesError(error)) return null;
    throw error;
  }
}

export async function listAdminBlogPosts(): Promise<AdminBlogPostListItem[]> {
  try {
    const rows = await prisma.blogPost.findMany({
      include: {
        category: { select: { name: true } },
        tags: { select: { blogTagId: true } },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 500,
    });
    return rows.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      isPublished: post.isPublished,
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
      updatedAt: post.updatedAt.toISOString(),
      categoryName: post.category?.name ?? null,
      tagsCount: post.tags.length,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
    }));
  } catch (error) {
    if (isMissingBlogTablesError(error)) return [];
    throw error;
  }
}

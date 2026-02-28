"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sanitizeRichHtml } from "@/lib/html-sanitize";
import { slugify } from "@/lib/utils";

function getString(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function getBool(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function parseDateTimeLocal(input: string): Date | null {
  if (!input) return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function makeExcerpt(excerpt: string, contentHtml: string) {
  if (excerpt) return excerpt.slice(0, 300);
  const plain = contentHtml
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.slice(0, 180);
}

async function uniquePostSlug(base: string, exceptId?: string) {
  const normalized = slugify(base) || "post";
  let slug = normalized;
  let i = 2;
  while (true) {
    const existing = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === exceptId) return slug;
    slug = `${normalized}-${i++}`;
  }
}

function parseTagsCsv(tagsCsv: string) {
  return Array.from(
    new Set(
      tagsCsv
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item.slice(0, 60)),
    ),
  ).slice(0, 20);
}

type WpExportTerm = {
  name?: unknown;
  slug?: unknown;
};

type WpExportPostPayload = {
  ID?: unknown;
  post_type?: unknown;
  post_title?: unknown;
  post_name?: unknown;
  post_content?: unknown;
  post_excerpt?: unknown;
  permalink?: unknown;
  post_status?: unknown;
};

type WpExportPostEntry = {
  post?: WpExportPostPayload;
  taxonomies?: {
    category?: WpExportTerm[];
    post_tag?: WpExportTerm[];
  };
  featured_image?: {
    url?: unknown;
    guid?: unknown;
  };
  meta_raw?: Record<string, unknown>;
};

type WpExportFile = {
  posts: WpExportPostEntry[];
};

function toPlainString(input: unknown) {
  if (typeof input !== "string") return "";
  return input.trim();
}

function maybeRepairMojibake(input: string) {
  if (!input || !/[ÃÂ]/.test(input)) return input;
  try {
    const repaired = Buffer.from(input, "latin1").toString("utf8");
    if (repaired.includes("\uFFFD")) return input;
    return repaired;
  } catch {
    return input;
  }
}

function cleanText(input: unknown) {
  return maybeRepairMojibake(toPlainString(input));
}

function getMetaFirstString(metaRaw: Record<string, unknown> | undefined, key: string) {
  const value = metaRaw?.[key];
  if (typeof value === "string") return cleanText(value);
  if (!Array.isArray(value)) return "";
  const first = value[0];
  return typeof first === "string" ? cleanText(first) : "";
}

function isWpExportFile(input: unknown): input is WpExportFile {
  return Boolean(input) && typeof input === "object" && Array.isArray((input as WpExportFile).posts);
}

function resolveImportPath(inputPath: string) {
  const root = path.resolve(process.cwd());
  const resolved = path.resolve(root, inputPath);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("unsafe_path");
  }
  return resolved;
}

export async function saveBlogPostAction(formData: FormData) {
  const postId = getString(formData, "postId");
  const title = getString(formData, "title").slice(0, 180);
  const inputSlug = getString(formData, "slug");
  const excerpt = getString(formData, "excerpt");
  const contentHtml = sanitizeRichHtml(getString(formData, "contentHtml"));
  const coverImageUrl = getString(formData, "coverImageUrl").slice(0, 500);
  const categoryId = getString(formData, "categoryId");
  const categoryName = getString(formData, "categoryName").slice(0, 80);
  const seoTitle = getString(formData, "seoTitle").slice(0, 70);
  const seoDescription = getString(formData, "seoDescription").slice(0, 170);
  const tagsCsv = getString(formData, "tagsCsv");
  const canonicalUrl = getString(formData, "canonicalUrl").slice(0, 500);
  const noindex = getBool(formData, "noindex");
  const isPublished = getBool(formData, "isPublished");
  const publishedAtInput = getString(formData, "publishedAt");

  if (!title || title.length < 8) {
    redirect(`/admin/blog/${postId || "nuevo"}?error=title`);
  }
  if (!contentHtml || contentHtml.length < 60) {
    redirect(`/admin/blog/${postId || "nuevo"}?error=content`);
  }

  const finalSlug = await uniquePostSlug(inputSlug || title, postId || undefined);
  const parsedDate = parseDateTimeLocal(publishedAtInput);
  const publishedAt = isPublished ? parsedDate || new Date() : null;
  const finalExcerpt = makeExcerpt(excerpt, contentHtml);
  const tags = parseTagsCsv(tagsCsv);

  const result = await prisma.$transaction(async (tx) => {
    const oldPost = postId
      ? await tx.blogPost.findUnique({ where: { id: postId }, select: { id: true, slug: true } })
      : null;

    if (postId && !oldPost) {
      throw new Error("post_not_found");
    }

    let finalCategoryId: string | null = categoryId || null;
    if (!finalCategoryId && categoryName) {
      const categorySlug = slugify(categoryName) || "general";
      const category = await tx.blogCategory.upsert({
        where: { slug: categorySlug },
        create: { slug: categorySlug, name: categoryName },
        update: { name: categoryName },
        select: { id: true },
      });
      finalCategoryId = category.id;
    }

    const post = postId
      ? await tx.blogPost.update({
          where: { id: postId },
          data: {
            slug: finalSlug,
            title,
            excerpt: finalExcerpt || null,
            contentHtml,
            seoTitle: seoTitle || null,
            seoDescription: seoDescription || null,
            coverImageUrl: coverImageUrl || null,
            isPublished,
            publishedAt,
            categoryId: finalCategoryId,
          },
          select: { id: true, slug: true },
        })
      : await tx.blogPost.create({
          data: {
            slug: finalSlug,
            title,
            excerpt: finalExcerpt || null,
            contentHtml,
            seoTitle: seoTitle || null,
            seoDescription: seoDescription || null,
            coverImageUrl: coverImageUrl || null,
            isPublished,
            publishedAt,
            categoryId: finalCategoryId,
          },
          select: { id: true, slug: true },
        });

    const tagIds: string[] = [];
    for (const tagName of tags) {
      const tagSlug = slugify(tagName) || "tag";
      const tag = await tx.blogTag.upsert({
        where: { slug: tagSlug },
        create: { slug: tagSlug, name: tagName },
        update: { name: tagName },
        select: { id: true },
      });
      tagIds.push(tag.id);
    }

    await tx.blogPostTag.deleteMany({ where: { blogPostId: post.id } });
    if (tagIds.length) {
      await tx.blogPostTag.createMany({
        data: tagIds.map((blogTagId) => ({ blogPostId: post.id, blogTagId })),
        skipDuplicates: true,
      });
    }

    const routePath = `/blog/${post.slug}`;
    if (seoTitle || seoDescription || canonicalUrl || noindex) {
      await tx.seoMetaOverride.upsert({
        where: { routePath },
        create: {
          routePath,
          metaTitle: seoTitle || null,
          metaDescription: seoDescription || null,
          canonicalUrl: canonicalUrl || null,
          noindex,
        },
        update: {
          metaTitle: seoTitle || null,
          metaDescription: seoDescription || null,
          canonicalUrl: canonicalUrl || null,
          noindex,
        },
      });
    } else {
      await tx.seoMetaOverride.deleteMany({ where: { routePath } });
    }

    if (oldPost && oldPost.slug !== post.slug) {
      await tx.seoMetaOverride.deleteMany({ where: { routePath: `/blog/${oldPost.slug}` } });
    }

    return post;
  });

  revalidatePath("/blog");
  revalidatePath(`/blog/${result.slug}`);
  revalidatePath("/admin/blog");
  redirect(`/admin/blog/${result.id}?saved=1`);
}

export async function deleteBlogPostAction(formData: FormData) {
  const postId = getString(formData, "postId");
  if (!postId) redirect("/admin/blog?error=missing-post-id");

  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: { id: true, slug: true },
  });
  if (!post) redirect("/admin/blog?error=not-found");

  await prisma.$transaction(async (tx) => {
    await tx.blogPost.delete({ where: { id: post.id } });
    await tx.seoMetaOverride.deleteMany({ where: { routePath: `/blog/${post.slug}` } });
  });

  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/admin/blog");
  redirect("/admin/blog?deleted=1");
}

export async function publishBlogPostAction(formData: FormData) {
  const postId = getString(formData, "postId");
  if (!postId) redirect("/admin/blog?publishError=missing-post-id");

  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: { id: true, slug: true, publishedAt: true },
  });
  if (!post) redirect("/admin/blog?publishError=not-found");

  await prisma.blogPost.update({
    where: { id: post.id },
    data: {
      isPublished: true,
      publishedAt: post.publishedAt ?? new Date(),
    },
  });

  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/admin/blog");
  redirect("/admin/blog?published=1");
}

export async function importWordpressBlogAction(formData: FormData) {
  const jsonPathInput = getString(formData, "jsonPath");
  if (!jsonPathInput) redirect("/admin/blog?importError=missing-path");

  let filePath = "";
  try {
    filePath = resolveImportPath(jsonPathInput);
  } catch {
    redirect("/admin/blog?importError=unsafe-path");
  }

  let fileRaw = "";
  try {
    fileRaw = await fs.readFile(filePath, "utf8");
  } catch {
    redirect("/admin/blog?importError=file-not-found");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fileRaw);
  } catch {
    redirect("/admin/blog?importError=invalid-json");
  }

  if (!isWpExportFile(parsed)) {
    redirect("/admin/blog?importError=invalid-export");
  }

  const sourcePosts = parsed.posts.filter((entry) => entry?.post?.post_type === "post");
  if (!sourcePosts.length) {
    redirect("/admin/blog?importError=empty");
  }

  const summary = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  for (const item of sourcePosts) {
    const post = item.post;
    if (!post) {
      summary.skipped += 1;
      continue;
    }

    try {
      const sourceIdRaw = post.ID;
      const sourceId =
        typeof sourceIdRaw === "number"
          ? String(sourceIdRaw)
          : typeof sourceIdRaw === "string"
            ? sourceIdRaw.trim()
            : "";

      const title = cleanText(post.post_title).slice(0, 180);
      const inputSlug = cleanText(post.post_name);
      const contentHtml = sanitizeRichHtml(cleanText(post.post_content));
      const excerpt = cleanText(post.post_excerpt);
      if (!title || !contentHtml) {
        summary.skipped += 1;
        continue;
      }

      const fallbackSlug = sourceId ? `wp-post-${sourceId}` : "wp-post";
      const baseSlug = slugify(inputSlug || title || fallbackSlug) || fallbackSlug;
      const finalExcerpt = makeExcerpt(excerpt, contentHtml);

      let categoryId: string | null = null;
      const firstCategory = Array.isArray(item.taxonomies?.category) ? item.taxonomies.category[0] : undefined;
      if (firstCategory) {
        const categoryName = cleanText(firstCategory.name).slice(0, 80);
        const categorySlug = slugify(cleanText(firstCategory.slug) || categoryName) || "general";
        const category = await prisma.blogCategory.upsert({
          where: { slug: categorySlug },
          create: {
            slug: categorySlug,
            name: categoryName || "General",
          },
          update: {
            name: categoryName || "General",
          },
          select: { id: true },
        });
        categoryId = category.id;
      }

      const seoTitle = getMetaFirstString(item.meta_raw, "rank_math_title").slice(0, 70);
      const seoDescription = getMetaFirstString(item.meta_raw, "rank_math_description").slice(0, 170);
      const canonicalUrl = cleanText(post.permalink).slice(0, 500);
      const coverImageUrl = cleanText(item.featured_image?.url || item.featured_image?.guid).slice(0, 500);

      let existingBySourceId: { targetId: string } | null = null;
      if (sourceId) {
        existingBySourceId = await prisma.legacyImportMap.findUnique({
          where: {
            sourceSystem_sourceType_sourceId: {
              sourceSystem: "wordpress",
              sourceType: "blog_post",
              sourceId,
            },
          },
          select: { targetId: true },
        });
      }

      const existingPost = existingBySourceId
        ? await prisma.blogPost.findUnique({
            where: { id: existingBySourceId.targetId },
            select: { id: true, slug: true },
          })
        : await prisma.blogPost.findUnique({
            where: { slug: baseSlug },
            select: { id: true, slug: true },
          });

      const finalSlug = await uniquePostSlug(baseSlug, existingPost?.id);

      const upserted = existingPost
        ? await prisma.blogPost.update({
            where: { id: existingPost.id },
            data: {
              slug: await uniquePostSlug(finalSlug, existingPost.id),
              title,
              excerpt: finalExcerpt || null,
              contentHtml,
              seoTitle: seoTitle || null,
              seoDescription: seoDescription || null,
              coverImageUrl: coverImageUrl || null,
              isPublished: false,
              publishedAt: null,
              categoryId,
            },
            select: { id: true, slug: true },
          })
        : await prisma.blogPost.create({
            data: {
              slug: finalSlug,
              title,
              excerpt: finalExcerpt || null,
              contentHtml,
              seoTitle: seoTitle || null,
              seoDescription: seoDescription || null,
              coverImageUrl: coverImageUrl || null,
              isPublished: false,
              publishedAt: null,
              categoryId,
            },
            select: { id: true, slug: true },
          });

      if (existingPost) summary.updated += 1;
      else summary.created += 1;

      const tagNames = Array.from(
        new Set(
          (Array.isArray(item.taxonomies?.post_tag) ? item.taxonomies?.post_tag : [])
            .map((tag) => cleanText(tag.name))
            .filter(Boolean),
        ),
      ).slice(0, 20);

      const tagIds: string[] = [];
      for (const tagName of tagNames) {
        const tagSlug = slugify(cleanText(tagName)) || "tag";
        const tag = await prisma.blogTag.upsert({
          where: { slug: tagSlug },
          create: { slug: tagSlug, name: tagName.slice(0, 60) },
          update: { name: tagName.slice(0, 60) },
          select: { id: true },
        });
        tagIds.push(tag.id);
      }

      await prisma.blogPostTag.deleteMany({ where: { blogPostId: upserted.id } });
      if (tagIds.length) {
        await prisma.blogPostTag.createMany({
          data: tagIds.map((blogTagId) => ({ blogPostId: upserted.id, blogTagId })),
          skipDuplicates: true,
        });
      }

      const routePath = `/blog/${upserted.slug}`;
      if (seoTitle || seoDescription || canonicalUrl) {
        await prisma.seoMetaOverride.upsert({
          where: { routePath },
          create: {
            routePath,
            metaTitle: seoTitle || null,
            metaDescription: seoDescription || null,
            canonicalUrl: canonicalUrl || null,
            noindex: false,
          },
          update: {
            metaTitle: seoTitle || null,
            metaDescription: seoDescription || null,
            canonicalUrl: canonicalUrl || null,
            noindex: false,
          },
        });
      } else {
        await prisma.seoMetaOverride.deleteMany({ where: { routePath } });
      }

      if (existingPost && existingPost.slug !== upserted.slug) {
        await prisma.seoMetaOverride.deleteMany({ where: { routePath: `/blog/${existingPost.slug}` } });
      }

      if (sourceId) {
        await prisma.legacyImportMap.upsert({
          where: {
            sourceSystem_sourceType_sourceId: {
              sourceSystem: "wordpress",
              sourceType: "blog_post",
              sourceId,
            },
          },
          create: {
            sourceSystem: "wordpress",
            sourceType: "blog_post",
            sourceId,
            targetTable: "BlogPost",
            targetId: upserted.id,
            payload: {
              wpStatus: cleanText(post.post_status) || null,
              wpPermalink: canonicalUrl || null,
            },
          },
          update: {
            targetTable: "BlogPost",
            targetId: upserted.id,
            payload: {
              wpStatus: cleanText(post.post_status) || null,
              wpPermalink: canonicalUrl || null,
            },
          },
        });
      }
    } catch {
      summary.errors += 1;
    }
  }

  revalidatePath("/blog");
  revalidatePath("/admin/blog");

  const params = new URLSearchParams({
    imported: "1",
    created: String(summary.created),
    updated: String(summary.updated),
    skipped: String(summary.skipped),
    errors: String(summary.errors),
  });
  redirect(`/admin/blog?${params.toString()}`);
}

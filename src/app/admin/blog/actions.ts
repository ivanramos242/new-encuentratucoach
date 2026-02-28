"use server";

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

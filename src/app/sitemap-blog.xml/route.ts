import { listPublishedBlogPostsForSitemap } from "@/lib/blog-service";
import { renderSitemapUrlset, xmlResponse } from "@/lib/sitemap-xml";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await listPublishedBlogPostsForSitemap(500);
  return xmlResponse(
    renderSitemapUrlset(
      posts
        .filter((post) => {
          if (post.noindex) return false;
          if (!post.canonicalUrl) return true;
          return post.canonicalUrl === absoluteUrl(`/blog/${post.slug}`);
        })
        .map((post) => ({
          path: `/blog/${post.slug}`,
          lastModified: post.publishedAt,
        })),
    ),
  );
}

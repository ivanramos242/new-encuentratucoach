import { listPublishedBlogPosts } from "@/lib/blog-service";
import { renderSitemapUrlset, xmlResponse } from "@/lib/sitemap-xml";

export async function GET() {
  const posts = await listPublishedBlogPosts(500);
  return xmlResponse(
    renderSitemapUrlset(
      posts.map((post) => ({
        path: `/blog/${post.slug}`,
        lastModified: post.publishedAt,
      })),
    ),
  );
}

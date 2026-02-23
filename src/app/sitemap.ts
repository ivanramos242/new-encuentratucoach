import type { MetadataRoute } from "next";
import { blogPosts, coachCategories, coaches, cities } from "@/lib/mock-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date();

  const staticRoutes = [
    "/",
    "/coaches",
    "/membresia",
    "/sobre-nosotros",
    "/contacto",
    "/blog",
    "/faqs",
  ].map((url) => ({ url: `${base}${url}`, lastModified: now }));

  const coachRoutes = coaches.map((coach) => ({
    url: `${base}/coaches/${coach.slug}`,
    lastModified: new Date(coach.updatedAt),
  }));

  const categoryRoutes = coachCategories.map((category) => ({
    url: `${base}/coaches/categoria/${category.slug}`,
    lastModified: now,
  }));

  const cityRoutes = cities.map((city) => ({
    url: `${base}/coaches/ciudad/${city.slug}`,
    lastModified: now,
  }));

  const blogRoutes = blogPosts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
  }));

  return [...staticRoutes, ...coachRoutes, ...categoryRoutes, ...cityRoutes, ...blogRoutes];
}

import type { MetadataRoute } from "next";
import { blogPosts, coachCategories, coaches, cities } from "@/lib/mock-data";
import { qaQuestions, qaTopics } from "@/lib/v2-mock";

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
    "/pregunta-a-un-coach",
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

  const qaQuestionRoutes = qaQuestions
    .filter((question) => question.status === "published")
    .map((question) => ({
      url: `${base}/pregunta-a-un-coach/${question.slug}`,
      lastModified: new Date(question.updatedAt),
    }));

  const qaTopicRoutes = qaTopics
    .filter((topic) => topic.curated)
    .map((topic) => ({
      url: `${base}/pregunta-a-un-coach/tema/${topic.slug}`,
      lastModified: now,
    }));

  return [...staticRoutes, ...coachRoutes, ...categoryRoutes, ...cityRoutes, ...blogRoutes, ...qaQuestionRoutes, ...qaTopicRoutes];
}

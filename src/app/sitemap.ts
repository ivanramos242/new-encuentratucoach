import type { MetadataRoute } from "next";
import { coaches, blogPosts, cities, coachCategories, faqItems } from "@/lib/mock-data";
import { buildCategoryCopy, buildCategoryCityCopy, buildCityCopy, getListingContentWordCount } from "@/lib/listing-seo";
import { siteConfig } from "@/lib/site-config";
import { shouldIndexListing } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;
  const now = new Date();
  const visibleCoaches = coaches.filter((coach) => coach.visibilityActive && coach.profileStatus === "published");

  const staticRoutes = [
    "/",
    "/coaches",
    "/contacto",
    "/membresia",
    "/coaching-personal",
    "/pregunta-a-un-coach",
    "/plataformas-para-trabajar-como-coach",
    "/sobre-nosotros",
    "/blog",
    "/faqs",
    "/aviso-legal",
    "/cookies",
    "/privacidad",
  ].map((url) => ({ url: `${base}${url}`, lastModified: now }));

  const coachRoutes = visibleCoaches.map((coach) => ({
    url: `${base}/coaches/${coach.slug}`,
    lastModified: new Date(coach.updatedAt),
  }));

  const cityRoutes = cities
    .map((city) => {
      const items = visibleCoaches.filter((coach) => coach.citySlug === city.slug);
      const contentWordCount = getListingContentWordCount({
        intro: buildCityCopy(city.name),
        coaches: items,
        faqs: faqItems.slice(0, 3),
        extras: [
          `Coach en ${city.name}`,
          `Compara coaches online y presenciales en ${city.name}. Filtra por presupuesto, modalidad y senales de confianza.`,
        ],
      });
      if (!shouldIndexListing(items.length, contentWordCount)) {
        return null;
      }
      return {
        url: `${base}/coaches/ciudad/${city.slug}`,
        lastModified: now,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const categoryRoutes = coachCategories
    .map((category) => {
      const items = visibleCoaches.filter((coach) => coach.categories.includes(category.slug));
      const contentWordCount = getListingContentWordCount({
        intro: buildCategoryCopy(category.name),
        coaches: items,
        faqs: faqItems.slice(0, 3),
        extras: [category.name, category.shortDescription],
      });
      if (!shouldIndexListing(items.length, contentWordCount)) {
        return null;
      }
      return {
        url: `${base}/coaches/categoria/${category.slug}`,
        lastModified: now,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const categoryCityRoutes = coachCategories
    .flatMap((category) =>
      cities.map((city) => {
        const items = visibleCoaches.filter(
          (coach) => coach.categories.includes(category.slug) && coach.citySlug === city.slug,
        );
        const contentWordCount = getListingContentWordCount({
          intro: buildCategoryCityCopy(category.name, city.name),
          coaches: items,
          faqs: faqItems.slice(0, 3),
          extras: [`${category.name} en ${city.name}`],
        });
        if (!shouldIndexListing(items.length, contentWordCount)) {
          return null;
        }
        return {
          url: `${base}/coaches/categoria/${category.slug}/${city.slug}`,
          lastModified: now,
        };
      }),
    )
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const blogRoutes = blogPosts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
  }));

  return [
    ...staticRoutes,
    ...coachRoutes,
    ...cityRoutes,
    ...categoryRoutes,
    ...categoryCityRoutes,
    ...blogRoutes,
  ];
}

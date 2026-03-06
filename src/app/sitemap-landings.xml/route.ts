import { isIndexableCategorySlug, isIndexableCitySlug, resolveCitySlug } from "@/lib/directory";
import { shouldNoIndexLanding } from "@/lib/seo";
import { listPublicCoachesMerged } from "@/lib/public-coaches";
import { renderSitemapUrlset, xmlResponse } from "@/lib/sitemap-xml";

export const dynamic = "force-dynamic";

export async function GET() {
  const coaches = await listPublicCoachesMerged();

  const categorySet = new Set<string>();
  const citySet = new Set<string>();
  const comboSet = new Set<string>();

  for (const coach of coaches) {
    const citySlug = resolveCitySlug(coach.citySlug);
    if (citySlug) citySet.add(citySlug);
    for (const categorySlug of coach.categories) {
      if (!isIndexableCategorySlug(categorySlug) || !citySlug) continue;
      categorySet.add(categorySlug);
      comboSet.add(`${categorySlug}::${citySlug}`);
    }
  }

  const entries: Array<{ path: string; lastModified: string }> = [];
  const latestUpdatedAt =
    coaches.length > 0
      ? coaches
          .map((coach) => new Date(coach.updatedAt || coach.createdAt).getTime())
          .sort((a, b) => b - a)[0]
      : Date.now();

  const addEntry = (path: string) => {
    entries.push({ path, lastModified: new Date(latestUpdatedAt).toISOString() });
  };

  for (const citySlug of citySet) {
    if (!isIndexableCitySlug(citySlug)) continue;
    const count = coaches.filter((coach) => resolveCitySlug(coach.citySlug) === citySlug).length;
    if (!shouldNoIndexLanding({ coachCount: count, hasEditorialContent: true })) {
      addEntry(`/coaches/ciudad/${citySlug}`);
    }
  }

  for (const categorySlug of categorySet) {
    if (!isIndexableCategorySlug(categorySlug)) continue;
    const count = coaches.filter((coach) => coach.categories.includes(categorySlug)).length;
    if (!shouldNoIndexLanding({ coachCount: count, hasEditorialContent: true })) {
      addEntry(`/coaches/categoria/${categorySlug}`);
    }
  }

  for (const key of comboSet) {
    const [categorySlug, citySlug] = key.split("::");
    if (!isIndexableCategorySlug(categorySlug) || !isIndexableCitySlug(citySlug)) continue;
    const count = coaches.filter(
      (coach) => resolveCitySlug(coach.citySlug) === citySlug && coach.categories.includes(categorySlug),
    ).length;
    if (!shouldNoIndexLanding({ coachCount: count, hasEditorialContent: true })) {
      addEntry(`/coaches/categoria/${categorySlug}/${citySlug}`);
    }
  }

  const onlineCount = coaches.filter((coach) => coach.sessionModes.includes("online")).length;
  if (!shouldNoIndexLanding({ coachCount: onlineCount, hasEditorialContent: true })) {
    addEntry("/coaches/modalidad/online");
  }

  const certifiedCount = coaches.filter((coach) => coach.certifiedStatus === "approved").length;
  if (!shouldNoIndexLanding({ coachCount: certifiedCount, hasEditorialContent: true })) {
    addEntry("/coaches/certificados");
  }

  return xmlResponse(renderSitemapUrlset(entries));
}

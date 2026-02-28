import { shouldNoIndexLanding } from "@/lib/seo";
import { listPublicCoachesMerged } from "@/lib/public-coaches";
import { renderSitemapUrlset, xmlResponse } from "@/lib/sitemap-xml";

export async function GET() {
  const coaches = await listPublicCoachesMerged();

  const categorySet = new Set<string>();
  const citySet = new Set<string>();
  const comboSet = new Set<string>();

  for (const coach of coaches) {
    citySet.add(coach.citySlug);
    for (const categorySlug of coach.categories) {
      categorySet.add(categorySlug);
      comboSet.add(`${categorySlug}::${coach.citySlug}`);
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
    const count = coaches.filter((coach) => coach.citySlug === citySlug).length;
    if (!shouldNoIndexLanding({ coachCount: count, hasEditorialContent: true })) {
      addEntry(`/coaches/ciudad/${citySlug}`);
    }
  }

  for (const categorySlug of categorySet) {
    const count = coaches.filter((coach) => coach.categories.includes(categorySlug)).length;
    if (!shouldNoIndexLanding({ coachCount: count, hasEditorialContent: true })) {
      addEntry(`/coaches/categoria/${categorySlug}`);
    }
  }

  for (const key of comboSet) {
    const [categorySlug, citySlug] = key.split("::");
    const count = coaches.filter(
      (coach) => coach.citySlug === citySlug && coach.categories.includes(categorySlug),
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

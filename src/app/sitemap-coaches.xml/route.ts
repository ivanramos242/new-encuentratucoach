import { listPublicCoachesMerged } from "@/lib/public-coaches";
import { renderSitemapUrlset, xmlResponse } from "@/lib/sitemap-xml";

export async function GET() {
  const coaches = await listPublicCoachesMerged();
  return xmlResponse(
    renderSitemapUrlset(
      coaches.map((coach) => ({
        path: `/coaches/${coach.slug}`,
        lastModified: coach.updatedAt || coach.createdAt,
      })),
    ),
  );
}

import type { ClickTarget } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CoachProfile } from "@/types/domain";

const CONTACT_CLICK_TARGETS: ClickTarget[] = ["whatsapp", "phone", "email", "mensaje"];

export type DirectoryTrustMetrics = {
  verifiedCoaches: number;
  contactsLast7d: number;
  realReviews: number;
};

function uniq(input: string[]) {
  return [...new Set(input.filter(Boolean))];
}

function fallbackMetricsFromCoaches(coaches: CoachProfile[]): DirectoryTrustMetrics {
  const verifiedCoaches = coaches.filter((coach) => coach.certifiedStatus === "approved").length;
  const contactsLast7d = coaches.reduce((sum, coach) => {
    const clicks = coach.metrics?.clicks || {};
    return sum + Number(clicks.whatsapp || 0) + Number(clicks.phone || 0) + Number(clicks.email || 0) + Number(clicks.mensaje || 0);
  }, 0);
  const realReviews = coaches.reduce((sum, coach) => sum + (coach.reviews?.length || 0), 0);
  return { verifiedCoaches, contactsLast7d, realReviews };
}

export async function getTrustMetricsForCoachSet(input: {
  coachIds?: string[];
  fallbackCoaches?: CoachProfile[];
}): Promise<DirectoryTrustMetrics> {
  const fallback = fallbackMetricsFromCoaches(input.fallbackCoaches ?? []);
  const coachIds = uniq(input.coachIds ?? input.fallbackCoaches?.map((coach) => coach.id) ?? []);
  if (!coachIds.length) return fallback;
  if (!process.env.DATABASE_URL) return fallback;

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    const [verifiedCoaches, realReviews, contactsLast7d] = await Promise.all([
      prisma.coachProfile.count({
        where: {
          id: { in: coachIds },
          certifiedStatus: "approved",
        },
      }),
      prisma.review.count({
        where: {
          coachProfileId: { in: coachIds },
          isVisible: true,
        },
      }),
      prisma.coachProfileClickEvent.count({
        where: {
          coachProfileId: { in: coachIds },
          target: { in: CONTACT_CLICK_TARGETS },
          createdAt: { gte: since },
        },
      }),
    ]);

    return {
      verifiedCoaches,
      contactsLast7d,
      realReviews,
    };
  } catch {
    return fallback;
  }
}

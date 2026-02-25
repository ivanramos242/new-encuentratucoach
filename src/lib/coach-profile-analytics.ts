import { createHash } from "node:crypto";
import type { ClickTarget } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function dayStartUtc(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDaysUtc(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function sha256Hex(value?: string | null) {
  if (!value) return null;
  return createHash("sha256").update(value).digest("hex");
}

function getClientIpHash(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const realIp = request.headers.get("x-real-ip")?.trim() || null;
  return sha256Hex(forwarded || realIp);
}

function getUserAgent(request: Request) {
  return request.headers.get("user-agent")?.slice(0, 500) || null;
}

export async function recordCoachProfileViewStart(input: {
  coachId: string;
  sessionId: string;
  startedAt?: string | null;
  request: Request;
}) {
  const startedAt = input.startedAt ? new Date(input.startedAt) : new Date();
  const safeStartedAt = Number.isNaN(startedAt.getTime()) ? new Date() : startedAt;

  await prisma.coachProfileViewSession.upsert({
    where: {
      coachProfileId_sessionKey: {
        coachProfileId: input.coachId,
        sessionKey: input.sessionId,
      },
    },
    create: {
      coachProfileId: input.coachId,
      sessionKey: input.sessionId,
      startedAt: safeStartedAt,
      ipHash: getClientIpHash(input.request),
      userAgent: getUserAgent(input.request),
    },
    update: {
      // Keep first startedAt if already stored, but refresh fingerprint if empty.
      ipHash: getClientIpHash(input.request),
      userAgent: getUserAgent(input.request),
    },
  });
}

export async function recordCoachProfileViewEnd(input: {
  coachId: string;
  sessionId: string;
  durationSeconds?: number | null;
  endedAt?: string | null;
  request: Request;
}) {
  const endedAt = input.endedAt ? new Date(input.endedAt) : new Date();
  const safeEndedAt = Number.isNaN(endedAt.getTime()) ? new Date() : endedAt;
  const durationSeconds = Math.max(0, Math.min(60 * 60 * 12, Math.round(input.durationSeconds ?? 0)));
  const day = dayStartUtc(safeEndedAt);
  const ipHash = getClientIpHash(input.request);
  const userAgent = getUserAgent(input.request);

  let counted = false;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.coachProfileViewSession.findUnique({
      where: {
        coachProfileId_sessionKey: {
          coachProfileId: input.coachId,
          sessionKey: input.sessionId,
        },
      },
      select: {
        id: true,
        endedAt: true,
      },
    });

    if (!existing) {
      await tx.coachProfileViewSession.create({
        data: {
          coachProfileId: input.coachId,
          sessionKey: input.sessionId,
          startedAt: safeEndedAt,
          endedAt: safeEndedAt,
          durationSeconds,
          ipHash,
          userAgent,
        },
      });
      counted = true;
    } else if (!existing.endedAt) {
      await tx.coachProfileViewSession.update({
        where: { id: existing.id },
        data: {
          endedAt: safeEndedAt,
          durationSeconds,
          ipHash,
          userAgent,
        },
      });
      counted = true;
    }

    if (!counted) return;

    await tx.coachProfileViewDailyAggregate.upsert({
      where: {
        coachProfileId_date: {
          coachProfileId: input.coachId,
          date: day,
        },
      },
      create: {
        coachProfileId: input.coachId,
        date: day,
        totalViews: 1,
        totalDurationSeconds: durationSeconds,
      },
      update: {
        totalViews: { increment: 1 },
        totalDurationSeconds: { increment: durationSeconds },
      },
    });
  });

  return { counted };
}

export async function recordCoachProfileClick(input: {
  coachId: string;
  target: ClickTarget;
  request: Request;
}) {
  const now = new Date();
  const day = dayStartUtc(now);
  const ipHash = getClientIpHash(input.request);
  const userAgent = getUserAgent(input.request);

  await prisma.$transaction(async (tx) => {
    await tx.coachProfileClickEvent.create({
      data: {
        coachProfileId: input.coachId,
        target: input.target,
        ipHash,
        userAgent,
      },
    });

    await tx.coachProfileClickDailyAggregate.upsert({
      where: {
        coachProfileId_target_date: {
          coachProfileId: input.coachId,
          target: input.target,
          date: day,
        },
      },
      create: {
        coachProfileId: input.coachId,
        target: input.target,
        date: day,
        count: 1,
      },
      update: {
        count: { increment: 1 },
      },
    });
  });
}

export type CoachPrivateAnalyticsSummary = {
  totals: {
    totalViews: number;
    totalClicks: number;
    avgViewSeconds: number;
    totalDurationSeconds: number;
    qualityViews30s: number;
    last7Views: number;
    last7Clicks: number;
    last30Views: number;
    last30Clicks: number;
    previous7Views: number;
    previous7Clicks: number;
    ctrPercent: number;
  };
  clicksByTarget: Array<{ target: ClickTarget; count: number }>;
  topClickTarget: ClickTarget | null;
  series14d: Array<{
    dateIso: string;
    label: string;
    views: number;
    clicks: number;
    durationSeconds: number;
    avgViewSeconds: number;
  }>;
};

export async function getCoachPrivateAnalyticsSummary(coachProfileId: string): Promise<CoachPrivateAnalyticsSummary | null> {
  if (!process.env.DATABASE_URL) return null;

  const today = dayStartUtc();
  const since30 = addDaysUtc(today, -29);
  const since14 = addDaysUtc(today, -13);
  const since7 = addDaysUtc(today, -6);
  const prev7Start = addDaysUtc(today, -13);
  const prev7End = addDaysUtc(today, -7);

  try {
    const [viewAggAll, viewAgg30, viewAgg14, clickAggAll, clickAgg30, qualityViews] = await Promise.all([
      prisma.coachProfileViewDailyAggregate.aggregate({
        where: { coachProfileId },
        _sum: { totalViews: true, totalDurationSeconds: true },
      }),
      prisma.coachProfileViewDailyAggregate.findMany({
        where: { coachProfileId, date: { gte: since30 } },
        select: { date: true, totalViews: true, totalDurationSeconds: true },
        orderBy: { date: "asc" },
      }),
      prisma.coachProfileViewDailyAggregate.findMany({
        where: { coachProfileId, date: { gte: since14 } },
        select: { date: true, totalViews: true, totalDurationSeconds: true },
        orderBy: { date: "asc" },
      }),
      prisma.coachProfileClickDailyAggregate.groupBy({
        by: ["target"],
        where: { coachProfileId },
        _sum: { count: true },
      }),
      prisma.coachProfileClickDailyAggregate.findMany({
        where: { coachProfileId, date: { gte: since30 } },
        select: { date: true, target: true, count: true },
        orderBy: [{ date: "asc" }, { target: "asc" }],
      }),
      prisma.coachProfileViewSession.count({
        where: { coachProfileId, durationSeconds: { gte: 30 } },
      }),
    ]);

    const totalViews = viewAggAll._sum.totalViews ?? 0;
    const totalDurationSeconds = viewAggAll._sum.totalDurationSeconds ?? 0;
    const totalClicks = clickAggAll.reduce((sum, row) => sum + (row._sum.count ?? 0), 0);
    const avgViewSeconds = totalViews > 0 ? Math.round(totalDurationSeconds / totalViews) : 0;
    const ctrPercent = totalViews > 0 ? Number(((totalClicks / totalViews) * 100).toFixed(1)) : 0;

    const viewByDate = new Map(
      viewAgg14.map((row) => [
        dayStartUtc(row.date).toISOString(),
        { views: row.totalViews, durationSeconds: row.totalDurationSeconds },
      ]),
    );
    const clickByDate = new Map<string, number>();
    for (const row of clickAgg30) {
      const key = dayStartUtc(row.date).toISOString();
      clickByDate.set(key, (clickByDate.get(key) ?? 0) + row.count);
    }

    const series14d = Array.from({ length: 14 }, (_, index) => {
      const date = addDaysUtc(since14, index);
      const key = date.toISOString();
      const views = viewByDate.get(key)?.views ?? 0;
      const durationSeconds = viewByDate.get(key)?.durationSeconds ?? 0;
      const clicks = clickByDate.get(key) ?? 0;
      return {
        dateIso: key,
        label: new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit" }).format(date),
        views,
        clicks,
        durationSeconds,
        avgViewSeconds: views > 0 ? Math.round(durationSeconds / views) : 0,
      };
    });

    const rangeViews = (from: Date, toInclusive: Date) =>
      viewAgg30
        .filter((row) => row.date >= from && row.date <= toInclusive)
        .reduce((sum, row) => sum + row.totalViews, 0);
    const rangeClicks = (from: Date, toInclusive: Date) =>
      clickAgg30
        .filter((row) => row.date >= from && row.date <= toInclusive)
        .reduce((sum, row) => sum + row.count, 0);

    const last7Views = rangeViews(since7, today);
    const last7Clicks = rangeClicks(since7, today);
    const last30Views = viewAgg30.reduce((sum, row) => sum + row.totalViews, 0);
    const last30Clicks = clickAgg30.reduce((sum, row) => sum + row.count, 0);
    const previous7Views = rangeViews(prev7Start, prev7End);
    const previous7Clicks = rangeClicks(prev7Start, prev7End);

    const clicksByTarget = clickAggAll
      .map((row) => ({ target: row.target, count: row._sum.count ?? 0 }))
      .sort((a, b) => b.count - a.count);

    return {
      totals: {
        totalViews,
        totalClicks,
        avgViewSeconds,
        totalDurationSeconds,
        qualityViews30s: qualityViews,
        last7Views,
        last7Clicks,
        last30Views,
        last30Clicks,
        previous7Views,
        previous7Clicks,
        ctrPercent,
      },
      clicksByTarget,
      topClickTarget: clicksByTarget[0]?.target ?? null,
      series14d,
    };
  } catch (error) {
    console.warn("[coach-profile-analytics] summary failed", error);
    return null;
  }
}

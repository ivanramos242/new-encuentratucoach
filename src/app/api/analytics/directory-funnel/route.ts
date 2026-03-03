import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { hasAnalyticsConsentFromRequest } from "@/lib/cookie-consent-server";
import { deriveDirectoryLandingFromPath, normalizeSourcePath } from "@/lib/directory-attribution";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z.object({
  eventType: z.enum(["view_profile", "click_whatsapp", "click_contact", "submit_form", "booking_start"]),
  coachProfileId: z.string().min(1).optional(),
  sourcePath: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

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

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return jsonOk({
        status: "skipped",
        reason: "database_unavailable",
      });
    }

    if (!hasAnalyticsConsentFromRequest(request)) {
      return jsonOk({
        status: "skipped",
        reason: "analytics_consent_disabled",
      });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });

    const sourcePath = normalizeSourcePath(parsed.data.sourcePath) || undefined;
    const landing = deriveDirectoryLandingFromPath(sourcePath);

    const event = await prisma.directoryFunnelEvent.create({
      data: {
        eventType: parsed.data.eventType,
        coachProfileId: parsed.data.coachProfileId || undefined,
        sourcePath,
        landingPath: landing?.landingPath,
        landingType: landing?.landingType,
        citySlug: landing?.citySlug,
        categorySlug: landing?.categorySlug,
        metadata: parsed.data.metadata as Prisma.InputJsonValue | undefined,
        ipHash: getClientIpHash(request),
        userAgent: getUserAgent(request),
      },
      select: {
        id: true,
        eventType: true,
        landingPath: true,
        landingType: true,
        citySlug: true,
        categorySlug: true,
        createdAt: true,
      },
    });

    return jsonOk({
      status: "captured",
      event,
    });
  } catch (error) {
    console.error("[analytics/directory-funnel] error", error);
    return jsonError("No se pudo registrar el evento", 400);
  }
}

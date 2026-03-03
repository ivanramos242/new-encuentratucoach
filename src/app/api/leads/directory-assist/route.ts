import { createHash } from "node:crypto";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { deriveDirectoryLandingFromPath, normalizeSourcePath } from "@/lib/directory-attribution";
import { sendMail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { applyEndpointRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().email().max(320),
  sourcePath: z.string().max(500).optional(),
  trigger: z.enum(["exit_intent", "mobile_banner"]),
  privacyAccepted: z.coerce.boolean().refine((value) => value, "Debes aceptar la politica de privacidad."),
  honeypot: z.string().optional().default(""),
});

function normalizeEmailList(input?: string | null) {
  if (!input) return [];
  return input
    .split(/[;,]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return jsonOk({
        status: "skipped",
        reason: "database_unavailable",
      });
    }

    const rateLimited = applyEndpointRateLimit(request, {
      namespace: "directory-assist-lead",
      limit: 8,
      windowMs: 60 * 60_000,
      message: "Has enviado demasiadas solicitudes. Intentalo mas tarde.",
    });
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Datos invalidos", 400, { issues: parsed.error.flatten() });
    }

    if (parsed.data.honeypot.trim()) {
      return jsonOk({ status: "accepted" });
    }

    const sourcePath = normalizeSourcePath(parsed.data.sourcePath) || undefined;
    const landing = deriveDirectoryLandingFromPath(sourcePath);

    const lead = await prisma.directoryAssistLead.create({
      data: {
        email: parsed.data.email,
        sourcePath,
        landingPath: landing?.landingPath,
        citySlug: landing?.citySlug,
        trigger: parsed.data.trigger,
        ipHash: getClientIpHash(request),
        userAgent: getUserAgent(request),
      },
      select: {
        id: true,
        email: true,
        sourcePath: true,
        landingPath: true,
        citySlug: true,
        trigger: true,
        createdAt: true,
      },
    });

    const recipients = Array.from(
      new Set([
        ...normalizeEmailList(process.env.CONTACT_TO),
        ...normalizeEmailList(process.env.ALERTS_TO),
        "info@encuentratucoach.es",
      ]),
    );

    if (recipients.length) {
      const safeEmail = escapeHtml(lead.email);
      const safeSourcePath = escapeHtml(lead.sourcePath || "N/A");
      const safeLandingPath = escapeHtml(lead.landingPath || "Sin atribucion");
      const safeCity = escapeHtml(lead.citySlug || "N/A");

      await sendMail({
        to: recipients.join(", "),
        subject: `Nuevo lead de recaptura (${lead.trigger})`,
        text: [
          "Nuevo lead de recaptura de abandono.",
          "",
          `Email: ${lead.email}`,
          `Trigger: ${lead.trigger}`,
          `Source path: ${lead.sourcePath || "N/A"}`,
          `Landing path: ${lead.landingPath || "Sin atribucion"}`,
          `City slug: ${lead.citySlug || "N/A"}`,
        ].join("\n"),
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
            <h2 style="margin:0 0 12px;font-size:20px">Nuevo lead de recaptura</h2>
            <ul style="padding-left:18px;margin:0">
              <li><strong>Email:</strong> ${safeEmail}</li>
              <li><strong>Trigger:</strong> ${lead.trigger}</li>
              <li><strong>Source path:</strong> ${safeSourcePath}</li>
              <li><strong>Landing path:</strong> ${safeLandingPath}</li>
              <li><strong>City slug:</strong> ${safeCity}</li>
            </ul>
          </div>
        `,
      }).catch(() => undefined);
    }

    return jsonOk({
      status: "captured",
      lead,
      message: "Te ayudaremos a elegir coach. Revisa tu email.",
    });
  } catch (error) {
    console.error("[leads/directory-assist] POST failed", error);
    return jsonError("No se pudo procesar la solicitud", 400);
  }
}

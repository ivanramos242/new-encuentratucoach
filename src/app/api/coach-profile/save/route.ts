import { z } from "zod";
import { CoachCertificationStatus, CoachProfileStatus, CoachVisibilityStatus, SessionMode } from "@prisma/client";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { getCoachProfileForEditor, saveCoachProfile } from "@/lib/coach-profile-service";

const urlField = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => !v || /^https?:\/\//i.test(v), "URL invalida");

const schema = z.object({
  coachProfileId: z.string().optional(),
  name: z.string().min(2).max(160).optional(),
  headline: z.string().max(200).optional().nullable(),
  bio: z.string().max(5000).optional().nullable(),
  aboutHtml: z.string().max(15000).optional().nullable(),
  gender: z.string().max(80).optional().nullable(),
  specialtiesText: z.string().max(800).optional().nullable(),
  languagesText: z.string().max(400).optional().nullable(),
  heroImageUrl: urlField.nullable().optional(),
  videoPresentationUrl: urlField.nullable().optional(),
  featured: z.boolean().optional(),
  messagingEnabled: z.boolean().optional(),
  messagingAutoReply: z.string().max(1200).optional().nullable(),
  messagingReplySlaMinutes: z.number().int().min(0).max(10080).optional().nullable(),
  profileStatus: z.nativeEnum(CoachProfileStatus).optional(),
  visibilityStatus: z.nativeEnum(CoachVisibilityStatus).optional(),
  certifiedStatus: z.nativeEnum(CoachCertificationStatus).optional(),
  location: z
    .object({
      city: z.string().min(2).max(120),
      province: z.string().max(120).optional().nullable(),
      country: z.string().max(120).optional().nullable(),
    })
    .optional()
    .nullable(),
  sessionModes: z.array(z.nativeEnum(SessionMode)).max(2).optional(),
  pricing: z
    .object({
      basePriceEur: z.number().min(0).max(5000).optional().nullable().transform((v) => (typeof v === "number" ? Math.round(v) : v)),
      detailsHtml: z.string().max(15000).optional().nullable(),
      notes: z.string().max(2000).optional().nullable(),
    })
    .optional()
    .nullable(),
  links: z
    .object({
      web: z.string().max(500).optional().nullable(),
      linkedin: z.string().max(500).optional().nullable(),
      instagram: z.string().max(500).optional().nullable(),
      facebook: z.string().max(500).optional().nullable(),
      whatsapp: z.string().max(64).optional().nullable(),
      phone: z.string().max(64).optional().nullable(),
      email: z.string().email().max(200).optional().nullable(),
    })
    .optional(),
  galleryUrls: z.array(z.string().max(500)).max(8).optional(),
  categorySlugs: z.array(z.string().min(1).max(120)).max(12).optional(),
});

export async function GET(request: Request) {
  const auth = await requireApiRole(request, ["coach", "admin"]);
  if (!auth.ok) return auth.response;

  const profile = await getCoachProfileForEditor(auth.user);
  return jsonOk({ profile });
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiRole(request, ["coach", "admin"]);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message;
      return jsonError(firstIssue ? `Payload invalido: ${firstIssue}` : "Payload invalido", 400, {
        issues: parsed.error.flatten(),
      });
    }

    const profile = await saveCoachProfile(auth.user, parsed.data);
    return jsonOk({ profile, message: "Perfil guardado correctamente" });
  } catch (error) {
    console.error("[coach-profile/save] error", error);
    return jsonError(error instanceof Error ? error.message : "No se pudo guardar el perfil", 400);
  }
}



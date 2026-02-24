import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import {
  buildPublicObjectUrl,
  buildUploadObjectKey,
  createPresignedPutUrl,
  isPrivateScope,
  resolveBucketByScope,
} from "@/lib/s3-storage";

const schema = z.object({
  scope: z.enum(["coach_gallery", "coach_hero", "coach_video", "certification_document"]),
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive().max(25 * 1024 * 1024),
  coachProfileId: z.string().optional(),
});

function parseAllowedMimeList() {
  const raw =
    process.env.CHAT_ATTACHMENT_ALLOWED_MIME ||
    "image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm";
  return new Set(
    raw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
  );
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiRole(request, ["coach", "admin"]);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });

    const maxBytes = Number(process.env.CHAT_ATTACHMENT_MAX_BYTES ?? 5 * 1024 * 1024);
    if (parsed.data.scope !== "coach_video" && parsed.data.sizeBytes > maxBytes) {
      return jsonError(`Archivo demasiado grande. Maximo ${maxBytes} bytes`, 400);
    }

    const allowedMime = parseAllowedMimeList();
    const videoAllowed = new Set(["video/mp4", "video/webm"]);
    if (
      (parsed.data.scope === "coach_video" && !videoAllowed.has(parsed.data.contentType)) ||
      (parsed.data.scope !== "coach_video" && !allowedMime.has(parsed.data.contentType))
    ) {
      return jsonError("Tipo de archivo no permitido", 400);
    }

    const coachProfileId =
      auth.user.role === "admin" ? parsed.data.coachProfileId || auth.user.coachProfileId : auth.user.coachProfileId;

    if (!coachProfileId) return jsonError("No se pudo resolver el perfil de coach para la subida", 400);

    const key = buildUploadObjectKey({
      scope: parsed.data.scope,
      coachProfileId,
      fileName: parsed.data.fileName,
      contentType: parsed.data.contentType,
    });
    const bucket = resolveBucketByScope(parsed.data.scope);
    const uploadUrl = await createPresignedPutUrl({
      bucket,
      key,
      contentType: parsed.data.contentType,
      contentLength: parsed.data.sizeBytes,
      expiresInSeconds: 600,
    });

    return jsonOk({
      uploadUrl,
      method: "PUT",
      bucket,
      storageKey: key,
      isPrivate: isPrivateScope(parsed.data.scope),
      publicObjectUrl: isPrivateScope(parsed.data.scope) ? null : buildPublicObjectUrl(bucket, key),
      expiresInSeconds: 600,
    });
  } catch (error) {
    console.error("[uploads/presign] error", error);
    return jsonError("No se pudo generar la URL de subida", 500);
  }
}



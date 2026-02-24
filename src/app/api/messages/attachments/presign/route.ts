import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { resolveApiActorFromRequest } from "@/lib/mock-auth-context";
import { getThreadAttachmentPresign } from "@/lib/v2-service";

const maxBytes = Number(process.env.CHAT_ATTACHMENT_MAX_BYTES ?? 5_242_880);
const allowedMimeList = (process.env.CHAT_ATTACHMENT_ALLOWED_MIME ??
  "image/jpeg,image/png,image/webp,application/pdf")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const schema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive().max(maxBytes),
  threadId: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const actorResolved = await resolveApiActorFromRequest(request, "client");
  if (!actorResolved.ok) return actorResolved.response;
  const actor = actorResolved.actor;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });

    if (!allowedMimeList.includes(parsed.data.mimeType)) {
      return jsonError("Tipo de archivo no permitido", 400, {
        allowedMimeTypes: allowedMimeList,
        maxBytes,
      });
    }

    const presign = getThreadAttachmentPresign(parsed.data);
    return jsonOk({
      actor,
      maxBytes,
      allowedMimeTypes: allowedMimeList,
      upload: presign,
      expiresInSeconds: 600,
      note: "Mock presign response. En V2 real se firma contra MinIO/S3.",
    });
  } catch {
    return jsonError("No se pudo generar la URL de subida", 400);
  }
}



import { randomUUID } from "node:crypto";
import { z } from "zod";
import { jsonError, jsonOk, jsonServerError } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { buildPublicObjectUrl, createPresignedPutUrl } from "@/lib/s3-storage";
import { applyEndpointRateLimit } from "@/lib/rate-limit";

const maxBytes = Number(process.env.CHAT_ATTACHMENT_MAX_BYTES ?? 5_242_880);
const allowedMimeList = (process.env.CHAT_ATTACHMENT_ALLOWED_MIME ??
  "image/jpeg,image/png,image/webp,application/pdf,audio/webm,audio/ogg,audio/mp4")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

function normalizeMime(mimeType: string) {
  return mimeType.split(";")[0]?.trim().toLowerCase() || mimeType.trim().toLowerCase();
}

const schema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive().max(maxBytes),
  threadId: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const rateLimited = applyEndpointRateLimit(request, {
      namespace: "messages-attachments-presign",
      limit: 30,
      windowMs: 60_000,
    });
    if (rateLimited) return rateLimited;

    const auth = await requireApiRole(request, ["client", "coach"]);
    if (!auth.ok) return auth.response;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });

    const normalizedMime = normalizeMime(parsed.data.mimeType);

    if (!allowedMimeList.includes(normalizedMime)) {
      return jsonError("Tipo de archivo no permitido", 400, {
        allowedMimeTypes: allowedMimeList,
        maxBytes,
      });
    }

    const safeName = parsed.data.fileName.replace(/[^\w.\-]+/g, "-").toLowerCase();
    const threadPart = parsed.data.threadId ? parsed.data.threadId.replace(/[^\w-]+/g, "") : "temp";
    const key = `chat-attachments/${threadPart}/${Date.now()}-${randomUUID()}-${safeName}`;

    let uploadUrl: string;
    let note: string | undefined;
    let publicObjectUrl: string | null = null;
    try {
      uploadUrl = await createPresignedPutUrl({
        bucket: process.env.S3_BUCKET_PUBLIC || "etc-public",
        key,
        contentType: normalizedMime,
        contentLength: parsed.data.sizeBytes,
        expiresInSeconds: 600,
      });
      publicObjectUrl = buildPublicObjectUrl(process.env.S3_BUCKET_PUBLIC || "etc-public", key);
    } catch (error) {
      if (process.env.NODE_ENV === "production") {
        console.error("[messages/attachments/presign] S3 unavailable in production", error);
        return jsonServerError("No se pudo generar la URL de subida", error, { status: 503, exposeInDevelopment: false });
      }
      const mockKey = `mock-message/${threadPart}/${Date.now()}-${randomUUID()}-${safeName}`;
      uploadUrl = `/api/messages/attachments/mock-upload?key=${encodeURIComponent(mockKey)}`;
      publicObjectUrl = `/api/messages/attachments/mock-upload?key=${encodeURIComponent(mockKey)}&download=1`;
      note = error instanceof Error ? `S3 no configurado. Usando mock local (${error.message}).` : "S3 no configurado. Usando mock local.";
      return jsonOk({
        actor: { role: auth.user.role, userId: auth.user.id, displayName: auth.user.displayName ?? auth.user.email },
        maxBytes,
        allowedMimeTypes: allowedMimeList,
        upload: {
          uploadUrl,
          method: "PUT",
          storageKey: mockKey,
          publicObjectUrl,
        },
        expiresInSeconds: 600,
        note,
      });
    }

    return jsonOk({
      actor: { role: auth.user.role, userId: auth.user.id, displayName: auth.user.displayName ?? auth.user.email },
      maxBytes,
      allowedMimeTypes: allowedMimeList,
      upload: {
        uploadUrl,
        method: "PUT",
        storageKey: key,
        publicObjectUrl,
      },
      expiresInSeconds: 600,
      note,
    });
  } catch (error) {
    return jsonServerError("No se pudo generar la URL de subida", error, { status: 400 });
  }
}



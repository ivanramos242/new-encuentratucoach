import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { resolveApiActorFromRequest } from "@/lib/mock-auth-context";
import { addThreadMessage } from "@/lib/v2-service";

type ParamsInput = Promise<{ threadId: string }>;

const attachmentSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(["image", "pdf"]),
    status: z.enum(["uploaded", "validated", "rejected", "deleted"]).default("validated"),
    fileName: z.string().min(1).max(255),
    mimeType: z.string().min(1).max(120),
    sizeBytes: z.number().int().positive().max(Number(process.env.CHAT_ATTACHMENT_MAX_BYTES ?? 5_242_880)),
    storageKey: z.string().min(1).max(1024),
    downloadUrl: z.string().min(1).max(2000).optional(),
  })
  .optional();

const schema = z.object({
  body: z.string().max(4000).optional().default(""),
  attachment: attachmentSchema,
});

export async function POST(request: Request, { params }: { params: ParamsInput }) {
  try {
    const actorResolved = await resolveApiActorFromRequest(request, "client");
  if (!actorResolved.ok) return actorResolved.response;
  const actor = actorResolved.actor;
    const { threadId } = await params;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });

    const result = addThreadMessage({
      threadId,
      actor,
      body: parsed.data.body,
      attachment: parsed.data.attachment,
    });
    if ("error" in result) return jsonError(String(result.error), 403);

    return jsonOk({
      actor,
      message: result.message,
      thread: result.thread,
    });
  } catch {
    return jsonError("No se pudo enviar el mensaje", 400);
  }
}

import { z } from "zod";
import { NextResponse } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { sendMessage } from "@/lib/conversation-service";
import { checkSendAllowance } from "@/lib/message-backpressure";

type ParamsInput = Promise<{ threadId: string }>;

const attachmentSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(["image", "pdf", "audio"]),
    status: z.enum(["uploaded", "validated", "rejected", "deleted"]).default("validated"),
    fileName: z.string().min(1).max(255),
    mimeType: z.string().min(1).max(120),
    sizeBytes: z.number().int().positive().max(Number(process.env.CHAT_ATTACHMENT_MAX_BYTES ?? 5_242_880)),
    storageKey: z.string().min(1).max(1024),
    downloadUrl: z.string().min(1).max(2000).optional(),
    durationMs: z.number().int().positive().max(Number(process.env.CHAT_AUDIO_MAX_DURATION_MS ?? 120_000)).optional(),
  })
  .optional();

const schema = z.object({
  body: z.string().max(4000).optional().default(""),
  attachment: attachmentSchema,
  clientRequestId: z.string().min(8).max(120),
});

export async function POST(request: Request, { params }: { params: ParamsInput }) {
  try {
    const auth = await requireApiRole(request, ["client", "coach"]);
    if (!auth.ok) return auth.response;
    const { threadId } = await params;
    const sendGate = checkSendAllowance({ userId: auth.user.id, threadId });
    if (!sendGate.allowed) {
      return NextResponse.json(
        {
          ok: false,
          message: "Demasiados mensajes en muy poco tiempo. Reintentando sin saturar el servidor.",
          serverHints: sendGate.serverHints,
        },
        { status: 429, headers: { "Retry-After": String(Math.ceil(sendGate.retryAfterMs / 1000)) } },
      );
    }
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });

    const result = await sendMessage({
      threadId,
      user: auth.user,
      body: parsed.data.body,
      attachment: parsed.data.attachment,
      clientRequestId: parsed.data.clientRequestId,
    });
    if ("error" in result) {
      const status =
        result.code === "NOT_FOUND"
          ? 404
          : result.code === "UNSUPPORTED"
            ? 409
            : result.code === "VALIDATION"
              ? 400
              : 403;
      return jsonError(result.error, status);
    }

    const threadSummary = {
      id: result.thread.id,
      status: result.thread.status,
      lastMessageAt: result.thread.lastMessageAt,
      unreadForCoach: result.thread.unreadForCoach,
      unreadForClient: result.thread.unreadForClient,
      messagesCount: result.thread.messagesCount,
    };

    return jsonOk({
      actor: { role: auth.user.role, userId: auth.user.id, displayName: auth.user.displayName ?? auth.user.email },
      message: result.message,
      thread: result.thread,
      threadSummary,
      deduped: result.deduped,
      serverHints: sendGate.serverHints,
    });
  } catch {
    return jsonError("No se pudo enviar el mensaje", 400);
  }
}

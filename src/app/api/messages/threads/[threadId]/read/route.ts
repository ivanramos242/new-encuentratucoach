import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { markThreadRead } from "@/lib/conversation-service";

type ParamsInput = Promise<{ threadId: string }>;

const schema = z.object({
  lastReadMessageId: z.string().min(1).optional(),
});

export async function POST(request: Request, { params }: { params: ParamsInput }) {
  const auth = await requireApiRole(request, ["client", "coach"]);
  if (!auth.ok) return auth.response;
  const { threadId } = await params;
  let payload: { lastReadMessageId?: string } = {};
  try {
    if (request.headers.get("content-type")?.includes("application/json")) {
      const body = await request.json();
      const parsed = schema.safeParse(body);
      if (!parsed.success) return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });
      payload = parsed.data;
    }
  } catch {
    // body optional
  }
  const result = await markThreadRead({ threadId, user: auth.user, lastReadMessageId: payload.lastReadMessageId });
  if ("error" in result) {
    const status = result.code === "NOT_FOUND" ? 404 : 403;
    return jsonError(result.error, status);
  }
  return jsonOk({
    actor: { role: auth.user.role, userId: auth.user.id, displayName: auth.user.displayName ?? auth.user.email },
    ...result,
  });
}

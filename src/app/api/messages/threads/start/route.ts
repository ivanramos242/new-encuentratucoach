import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { startOrGetThread } from "@/lib/conversation-service";

const schema = z.object({
  coachSlug: z.string().min(1).optional(),
  coachProfileId: z.string().min(1).optional(),
  source: z.string().min(1).max(300).optional(),
});

export async function POST(request: Request) {
  try {
    const auth = await requireApiRole(request, "client");
    if (!auth.ok) return auth.response;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });

    const result = await startOrGetThread({ user: auth.user, ...parsed.data });
    if ("error" in result) {
      const status = result.code === "NOT_FOUND" ? 404 : result.code === "CONFLICT" ? 409 : 403;
      return jsonError(result.error, status);
    }

    return jsonOk({
      actor: { role: auth.user.role, userId: auth.user.id, displayName: auth.user.displayName ?? auth.user.email },
      created: result.created,
      thread: result.thread,
    });
  } catch {
    return jsonError("No se pudo iniciar la conversacion", 400);
  }
}


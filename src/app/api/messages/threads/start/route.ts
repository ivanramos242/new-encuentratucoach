import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { getMockActorFromRequest } from "@/lib/mock-auth-context";
import { startOrGetThread } from "@/lib/v2-service";

const schema = z.object({
  coachSlug: z.string().min(1).optional(),
  coachProfileId: z.string().min(1).optional(),
  source: z.string().min(1).max(300).optional(),
});

export async function POST(request: Request) {
  try {
    const actor = getMockActorFromRequest(request, "client");
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });

    const result = startOrGetThread({ actor, ...parsed.data });
    if ("error" in result) return jsonError(String(result.error), 403);

    return jsonOk({
      actor,
      created: result.created,
      thread: result.thread,
    });
  } catch {
    return jsonError("No se pudo iniciar la conversacion", 400);
  }
}

import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { recordCoachProfileViewStart } from "@/lib/coach-profile-analytics";

export const runtime = "nodejs";

const schema = z.object({
  coachId: z.string().min(1),
  sessionId: z.string().min(1),
  startedAt: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400);

    await recordCoachProfileViewStart({
      coachId: parsed.data.coachId,
      sessionId: parsed.data.sessionId,
      startedAt: parsed.data.startedAt ?? null,
      request,
    });

    return jsonOk({
      status: "captured",
      event: "profile-view-start",
      coachId: parsed.data.coachId,
      sessionId: parsed.data.sessionId,
    });
  } catch (error) {
    console.error("[analytics/profile-view/start] error", error);
    return jsonError("No se pudo registrar la visita", 400);
  }
}


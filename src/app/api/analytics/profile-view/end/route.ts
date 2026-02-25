import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { recordCoachProfileViewEnd } from "@/lib/coach-profile-analytics";

export const runtime = "nodejs";

const schema = z.object({
  coachId: z.string().min(1),
  sessionId: z.string().min(1),
  durationSeconds: z.number().int().min(0).max(60 * 60 * 12).optional(),
  endedAt: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  try {
    const text = await request.text();
    const body = text ? (JSON.parse(text) as unknown) : {};
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400);

    const result = await recordCoachProfileViewEnd({
      coachId: parsed.data.coachId,
      sessionId: parsed.data.sessionId,
      durationSeconds: parsed.data.durationSeconds ?? null,
      endedAt: parsed.data.endedAt ?? null,
      request,
    });

    return jsonOk({
      status: "captured",
      event: "profile-view-end",
      coachId: parsed.data.coachId,
      durationSeconds: parsed.data.durationSeconds ?? null,
      counted: result.counted,
    });
  } catch (error) {
    console.error("[analytics/profile-view/end] error", error);
    return jsonError("No se pudo registrar el cierre de visita", 400);
  }
}


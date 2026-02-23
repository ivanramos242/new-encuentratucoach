import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";

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
    if (!parsed.success) return jsonError("Payload invÃ¡lido", 400);

    return jsonOk({
      status: "captured",
      event: "profile-view-end",
      coachId: parsed.data.coachId,
      durationSeconds: parsed.data.durationSeconds ?? null,
    });
  } catch {
    return jsonError("No se pudo registrar el cierre de visita", 400);
  }
}


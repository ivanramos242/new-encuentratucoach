import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { recordCoachProfileClick } from "@/lib/coach-profile-analytics";

export const runtime = "nodejs";

const schema = z.object({
  coachId: z.string().min(1),
  target: z.enum(["whatsapp", "phone", "email", "web", "linkedin", "instagram", "facebook", "mensaje"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400);

    await recordCoachProfileClick({
      coachId: parsed.data.coachId,
      target: parsed.data.target,
      request,
    });

    return jsonOk({
      status: "captured",
      event: "profile-click",
      coachId: parsed.data.coachId,
      target: parsed.data.target,
    });
  } catch (error) {
    console.error("[analytics/profile-click] error", error);
    return jsonError("No se pudo registrar el clic", 400);
  }
}


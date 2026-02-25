import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";

const schema = z.object({
  coachId: z.string().min(1),
  target: z.enum(["whatsapp", "phone", "email", "web", "linkedin", "instagram", "facebook", "mensaje"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload inválido", 400);

    return jsonOk({
      status: "captured",
      event: "profile-click",
      coachId: parsed.data.coachId,
      target: parsed.data.target,
    });
  } catch {
    return jsonError("No se pudo registrar el clic", 400);
  }
}


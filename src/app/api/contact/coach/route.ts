import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";

const contactSchema = z.object({
  coachId: z.string().min(1),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  message: z.string().min(10).max(5000),
  honeypot: z.string().optional().default(""),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Datos inválidos", 400, { issues: parsed.error.flatten() });
    }

    if (parsed.data.honeypot.trim()) {
      return jsonOk({ message: "OK" });
    }

    // V1 foundation: relay email + persistence will be wired to Nodemailer/DB in a later sprint.
    return jsonOk({
      message: "Mensaje recibido (relay pendiente de integración con email/DB).",
      coachId: parsed.data.coachId,
    });
  } catch {
    return jsonError("No se pudo procesar la solicitud", 400);
  }
}


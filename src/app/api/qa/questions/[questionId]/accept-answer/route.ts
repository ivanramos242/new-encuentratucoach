import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { resolveApiActorFromRequest } from "@/lib/mock-auth-context";
import { acceptQaAnswer } from "@/lib/v2-service";

type ParamsInput = Promise<{ questionId: string }>;

const schema = z.object({
  answerId: z.string().min(1),
});

export async function POST(request: Request, { params }: { params: ParamsInput }) {
  try {
    const actorResolved = await resolveApiActorFromRequest(request, "client");
  if (!actorResolved.ok) return actorResolved.response;
  const actor = actorResolved.actor;
    const { questionId } = await params;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });

    const result = acceptQaAnswer({
      actor,
      questionId,
      answerId: parsed.data.answerId,
    });
    if ("error" in result) return jsonError(String(result.error), 403);

    return jsonOk({
      actor,
      question: result.question,
      acceptedAnswer: result.answer,
    });
  } catch {
    return jsonError("No se pudo marcar respuesta aceptada", 400);
  }
}

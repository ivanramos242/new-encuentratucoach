import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { getMockActorFromRequest } from "@/lib/mock-auth-context";
import { addQaAnswer } from "@/lib/v2-service";

type ParamsInput = Promise<{ questionId: string }>;

const schema = z.object({
  body: z.string().min(20).max(4000),
  coachProfileId: z.string().min(1).optional(),
});

export async function POST(request: Request, { params }: { params: ParamsInput }) {
  try {
    const actor = getMockActorFromRequest(request, "coach");
    const { questionId } = await params;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });

    const result = addQaAnswer({
      actor,
      questionId,
      body: parsed.data.body,
      coachProfileId: parsed.data.coachProfileId,
    });
    if ("error" in result) return jsonError(String(result.error), 403);

    return jsonOk({
      actor,
      question: result.question,
      answer: result.answer,
      message: "Respuesta publicada (mock V2 con reportes/post-moderacion).",
    });
  } catch {
    return jsonError("No se pudo publicar la respuesta", 400);
  }
}

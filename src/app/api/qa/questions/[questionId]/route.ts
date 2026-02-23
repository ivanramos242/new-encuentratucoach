import { jsonError, jsonOk } from "@/lib/api-handlers";
import { getQaQuestionById } from "@/lib/v2-service";

type ParamsInput = Promise<{ questionId: string }>;

export async function GET(_request: Request, { params }: { params: ParamsInput }) {
  const { questionId } = await params;
  const question = getQaQuestionById(questionId);
  if (!question) return jsonError("Pregunta no encontrada", 404);
  return jsonOk({ question });
}


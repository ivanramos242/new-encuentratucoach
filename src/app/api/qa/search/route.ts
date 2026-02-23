import { jsonOk } from "@/lib/api-handlers";
import { listQaQuestions } from "@/lib/v2-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const questions = listQaQuestions({ q });
  return jsonOk({
    q,
    questions,
    noindex: true,
  });
}


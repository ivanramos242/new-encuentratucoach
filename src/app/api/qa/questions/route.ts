import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { resolveApiActorFromRequest } from "@/lib/mock-auth-context";
import { createQaQuestion, listQaQuestions } from "@/lib/v2-service";

const createSchema = z.object({
  title: z.string().min(8).max(180),
  body: z.string().min(20).max(4000),
  topicSlug: z.string().min(1).max(120),
  isAnonymous: z.boolean().optional().default(false),
  categorySlug: z.string().max(120).optional(),
  citySlug: z.string().max(120).optional(),
  tags: z.array(z.string().min(1).max(40)).max(6).optional(),
  honeypot: z.string().optional().default(""),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const questions = listQaQuestions({
    topicSlug: url.searchParams.get("topicSlug") ?? undefined,
    categorySlug: url.searchParams.get("categorySlug") ?? undefined,
    citySlug: url.searchParams.get("citySlug") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    tagSlug: url.searchParams.get("tagSlug") ?? undefined,
  });

  return jsonOk({
    questions,
    total: questions.length,
    page: Number(url.searchParams.get("page") ?? 1),
  });
}

export async function POST(request: Request) {
  try {
    const actorResolved = await resolveApiActorFromRequest(request, "client");
  if (!actorResolved.ok) return actorResolved.response;
  const actor = actorResolved.actor;
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });
    if (parsed.data.honeypot.trim()) return jsonOk({ message: "OK" });

    const result = createQaQuestion({
      actor,
      title: parsed.data.title,
      body: parsed.data.body,
      topicSlug: parsed.data.topicSlug,
      isAnonymous: parsed.data.isAnonymous,
      categorySlug: parsed.data.categorySlug,
      citySlug: parsed.data.citySlug,
      tags: parsed.data.tags,
    });
    if ("error" in result) return jsonError(String(result.error), 400);

    return jsonOk({
      actor,
      question: result.question,
      message: "Pregunta creada y publicada (mock V2 con post-moderacion).",
    });
  } catch {
    return jsonError("No se pudo crear la pregunta", 400);
  }
}


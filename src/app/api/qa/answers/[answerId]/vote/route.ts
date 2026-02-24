import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { resolveApiActorFromRequest } from "@/lib/mock-auth-context";
import { voteQaAnswer } from "@/lib/v2-service";

type ParamsInput = Promise<{ answerId: string }>;

const schema = z.object({
  voteType: z.enum(["up", "down"]),
});

export async function POST(request: Request, { params }: { params: ParamsInput }) {
  try {
    const actorResolved = await resolveApiActorFromRequest(request, "client");
  if (!actorResolved.ok) return actorResolved.response;
  const actor = actorResolved.actor;
    const { answerId } = await params;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });

    const result = voteQaAnswer({ actor, answerId, voteType: parsed.data.voteType });
    if ("error" in result) return jsonError(String(result.error), 404);
    return jsonOk({ actor, ...result });
  } catch {
    return jsonError("No se pudo registrar el voto", 400);
  }
}

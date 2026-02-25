import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { getThreadForUser } from "@/lib/conversation-service";

type ParamsInput = Promise<{ threadId: string }>;

export async function GET(request: Request, { params }: { params: ParamsInput }) {
  const auth = await requireApiRole(request, ["client", "coach"]);
  if (!auth.ok) return auth.response;
  const { threadId } = await params;
  const result = await getThreadForUser(threadId, auth.user);
  if ("error" in result) {
    const status = result.code === "NOT_FOUND" ? 404 : 403;
    return jsonError(result.error, status);
  }
  return jsonOk({
    actor: { role: auth.user.role, userId: auth.user.id, displayName: auth.user.displayName ?? auth.user.email },
    thread: result.thread,
  });
}

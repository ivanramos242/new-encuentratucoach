import { NextResponse } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { pollThreadMessages } from "@/lib/conversation-service";
import { checkPollAllowance } from "@/lib/message-backpressure";

type ParamsInput = Promise<{ threadId: string }>;

export async function GET(request: Request, { params }: { params: ParamsInput }) {
  const auth = await requireApiRole(request, ["client", "coach"]);
  if (!auth.ok) return auth.response;
  const { threadId } = await params;
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") ?? url.searchParams.get("since");
  const modeRaw = url.searchParams.get("mode");
  const mode =
    modeRaw === "background" || modeRaw === "inbox" ? modeRaw : "foreground";
  const pollGate = checkPollAllowance({ userId: auth.user.id, threadId, mode });
  if (!pollGate.allowed) {
    return NextResponse.json(
      { ok: false, message: "Polling demasiado frecuente.", serverHints: pollGate.serverHints },
      { status: 429, headers: { "Retry-After": String(Math.ceil(pollGate.retryAfterMs / 1000)) } },
    );
  }

  const result = await pollThreadMessages({ threadId, user: auth.user, cursor });
  if ("error" in result) {
    const status = result.code === "NOT_FOUND" ? 404 : 403;
    return jsonError(result.error, status);
  }
  return jsonOk({
    actor: { role: auth.user.role, userId: auth.user.id, displayName: auth.user.displayName ?? auth.user.email },
    threadId: result.threadId,
    items: result.items,
    nextCursor: result.nextCursor,
    serverTime: result.serverTime,
    pollIntervalMs: pollGate.serverHints.suggestedPollMs,
    serverHints: pollGate.serverHints,
  });
}

import { NextResponse } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { checkPollAllowance } from "@/lib/message-backpressure";
import { listThreadsForUser } from "@/lib/conversation-service";

export async function GET(request: Request) {
  const auth = await requireApiRole(request, ["client", "coach"]);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const mode = (url.searchParams.get("mode") as "foreground" | "background" | "inbox" | null) ?? "inbox";
  const pollGate = checkPollAllowance({ userId: auth.user.id, mode: mode === "foreground" ? "inbox" : mode });
  if (!pollGate.allowed) {
    return NextResponse.json(
      { ok: false, message: "Demasiadas peticiones de inbox. Inténtalo en unos segundos.", serverHints: pollGate.serverHints },
      { status: 429, headers: { "Retry-After": String(Math.ceil(pollGate.retryAfterMs / 1000)) } },
    );
  }

  const result = await listThreadsForUser(auth.user);
  if ("error" in result) return jsonError(result.error, result.code === "FORBIDDEN" ? 403 : 400);

  return jsonOk({
    actor: { role: auth.user.role, userId: auth.user.id, displayName: auth.user.displayName ?? auth.user.email },
    threads: result.threads,
    pollIntervalMs: pollGate.serverHints.suggestedPollMs,
    serverHints: pollGate.serverHints,
  });
}



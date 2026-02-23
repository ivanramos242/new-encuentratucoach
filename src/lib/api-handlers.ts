import { NextResponse } from "next/server";

export function jsonOk<T extends Record<string, unknown>>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init);
}

export function jsonError(message: string, status = 400, details?: Record<string, unknown>) {
  return NextResponse.json(
    {
      ok: false,
      message,
      ...(details ?? {}),
    },
    { status },
  );
}

export function notImplementedYet(route: string) {
  return jsonError("Endpoint scaffolded but not implemented yet", 501, { route, status: "stub" });
}

export function methodNotAllowed(method: string) {
  return jsonError(`Method ${method} not allowed`, 405);
}

export function unauthorized(message = "Unauthorized") {
  return jsonError(message, 401);
}

export function forbidden(message = "Forbidden") {
  return jsonError(message, 403);
}

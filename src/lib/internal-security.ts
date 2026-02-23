import { forbidden, unauthorized } from "@/lib/api-handlers";

export function requireInternalCronSecret(request: Request) {
  const expected = process.env.INTERNAL_CRON_SECRET;
  if (!expected) {
    return forbidden("INTERNAL_CRON_SECRET not configured");
  }

  const authHeader = request.headers.get("authorization");
  const xInternalSecret = request.headers.get("x-internal-secret");

  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  const provided = bearer ?? xInternalSecret;

  if (!provided) return unauthorized("Missing internal secret");
  if (provided !== expected) return forbidden("Invalid internal secret");
  return null;
}

import { createHash } from "node:crypto";

function sanitizeHeaderValue(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9:_-]/g, "").slice(0, 120);
}

export function getStripeIdempotencyKey(
  request: Request,
  input: {
    scope: string;
    userId?: string | null;
    entityId?: string | null;
    timeBucketMs?: number;
  },
) {
  const header = request.headers.get("idempotency-key");
  if (header?.trim()) {
    const clean = sanitizeHeaderValue(header);
    if (clean) return `${input.scope}:${clean}`;
  }

  const bucketMs = input.timeBucketMs ?? 120_000;
  const bucket = Math.floor(Date.now() / bucketMs);
  const digest = createHash("sha256")
    .update(
      JSON.stringify({
        scope: input.scope,
        userId: input.userId ?? null,
        entityId: input.entityId ?? null,
        bucket,
      }),
    )
    .digest("hex")
    .slice(0, 32);

  return `${input.scope}:auto:${digest}`;
}


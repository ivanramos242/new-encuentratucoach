import { NextResponse } from "next/server";

type Bucket = { ticks: number[] };

declare global {
  var __etcRateLimitBuckets: Map<string, Bucket> | undefined;
}

const buckets = global.__etcRateLimitBuckets ?? new Map<string, Bucket>();
if (!global.__etcRateLimitBuckets) global.__etcRateLimitBuckets = buckets;

function now() {
  return Date.now();
}

function getBucket(key: string) {
  const bucket = buckets.get(key) ?? { ticks: [] };
  buckets.set(key, bucket);
  return bucket;
}

function trim(bucket: Bucket, windowMs: number, at: number) {
  const cutoff = at - windowMs;
  while (bucket.ticks.length && bucket.ticks[0] <= cutoff) bucket.ticks.shift();
}

export function checkRateLimit(input: { key: string; limit: number; windowMs: number }) {
  const at = now();
  const bucket = getBucket(input.key);
  trim(bucket, input.windowMs, at);

  if (bucket.ticks.length >= input.limit) {
    const oldest = bucket.ticks[0] ?? at;
    const retryAfterMs = Math.max(250, input.windowMs - (at - oldest));
    return {
      allowed: false as const,
      retryAfterMs,
      remaining: 0,
    };
  }

  bucket.ticks.push(at);
  return {
    allowed: true as const,
    retryAfterMs: 0,
    remaining: Math.max(0, input.limit - bucket.ticks.length),
  };
}

export function rateLimitExceededResponse(message: string, retryAfterMs: number, details?: Record<string, unknown>) {
  return NextResponse.json(
    {
      ok: false,
      code: "RATE_LIMITED",
      message,
      ...(details ?? {}),
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
      },
    },
  );
}

export function getClientIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function applyEndpointRateLimit(
  request: Request,
  input: {
    namespace: string;
    keyParts?: Array<string | number | null | undefined>;
    limit: number;
    windowMs: number;
    message?: string;
  },
) {
  const key = [
    "rl",
    input.namespace,
    getClientIp(request),
    ...(input.keyParts ?? []).map((v) => String(v ?? "")),
  ].join(":");

  const result = checkRateLimit({ key, limit: input.limit, windowMs: input.windowMs });
  if (result.allowed) return null;
  return rateLimitExceededResponse(
    input.message ?? "Demasiadas solicitudes. Inténtalo de nuevo en unos segundos.",
    result.retryAfterMs,
  );
}

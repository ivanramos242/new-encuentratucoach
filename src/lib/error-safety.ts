export function publicErrorMessage(
  error: unknown,
  fallback: string,
  options?: { exposeInDevelopment?: boolean; redactPatterns?: RegExp[] },
) {
  const expose = options?.exposeInDevelopment ?? true;
  if (process.env.NODE_ENV === "production") return fallback;
  if (!expose) return fallback;
  if (!(error instanceof Error)) return fallback;

  let message = error.message || fallback;
  const patterns = options?.redactPatterns ?? [
    /(sk_(live|test)_[a-zA-Z0-9]+)/g,
    /(whsec_[a-zA-Z0-9]+)/g,
    /(Bearer\s+[A-Za-z0-9._-]+)/gi,
  ];
  for (const pattern of patterns) {
    message = message.replace(pattern, "[redacted]");
  }
  return message;
}


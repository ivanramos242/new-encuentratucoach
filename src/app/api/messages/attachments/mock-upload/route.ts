type StoredBlob = {
  bytes: Uint8Array;
  contentType: string;
  updatedAt: number;
};

declare global {
  var __messageMockUploadStore: Map<string, StoredBlob> | undefined;
}

const store = global.__messageMockUploadStore ?? new Map<string, StoredBlob>();
if (!global.__messageMockUploadStore) global.__messageMockUploadStore = store;

function getKey(request: Request) {
  const url = new URL(request.url);
  return url.searchParams.get("key")?.trim() || "";
}

export async function PUT(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }
  const key = getKey(request);
  if (!key) return new Response("Missing key", { status: 400 });
  const bytes = new Uint8Array(await request.arrayBuffer());
  store.set(key, {
    bytes,
    contentType: request.headers.get("content-type") || "application/octet-stream",
    updatedAt: Date.now(),
  });
  return new Response(null, { status: 200 });
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }
  const key = getKey(request);
  if (!key) return new Response("Missing key", { status: 400 });
  const item = store.get(key);
  if (!item) return new Response("Not found", { status: 404 });
  return new Response(item.bytes as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": item.contentType,
      "Cache-Control": "no-store",
    },
  });
}

import { jsonOk } from "@/lib/api-handlers";
import { getQaPollSnapshot } from "@/lib/v2-service";

export async function GET() {
  return jsonOk({
    pollIntervalMs: Number(process.env.MESSAGE_POLL_INTERVAL_MS ?? 300_000),
    snapshot: getQaPollSnapshot(),
    note: "Polling opcional para paneles privados del autor o coach participante.",
  });
}


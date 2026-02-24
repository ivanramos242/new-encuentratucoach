import { jsonOk } from "@/lib/api-handlers";
import { getSessionUserFromRequest } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getSessionUserFromRequest(request);
  return jsonOk(
    { authenticated: Boolean(user), user },
    {
      headers: {
        "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        pragma: "no-cache",
        expires: "0",
      },
    },
  );
}

import { jsonOk } from "@/lib/api-handlers";
import { getSessionUserFromRequest } from "@/lib/auth-session";

export async function GET(request: Request) {
  const user = await getSessionUserFromRequest(request);
  return jsonOk({ authenticated: Boolean(user), user });
}


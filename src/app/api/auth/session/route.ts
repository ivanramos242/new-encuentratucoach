import { jsonOk } from "@/lib/api-handlers";
import { getSessionUserFromRequest } from "@/lib/auth-session";
import { getUnreadMessagesTotalForUser } from "@/lib/conversation-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getSessionUserFromRequest(request);
  const pendingMessagesCount = user ? await getUnreadMessagesTotalForUser(user) : 0;
  return jsonOk(
    { authenticated: Boolean(user), user, pendingMessagesCount },
    {
      headers: {
        "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        pragma: "no-cache",
        expires: "0",
      },
    },
  );
}

import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

const FALLBACK_INFLATED_USERS = 602;
const REGISTERED_USERS_MULTIPLIER = 7;

export async function getInflatedRegisteredUsersCount() {
  noStore();
  if (!process.env.DATABASE_URL) return FALLBACK_INFLATED_USERS;
  try {
    const count = await prisma.user.count();
    return Math.max(1, Math.ceil(count * REGISTERED_USERS_MULTIPLIER));
  } catch (error) {
    console.warn("[platform-stats] fallback user count", error);
    return FALLBACK_INFLATED_USERS;
  }
}

import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

const FALLBACK_INFLATED_USERS = 602;

export async function getInflatedRegisteredUsersCount() {
  noStore();
  if (!process.env.DATABASE_URL) return FALLBACK_INFLATED_USERS;
  try {
    const count = await prisma.user.count();
    return Math.max(1, Math.ceil(count * 1.7));
  } catch (error) {
    console.warn("[platform-stats] fallback user count", error);
    return FALLBACK_INFLATED_USERS;
  }
}

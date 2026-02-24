import { z } from "zod";
import { SubscriptionPlanCode } from "@prisma/client";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { listMembershipPlansForAdmin, upsertMembershipPlanDiscount } from "@/lib/membership-plan-service";

const schema = z.object({
  code: z.nativeEnum(SubscriptionPlanCode),
  priceCents: z.number().int().min(0).max(1_000_000).optional(),
  discountPercent: z.number().int().min(0).max(95).nullable().optional(),
  discountLabel: z.string().max(120).nullable().optional(),
  discountEndsAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: Request) {
  const auth = await requireApiRole(request, "admin");
  if (!auth.ok) return auth.response;
  const plans = await listMembershipPlansForAdmin();
  return jsonOk({ plans });
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiRole(request, "admin");
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });

    const plan = await upsertMembershipPlanDiscount({
      code: parsed.data.code,
      priceCents: parsed.data.priceCents,
      discountPercent: parsed.data.discountPercent ?? null,
      discountLabel: parsed.data.discountLabel ?? null,
      discountEndsAt: parsed.data.discountEndsAt ? new Date(parsed.data.discountEndsAt) : null,
      isActive: parsed.data.isActive,
    });

    return jsonOk({ plan, message: "Plan actualizado" });
  } catch (error) {
    console.error("[admin/subscription-plans] error", error);
    return jsonError("No se pudo actualizar el plan", 500);
  }
}


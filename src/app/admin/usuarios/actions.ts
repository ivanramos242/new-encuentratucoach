"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/utils";
import { requireRole } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

function getString(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

async function uniqueCoachSlug(base: string, findBySlug: (slug: string) => Promise<{ id: string } | null>) {
  const normalized = slugify(base) || "coach";
  let slug = normalized;
  let i = 2;
  while (await findBySlug(slug)) {
    slug = `${normalized}-${i++}`;
  }
  return slug;
}

function buildCoachName(input: { displayName?: string | null; email: string }) {
  return (input.displayName || input.email.split("@")[0] || "Coach").trim();
}

export async function changeUserRoleAction(formData: FormData) {
  await requireRole("admin", { returnTo: "/admin/usuarios" });

  const userId = getString(formData, "userId");
  const targetRole = getString(formData, "targetRole");
  if (!userId || (targetRole !== "client" && targetRole !== "coach")) {
    redirect("/admin/usuarios?error=invalid-payload");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      coachProfiles: {
        select: { id: true },
      },
    },
  });

  if (!user) redirect("/admin/usuarios?error=not-found");
  if (user.role === "admin") redirect("/admin/usuarios?error=admin-not-editable");

  if (user.role === targetRole) {
    const sameParams = new URLSearchParams({
      updated: "1",
      email: user.email,
      from: user.role,
      to: targetRole,
      createdCoach: "0",
      drafted: "0",
    });
    redirect(`/admin/usuarios?${sameParams.toString()}`);
  }

  let createdCoachProfile = 0;
  let draftedProfiles = 0;

  await prisma.$transaction(async (tx) => {
    if (targetRole === "coach") {
      await tx.user.update({
        where: { id: user.id },
        data: { role: "coach" },
      });

      if (!user.coachProfiles.length) {
        const name = buildCoachName({ displayName: user.displayName, email: user.email });
        const slug = await uniqueCoachSlug(name, (nextSlug) =>
          tx.coachProfile.findUnique({ where: { slug: nextSlug }, select: { id: true } }),
        );
        await tx.coachProfile.create({
          data: {
            userId: user.id,
            name,
            slug,
            profileStatus: "draft",
            visibilityStatus: "inactive",
            certifiedStatus: "none",
            messagingEnabled: true,
          },
        });
        createdCoachProfile = 1;
      }
    } else {
      await tx.user.update({
        where: { id: user.id },
        data: { role: "client" },
      });

      const drafted = await tx.coachProfile.updateMany({
        where: { userId: user.id },
        data: {
          profileStatus: "draft",
          visibilityStatus: "inactive",
        },
      });
      draftedProfiles = drafted.count;
    }

    await tx.authSession.deleteMany({
      where: { userId: user.id },
    });
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/coaches");
  revalidatePath("/coaches");

  const params = new URLSearchParams({
    updated: "1",
    email: user.email,
    from: user.role,
    to: targetRole,
    createdCoach: String(createdCoachProfile),
    drafted: String(draftedProfiles),
  });
  redirect(`/admin/usuarios?${params.toString()}`);
}

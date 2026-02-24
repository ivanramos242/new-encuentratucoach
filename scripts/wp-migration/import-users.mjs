import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ARGON_OPTIONS = {
  algorithm: 2,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
};

function parseArgs(argv) {
  const out = {
    file: "wp_users.json",
    commit: false,
    forceResetExisting: false,
    clientsOnly: false,
    adminEmails: [],
    verbose: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--commit") {
      out.commit = true;
      continue;
    }
    if (token === "--dry-run") {
      out.commit = false;
      continue;
    }
    if (token === "--force-reset-existing") {
      out.forceResetExisting = true;
      continue;
    }
    if (token === "--clients-only") {
      out.clientsOnly = true;
      continue;
    }
    if (token === "--verbose") {
      out.verbose = true;
      continue;
    }
    if (token === "--file") {
      out.file = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--admin-email") {
      if (argv[i + 1]) out.adminEmails.push(argv[i + 1]);
      i += 1;
      continue;
    }
    if (token === "--admin-emails") {
      const value = argv[i + 1] || "";
      out.adminEmails.push(...value.split(",").map((v) => v.trim()).filter(Boolean));
      i += 1;
      continue;
    }
    if (!token.startsWith("--") && out.file === "wp_users.json") {
      out.file = token;
    }
  }
  return out;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function parsePhpMyAdminExport(json) {
  const rows = Array.isArray(json) ? json : [];
  const usersTable = rows.find((entry) => entry?.type === "table" && /_users$/i.test(String(entry?.name || "")));
  const userMetaTable = rows.find((entry) => entry?.type === "table" && /_usermeta$/i.test(String(entry?.name || "")));
  return {
    wpUsersRows: Array.isArray(usersTable?.data) ? usersTable.data : [],
    wpUserMetaRows: Array.isArray(userMetaTable?.data) ? userMetaTable.data : [],
    usersTableName: usersTable?.name || null,
    userMetaTableName: userMetaTable?.name || null,
  };
}

function inferRoleFromUserMeta(userId, userMetaRows, adminEmails, email, coachEmails, options = {}) {
  if (adminEmails.has(email)) return "admin";
  if (options.clientsOnly) return "client";
  if (coachEmails.has(email)) return "coach";

  const metas = userMetaRows.filter((row) => String(row.user_id || "") === String(userId));
  const capRow = metas.find((row) => /capabilities$/i.test(String(row.meta_key || "")));
  const raw = String(capRow?.meta_value || "");
  if (/administrator/i.test(raw)) return "admin";
  if (/(author|coach|professional|profesional)/i.test(raw)) return "coach";
  return "client";
}

function displayNameFromRow(row) {
  return String(row.display_name || row.user_login || row.user_email || "").trim() || null;
}

function sanitizeWpUsers(rows) {
  const seenByEmail = new Map();
  const invalid = [];
  const duplicates = [];

  for (const row of rows) {
    const email = normalizeEmail(row.user_email);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      invalid.push({ id: row.ID, email: row.user_email || null, user_login: row.user_login || null });
      continue;
    }
    const current = {
      wpId: String(row.ID),
      userLogin: String(row.user_login || "").trim() || null,
      email,
      displayName: displayNameFromRow(row),
      registeredAt: row.user_registered ? new Date(String(row.user_registered).replace(" ", "T") + "Z") : null,
      status: Number(row.user_status || 0),
      raw: row,
    };

    const existing = seenByEmail.get(email);
    if (!existing) {
      seenByEmail.set(email, current);
      continue;
    }

    // Keep the oldest WP ID by registration date as canonical, report the duplicate.
    duplicates.push({ keptWpId: existing.wpId, droppedWpId: current.wpId, email });
    const existingTime = existing.registeredAt?.getTime() || Number.MAX_SAFE_INTEGER;
    const currentTime = current.registeredAt?.getTime() || Number.MAX_SAFE_INTEGER;
    if (currentTime < existingTime) {
      seenByEmail.set(email, current);
    }
  }

  return { users: Array.from(seenByEmail.values()), invalid, duplicates };
}

function rolePriority(role) {
  if (role === "admin") return 3;
  if (role === "coach") return 2;
  return 1;
}

async function getCoachInferenceEmailSet() {
  const [coachOwners, coachEmailLinks] = await Promise.all([
    prisma.coachProfile.findMany({
      where: { userId: { not: null } },
      include: { owner: { select: { email: true } } },
    }),
    prisma.coachLink.findMany({
      where: { type: "email" },
      select: { value: true },
    }),
  ]);

  const emails = new Set();
  for (const row of coachOwners) {
    if (row.owner?.email) emails.add(normalizeEmail(row.owner.email));
  }
  for (const row of coachEmailLinks) {
    if (row.value) emails.add(normalizeEmail(row.value));
  }
  return emails;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const filePath = path.resolve(process.cwd(), args.file);
  const raw = await fs.readFile(filePath, "utf8");
  const json = JSON.parse(raw);
  const { wpUsersRows, wpUserMetaRows, usersTableName, userMetaTableName } = parsePhpMyAdminExport(json);

  if (!wpUsersRows.length) {
    console.error("No se ha encontrado una tabla *_users en el JSON exportado.");
    process.exit(1);
  }

  const adminEmails = new Set(args.adminEmails.map(normalizeEmail).filter(Boolean));
  const canUseDb = Boolean(process.env.DATABASE_URL);
  if (args.commit && !canUseDb) {
    console.error("Falta DATABASE_URL. Para --commit necesitas conexión a la base de datos.");
    process.exit(1);
  }

  let coachEmails = new Set();
  if (canUseDb) {
    coachEmails = await getCoachInferenceEmailSet();
  } else if (!args.commit) {
    console.warn("[wp-users-import] DATABASE_URL no configurada: dry-run sin inferencia de coaches desde la plataforma (todos salvo adminWhitelist => client).");
  }
  const sanitized = sanitizeWpUsers(wpUsersRows);

  const importedPasswordSeed = randomBytes(32).toString("hex");
  const importedPasswordHash = await hash(importedPasswordSeed, ARGON_OPTIONS);

  let created = 0;
  let updated = 0;
  let skippedExisting = 0;
  let legacyMapped = 0;
  const roleCounts = { admin: 0, coach: 0, client: 0 };
  const collisions = [];

  for (const wpUser of sanitized.users) {
    const role = inferRoleFromUserMeta(wpUser.wpId, wpUserMetaRows, adminEmails, wpUser.email, coachEmails, {
      clientsOnly: args.clientsOnly,
    });
    roleCounts[role] += 1;

    const existingMap = canUseDb
      ? await prisma.legacyImportMap.findUnique({
          where: {
            sourceSystem_sourceType_sourceId: {
              sourceSystem: "wordpress",
              sourceType: "user",
              sourceId: wpUser.wpId,
            },
          },
        })
      : null;

    const existingByEmail = canUseDb
      ? await prisma.user.findUnique({
          where: { email: wpUser.email },
          select: { id: true, email: true, role: true, mustResetPassword: true },
        })
      : null;

    const payload = {
      wpId: wpUser.wpId,
      userLogin: wpUser.userLogin,
      usersTableName,
      userMetaTableName,
      importedAt: new Date().toISOString(),
    };

    if (!args.commit) {
      if (!existingByEmail) created += 1;
      else if (args.forceResetExisting || rolePriority(role) > rolePriority(existingByEmail.role)) updated += 1;
      else skippedExisting += 1;
      if (existingMap) legacyMapped += 1;
      continue;
    }

    let targetUserId = existingByEmail?.id || null;

    if (!existingByEmail) {
      const user = await prisma.user.create({
        data: {
          email: wpUser.email,
          displayName: wpUser.displayName,
          role,
          isActive: true,
          passwordHash: importedPasswordHash,
          mustResetPassword: true,
        },
        select: { id: true },
      });
      targetUserId = user.id;
      created += 1;
    } else {
      const nextRole = rolePriority(role) > rolePriority(existingByEmail.role) ? role : existingByEmail.role;
      const shouldUpdate =
        args.forceResetExisting ||
        nextRole !== existingByEmail.role ||
        existingByEmail.mustResetPassword !== true;
      if (shouldUpdate) {
        await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            role: nextRole,
            ...(args.forceResetExisting
              ? { passwordHash: importedPasswordHash, mustResetPassword: true }
              : { mustResetPassword: existingByEmail.mustResetPassword || false }),
          },
        });
        updated += 1;
      } else {
        skippedExisting += 1;
      }

      if (existingByEmail.email !== wpUser.email) {
        collisions.push({ wpId: wpUser.wpId, wpEmail: wpUser.email, appEmail: existingByEmail.email });
      }
    }

    if (!targetUserId) continue;

    await prisma.legacyImportMap.upsert({
      where: {
        sourceSystem_sourceType_sourceId: {
          sourceSystem: "wordpress",
          sourceType: "user",
          sourceId: wpUser.wpId,
        },
      },
      create: {
        sourceSystem: "wordpress",
        sourceType: "user",
        sourceId: wpUser.wpId,
        targetTable: "User",
        targetId: targetUserId,
        payload,
      },
      update: {
        targetId: targetUserId,
        payload,
      },
    });
    legacyMapped += 1;
  }

  const summary = {
    mode: args.commit ? "commit" : "dry-run",
    filePath,
    usersTableName,
    userMetaTableName,
    totalRows: wpUsersRows.length,
    candidateUsers: sanitized.users.length,
    invalidRows: sanitized.invalid.length,
    duplicateEmailsInWp: sanitized.duplicates.length,
    created,
    updated,
    skippedExisting,
    legacyMapped,
    roleCounts,
    adminWhitelistCount: adminEmails.size,
    inferredCoachEmailsFromPlatform: coachEmails.size,
    forceResetExisting: args.forceResetExisting,
    clientsOnly: args.clientsOnly,
  };

  console.log(JSON.stringify(summary, null, 2));
  if (sanitized.invalid.length) {
    console.log("\nMuestras invalidRows (max 10):");
    console.log(JSON.stringify(sanitized.invalid.slice(0, 10), null, 2));
  }
  if (sanitized.duplicates.length) {
    console.log("\nMuestras duplicateEmailsInWp (max 10):");
    console.log(JSON.stringify(sanitized.duplicates.slice(0, 10), null, 2));
  }
  if (args.verbose && collisions.length) {
    console.log("\nColisiones email existentes:");
    console.log(JSON.stringify(collisions, null, 2));
  }

  if (!args.commit) {
    console.log("\nDry-run completado. Para aplicar cambios usa --commit.");
  } else {
    console.log("\nImportacion aplicada. Usuarios importados con mustResetPassword=true (nuevos).");
    if (!args.forceResetExisting) {
      console.log("Nota: usuarios ya existentes NO se han forzado a reset por seguridad. Usa --force-reset-existing si lo necesitas.");
    }
  }
}

main()
  .catch((error) => {
    console.error("Error en importacion de usuarios WP:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });

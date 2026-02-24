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
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--create") {
      out.create = true;
      continue;
    }
    if (token === "--email") {
      out.email = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--password") {
      out.password = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--name") {
      out.name = argv[i + 1];
      i += 1;
      continue;
    }
    if (!token.startsWith("--") && !out.email) out.email = token;
  }
  return out;
}

function usage() {
  console.log("Uso:");
  console.log("  npm run user:make-admin -- tuemail@dominio.com");
  console.log('  npm run user:make-admin -- --create --email admin@dominio.com --password "TuPassword123!" --name "Admin"');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = (args.email || "").trim().toLowerCase();
  if (!email) {
    usage();
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (existing) {
    const data = {
      role: "admin",
      isActive: true,
    };
    if (args.password) {
      if (String(args.password).length < 8) {
        console.error("Si indicas --password para un usuario existente, debe tener minimo 8 caracteres.");
        process.exit(1);
      }
      data.passwordHash = await hash(String(args.password), ARGON_OPTIONS);
      data.mustResetPassword = false;
    }
    if (args.name && String(args.name).trim()) {
      data.displayName = String(args.name).trim();
    }
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data,
      select: { id: true, email: true, role: true, isActive: true, displayName: true },
    });
    console.log("Usuario promocionado a admin:", updated);
    return;
  }

  if (!args.create) {
    console.error("No existe un usuario con ese email. Usa --create para crearlo como admin.");
    process.exit(1);
  }

  if (!args.password || String(args.password).length < 8) {
    console.error("Debes indicar --password (minimo 8 caracteres).");
    process.exit(1);
  }

  const passwordHash = await hash(String(args.password), ARGON_OPTIONS);
  const created = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: (args.name || "Admin").trim(),
      role: "admin",
      isActive: true,
      mustResetPassword: false,
    },
    select: { id: true, email: true, role: true, isActive: true },
  });

  console.log("Admin creado:", created);
}

main()
  .catch((error) => {
    console.error("Error creando/promocionando admin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });

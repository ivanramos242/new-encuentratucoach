import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth-password";

type Args = {
  email?: string;
  create?: boolean;
  password?: string;
  name?: string;
};

function parseArgs(argv: string[]): Args {
  const out: Args = {};
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
    if (!token.startsWith("--") && !out.email) {
      out.email = token;
    }
  }
  return out;
}

function usage() {
  console.log("Uso:");
  console.log("  npm run user:make-admin -- email@dominio.com");
  console.log("  npm run user:make-admin -- --create --email email@dominio.com --password 'TuPass123!' --name 'Nombre'");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = (args.email || "").trim().toLowerCase();
  if (!email) {
    usage();
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true, isActive: true } });
  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { role: "admin", isActive: true },
      select: { id: true, email: true, role: true, isActive: true },
    });
    console.log("Usuario promocionado a admin:", updated);
    return;
  }

  if (!args.create) {
    console.error("No existe un usuario con ese email. Usa --create para crearlo como admin.");
    process.exit(1);
  }

  if (!args.password || args.password.length < 8) {
    console.error("Para crear admin, debes indicar --password con al menos 8 caracteres.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(args.password);
  const created = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: args.name?.trim() || "Admin",
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

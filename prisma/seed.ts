import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

type SeedUser = {
  email: string;
  name: string;
  role: Role;
  companyName?: string;
  department?: string;
};

const seedUsers: SeedUser[] = [
  {
    email: "owner@genxdigitizing.com",
    name: "Super Admin",
    role: Role.SUPER_ADMIN,
    department: "Executive",
  },
  {
    email: "manager@genxdigitizing.com",
    name: "Operations Manager",
    role: Role.MANAGER,
    department: "Operations",
  },
  {
    email: "designer@genxdigitizing.com",
    name: "Lead Designer",
    role: Role.DESIGNER,
    department: "Design",
  },
  {
    email: "support@genxdigitizing.com",
    name: "Chat Support",
    role: Role.CHAT_SUPPORT,
    department: "Support",
  },
  {
    email: "marketing@genxdigitizing.com",
    name: "Marketing Manager",
    role: Role.MARKETING,
    department: "Marketing",
  },
  {
    email: "client@genxdigitizing.com",
    name: "Demo Client",
    role: Role.CLIENT,
    companyName: "Demo Client Co.",
  },
];

async function upsertUsers(passwordHash: string) {
  for (const entry of seedUsers) {
    await prisma.user.upsert({
      where: {
        email: entry.email,
      },
      update: {
        name: entry.name,
        role: entry.role,
        passwordHash,
        isActive: true,
        onboardingComplete: entry.role !== Role.CLIENT,
        auditTotpEnabled: entry.role === Role.SUPER_ADMIN ? false : undefined,
        clientProfile:
          entry.role === Role.CLIENT
            ? {
                upsert: {
                  update: {
                    companyName: entry.companyName ?? null,
                  },
                  create: {
                    companyName: entry.companyName ?? null,
                  },
                },
              }
            : undefined,
        staffProfile:
          entry.role !== Role.CLIENT
            ? {
                upsert: {
                  update: {
                    displayName: entry.name,
                    department: entry.department ?? entry.role,
                  },
                  create: {
                    displayName: entry.name,
                    department: entry.department ?? entry.role,
                  },
                },
              }
            : undefined,
      },
      create: {
        name: entry.name,
        email: entry.email,
        role: entry.role,
        passwordHash,
        isActive: true,
        onboardingComplete: entry.role !== Role.CLIENT,
        auditTotpEnabled: false,
        ...(entry.role === Role.CLIENT
          ? {
              clientProfile: {
                create: {
                  companyName: entry.companyName ?? null,
                },
              },
            }
          : {
              staffProfile: {
                create: {
                  displayName: entry.name,
                  department: entry.department ?? entry.role,
                },
              },
            }),
      },
    });
  }
}

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);

  await upsertUsers(passwordHash);

  console.log("Accounts seed complete.");
  console.log("SUPER_ADMIN: owner@genxdigitizing.com / ChangeMe123!");
  console.log("MANAGER: manager@genxdigitizing.com / ChangeMe123!");
  console.log("DESIGNER: designer@genxdigitizing.com / ChangeMe123!");
  console.log("CHAT_SUPPORT: support@genxdigitizing.com / ChangeMe123!");
  console.log("MARKETING: marketing@genxdigitizing.com / ChangeMe123!");
  console.log("CLIENT: client@genxdigitizing.com / ChangeMe123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
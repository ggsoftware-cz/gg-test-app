import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { env } from "@/app/lib/env";

// Prisma 7 requires a driver adapter. PrismaPg works with any PostgreSQL
// (local Docker, Neon, RDS…). For serverless-heavy Neon workloads consider
// @prisma/adapter-neon (HTTP transport) instead — see Prisma's Neon docs.
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

// Reuse the client across dev-server hot reloads to avoid exhausting the
// connection pool.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

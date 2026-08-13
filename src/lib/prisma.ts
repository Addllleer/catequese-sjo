import { PrismaClient } from "@prisma/client";

// Evita múltiplas instâncias do Prisma Client durante hot-reload em
// desenvolvimento (padrão recomendado pela documentação do Next.js/Prisma).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

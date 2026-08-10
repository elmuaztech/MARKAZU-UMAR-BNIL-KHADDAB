import { PrismaClient } from '@prisma/client';

// Ensure DATABASE_URL fallback if environment variable is missing
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/markazu_umar_db?schema=public';
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a singleton instance of PrismaClient to prevent multiple connections
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

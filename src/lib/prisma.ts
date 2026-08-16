import { PrismaClient } from '@prisma/client';

// In development only, supply a fallback DATABASE_URL if not provided
if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'production') {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/markazu_umar_db?schema=public';
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a singleton instance of PrismaClient to prevent connection leaks in serverless Next.js
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Always maintain singleton reference on globalThis across all environments
globalForPrisma.prisma = prisma;

export default prisma;


import { PrismaClient } from '@prisma/client';

function getSanitizedDatabaseUrl(): string {
  let url = (process.env.DATABASE_URL || '').trim();

  // Strip duplicate key assignments e.g. DATABASE_URL=DATABASE_URL=...
  while (url.startsWith('DATABASE_URL=')) {
    url = url.slice('DATABASE_URL='.length).trim();
  }

  // Strip wrapping quotes
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1).trim();
  }

  // If valid, use it
  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
    process.env.DATABASE_URL = url;
    return url;
  }

  // Default Docker container connection string fallback
  const fallback = 'postgresql://mssms_user:mssms_secure_pass_1447@postgres:5432/mssms_db?schema=public';
  process.env.DATABASE_URL = fallback;
  return fallback;
}

const dbUrl = getSanitizedDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a singleton instance of PrismaClient to prevent connection leaks in serverless Next.js
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Always maintain singleton reference on globalThis across all environments
globalForPrisma.prisma = prisma;

export default prisma;


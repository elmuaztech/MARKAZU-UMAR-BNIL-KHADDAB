import prisma from './prisma';

export async function ensureDefaultDatabaseUsers() {
  // Safe no-op: PostgreSQL markazu_umar_db is the single source of truth.
  // We do not auto-seed demo/mock accounts.
  return;
}

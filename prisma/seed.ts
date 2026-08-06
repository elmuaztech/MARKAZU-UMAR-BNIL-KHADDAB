import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Markazu Umar School Management System database...');

  // Create Active Session
  const session = await prisma.schoolSession.upsert({
    where: { id: 'sess-01' },
    update: {},
    create: {
      id: 'sess-01',
      sessionName: '1447/1448 AH (2025/2026 AD)',
      activeTerm: 'Term 2',
      isCurrent: true,
    },
  });

  console.log('Database seeded successfully!', { session });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

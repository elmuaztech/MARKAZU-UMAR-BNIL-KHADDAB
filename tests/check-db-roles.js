const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      role: true,
      status: true,
      isFirstLogin: true,
      mustChangePassword: true,
    },
  });
  console.log('--- USERS BY ROLE ---');
  const roles = {};
  users.forEach((u) => {
    if (!roles[u.role]) roles[u.role] = [];
    roles[u.role].push(u);
  });
  for (const r in roles) {
    console.log(`\nRole ${r} (${roles[r].length} users):`);
    roles[r].slice(0, 3).forEach((u) => {
      console.log(`  - Username: "${u.username}", Email: "${u.email}", Name: "${u.name}", Status: ${u.status}`);
    });
  }

  const students = await p.student.findMany({
    take: 3,
    select: { id: true, admissionNo: true, fullName: true, classId: true, userId: true, parentId: true },
  });
  console.log('\n--- SAMPLE STUDENTS ---');
  students.forEach((s) => console.log(`  - ${s.fullName} (${s.admissionNo}), id: ${s.id}, parentId: ${s.parentId}`));

  const sessions = await p.schoolSession.findMany({
    select: { id: true, sessionName: true, activeTerm: true, isCurrent: true },
  });
  console.log('\n--- SESSIONS ---');
  sessions.forEach((s) => console.log(`  - ${s.sessionName} (${s.activeTerm}), isCurrent: ${s.isCurrent}`));

  await p.$disconnect();
}

main().catch((err) => {
  console.error(err);
  p.$disconnect();
  process.exit(1);
});

const fs = require('fs');
const path = require('path');

// Load environment variables from .env if present
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (!process.env[key]) process.env[key] = value.trim();
    }
  });
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSuperAdmin() {
  console.log('=== VERIFYING SUPER_ADMIN IN POSTGRESQL (MARKAZU_UMAR_DB) ===\n');

  try {
    const superAdmins = await prisma.user.findMany({
      where: {
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    console.log(`Total Active SUPER_ADMIN Accounts: ${superAdmins.length}\n`);

    if (superAdmins.length === 1) {
      const sa = superAdmins[0];
      console.log('✔ VERIFIED: Exactly ONE active SUPER_ADMIN exists in PostgreSQL:');
      console.log(` - ID:       ${sa.id}`);
      console.log(` - Name:     ${sa.name}`);
      console.log(` - Email:    ${sa.email}`);
      console.log(` - Username: ${sa.username}`);
      console.log(` - Role:     ${sa.role}`);
      console.log(` - Status:   ${sa.status}`);
      console.log(` - Created:  ${sa.createdAt.toISOString()}`);
    } else if (superAdmins.length === 0) {
      console.log('ℹ No active SUPER_ADMIN found yet. Run `node scripts/setup-initial-superadmin.js` to create it.');
    } else {
      console.log(`⚠️ Warning: Found ${superAdmins.length} active SUPER_ADMIN accounts.`);
    }

    const totalUsers = await prisma.user.count();
    console.log(`\nTotal Users in Database: ${totalUsers}`);

  } catch (err) {
    console.error('Verification Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdmin();

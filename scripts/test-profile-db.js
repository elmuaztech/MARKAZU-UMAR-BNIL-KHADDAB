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

async function testProfileDb() {
  console.log('=== TESTING POSTGRESQL PROFILE PERSISTENCE ===\n');

  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true
      }
    });

    console.log(`Found ${users.length} active users in PostgreSQL markazu_umar_db:`);
    users.forEach(u => {
      console.log(`- [${u.role}] ${u.name} (Email: ${u.email}, Phone: ${u.phone || 'N/A'}, Avatar: ${u.avatar ? 'Custom Set (' + u.avatar.substring(0, 30) + '...)' : 'None'})`);
    });

  } catch (err) {
    console.error('Error querying PostgreSQL:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testProfileDb();

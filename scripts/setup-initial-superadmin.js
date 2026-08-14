const fs = require('fs');
const path = require('path');
const readline = require('readline');
const bcrypt = require('bcryptjs');

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

// Prisma Client reads DATABASE_URL dynamically from process.env.DATABASE_URL (.env)
const prisma = new PrismaClient();

/**
 * Standard Password Hashing: bcrypt with 10 cryptographic salt rounds
 */
function hashPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password.trim(), salt);
}

// Interactive helper to read masked input in terminal without exposing password
function askHidden(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    process.stdout.write(query);

    let password = '';
    const onData = (char) => {
      char = char.toString();
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.removeListener('data', onData);
          if (process.stdin.isTTY) process.stdin.setRawMode(false);
          rl.close();
          console.log('');
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          process.exit();
          break;
        case '\u0008':
        case '\x7f': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    };

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', onData);
    } else {
      rl.question('', (ans) => {
        rl.close();
        resolve(ans);
      });
    }
  });
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

async function main() {
  console.log('\n======================================================');
  console.log(' MARKAZU UMAR ISLAMIYYAH - INITIAL SUPER ADMIN SETUP');
  console.log('======================================================\n');

  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is not defined in .env');
    process.exit(1);
  }

  try {
    // 1. Verify that no active SUPER_ADMIN currently exists in PostgreSQL
    const existingSuperAdmin = await prisma.user.findFirst({
      where: {
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        deletedAt: null
      }
    });

    if (existingSuperAdmin) {
      console.error('Error: An active SUPER_ADMIN already exists in the database.');
      console.error(`Existing account email: ${existingSuperAdmin.email}`);
      process.exit(1);
    }

    // 2. Interactive Input
    const name = await askQuestion('Enter Super Admin Full Name: ');
    if (!name) {
      console.error('Error: Full Name is required.');
      process.exit(1);
    }

    const email = await askQuestion('Enter Super Admin Email: ');
    if (!email || !email.includes('@')) {
      console.error('Error: Valid Email is required.');
      process.exit(1);
    }

    const username = await askQuestion('Enter Super Admin Username / ID: ');
    if (!username) {
      console.error('Error: Username is required.');
      process.exit(1);
    }

    const password = await askHidden('Enter Super Admin Password: ');
    if (!password || password.length < 8) {
      console.error('Error: Password must be at least 8 characters long.');
      process.exit(1);
    }

    const confirmPassword = await askHidden('Confirm Super Admin Password: ');
    if (password !== confirmPassword) {
      console.error('Error: Passwords do not match.');
      process.exit(1);
    }

    // 3. Hash Password using the exact application algorithm
    const passwordHash = hashPassword(password);

    // 4. Insert single SUPER_ADMIN into PostgreSQL
    const createdUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        username: username.trim(),
        password: passwordHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        isFirstLogin: false,
        mustChangePassword: false,
        isLocked: false,
        failedLoginAttempts: 0
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

    console.log('\n======================================================');
    console.log(' SUCCESS: INITIAL SUPER ADMIN CREATED IN POSTGRESQL');
    console.log('======================================================');
    console.log(` - ID:       ${createdUser.id}`);
    console.log(` - Name:     ${createdUser.name}`);
    console.log(` - Email:    ${createdUser.email}`);
    console.log(` - Username: ${createdUser.username}`);
    console.log(` - Role:     ${createdUser.role}`);
    console.log(` - Status:   ${createdUser.status}`);
    console.log(` - Created:  ${createdUser.createdAt.toISOString()}`);
    console.log('======================================================\n');

  } catch (err) {
    console.error('\nSetup Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

import prisma from './prisma';
import { hashPassword } from './security';

export async function ensureDefaultDatabaseUsers() {
  try {
    const count = await prisma.user.count({ where: { deletedAt: null } });
    if (count > 0) {
      return; // Database users already exist
    }

    console.log('[DB_SEED] Initializing default core system accounts in PostgreSQL database...');

    const defaultUsers = [
      {
        id: 'usr-superadmin-1',
        username: 'superadmin',
        name: 'Dr. Abubakar Umar (Super Admin)',
        email: 'markazuumarbnkhaddabdaneji@gmail.com',
        role: 'SUPER_ADMIN' as const,
        password: hashPassword('@Aa123456789'),
        phone: '+234 816 710 9421',
        status: 'ACTIVE',
        isFirstLogin: false,
        mustChangePassword: false,
      },
      {
        id: 'usr-admin-1',
        username: 'schooladmin',
        name: 'Malam Umar Faruq (School Admin)',
        email: 'admin@markazuumar.edu.ng',
        role: 'ADMIN' as const,
        password: hashPassword('admin123'),
        phone: '+234 803 123 4567',
        status: 'ACTIVE',
        isFirstLogin: false,
        mustChangePassword: false,
      },
      {
        id: 'usr-hm-1',
        username: 'MUBK-HM-0001',
        name: 'Malam Idris Usman (Headmaster Asubah & Magrib)',
        email: 'hm.asbah@markazuumar.edu.ng',
        role: 'HEADMASTER' as const,
        password: hashPassword('admin123'),
        assignedProgrammeId: 'prog-01',
        assignedProgrammeName: 'Asubah & Magrib',
        phone: '+234 803 456 7890',
        status: 'ACTIVE',
        isFirstLogin: false,
        mustChangePassword: false,
      },
      {
        id: 'usr-hm-2',
        username: 'MUBK-HM-0002',
        name: 'Dr. Ahmad Sulaiman (Headmaster Super Markaz)',
        email: 'hm.supermarkaz@markazuumar.edu.ng',
        role: 'HEADMASTER' as const,
        password: hashPassword('admin123'),
        assignedProgrammeId: 'prog-02',
        assignedProgrammeName: 'Super Markaz',
        phone: '+234 802 345 6789',
        status: 'ACTIVE',
        isFirstLogin: false,
        mustChangePassword: false,
      },
      {
        id: 'usr-hm-3',
        username: 'MUBK-HM-0003',
        name: 'Ustaz Aliyu Garba (Headmaster Islamiyyah)',
        email: 'hm.islamiyyah@markazuumar.edu.ng',
        role: 'HEADMASTER' as const,
        password: hashPassword('admin123'),
        assignedProgrammeId: 'prog-03',
        assignedProgrammeName: 'Islamiyyah',
        phone: '+234 805 678 9012',
        status: 'ACTIVE',
        isFirstLogin: false,
        mustChangePassword: false,
      },
      {
        id: 'usr-hm-4',
        username: 'MUBK-HM-0004',
        name: 'Malama Ruqayya Kabir (Headmaster Matan Aure)',
        email: 'hm.matanaure@markazuumar.edu.ng',
        role: 'HEADMASTER' as const,
        password: hashPassword('admin123'),
        assignedProgrammeId: 'prog-04',
        assignedProgrammeName: 'Matan Aure',
        phone: '+234 807 890 1234',
        status: 'ACTIVE',
        isFirstLogin: false,
        mustChangePassword: false,
      },
    ];

    for (const u of defaultUsers) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: u,
      });
    }

    console.log('[DB_SEED] Default core accounts successfully seeded into PostgreSQL database.');
  } catch (error) {
    console.error('[DB_SEED_ERROR] Failed to seed default accounts:', error);
  }
}

import fs from 'fs';
import path from 'path';
import { MOCK_USERS, MOCK_TEACHERS, MOCK_STUDENTS, MOCK_PARENTS, MOCK_PROGRAMMES, MOCK_CLASSES, MOCK_SUBJECTS } from './mockData';
import { hashPassword } from './security';

export interface ServerDatabase {
  users: Array<{
    id: string;
    username?: string;
    name: string;
    email: string;
    password?: string;
    role: string;
    phone?: string;
    avatar?: string;
    assignedProgrammeId?: string | null;
    assignedProgrammeName?: string | null;
    status: string;
    isFirstLogin?: boolean;
    mustChangePassword?: boolean;
    isLocked?: boolean;
    failedLoginAttempts?: number;
    lastLoginAt?: string | null;
    deletedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
  }>;
  deletedIdentifiers: {
    ids: string[];
    emails: string[];
    usernames: string[];
  };
  schoolSettings: {
    name: string;
    logo: string | null;
    activeSession: string;
    activeTerm: string;
  };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'mssms_database.json');

// Initial seed template if file does not exist
function getInitialDatabase(): ServerDatabase {
  const initialUsers = MOCK_USERS.map((u) => ({
    id: u.id,
    username: u.username || u.id,
    name: u.name,
    email: u.email.toLowerCase().trim(),
    password: u.passwordHash || hashPassword('@Aa123456789'),
    role: u.role,
    phone: u.phone,
    avatar: u.avatar,
    assignedProgrammeId: u.assignedProgrammeId || null,
    assignedProgrammeName: u.assignedProgrammeName || null,
    status: u.status || 'ACTIVE',
    isFirstLogin: u.isFirstLogin ?? false,
    mustChangePassword: u.mustChangePassword ?? false,
    isLocked: false,
    failedLoginAttempts: 0,
    lastLoginAt: null,
    deletedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  return {
    users: initialUsers,
    deletedIdentifiers: {
      ids: [],
      emails: [],
      usernames: [],
    },
    schoolSettings: {
      name: "MARKAZU UMAR BN AL-KHATTAB CENTRE FOR QUR'AN MEMORIZATION & ISLAMIC STUDIES - DANEJI",
      logo: '/logo.jpg',
      activeSession: '2025/2026',
      activeTerm: 'Term 1',
    },
  };
}

// Read database from disk
export function readServerDatabase(): ServerDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }

    const content = fs.readFileSync(DB_FILE, 'utf8');
    const parsed: ServerDatabase = JSON.parse(content);

    // Ensure all top-level keys exist
    if (!Array.isArray(parsed.users)) parsed.users = [];
    if (!parsed.deletedIdentifiers) parsed.deletedIdentifiers = { ids: [], emails: [], usernames: [] };
    if (!parsed.schoolSettings) {
      parsed.schoolSettings = {
        name: "MARKAZU UMAR BN AL-KHATTAB CENTRE FOR QUR'AN MEMORIZATION & ISLAMIC STUDIES - DANEJI",
        logo: '/logo.jpg',
        activeSession: '2025/2026',
        activeTerm: 'Term 1',
      };
    }

    return parsed;
  } catch (err) {
    console.error('[serverDb] Error reading database file, returning initial state:', err);
    return getInitialDatabase();
  }
}

// Write database to disk atomically
export function writeServerDatabase(data: ServerDatabase): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('[serverDb] Error writing database file:', err);
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (fallbackErr) {
      console.error('[serverDb] Fallback write also failed:', fallbackErr);
      return false;
    }
  }
}

// User CRUD Helpers for APIs

export function findServerUser(identifier: string) {
  const db = readServerDatabase();
  const cleanId = identifier.trim().toLowerCase();
  const deleted = db.deletedIdentifiers || { ids: [], emails: [], usernames: [] };

  return db.users.find((u) => {
    if (u.deletedAt) return false;
    if (deleted.ids.includes(u.id)) return false;
    if (deleted.emails.includes(u.email.toLowerCase())) return false;
    if (u.username && deleted.usernames.includes(u.username.toLowerCase())) return false;

    return (
      u.email.toLowerCase() === cleanId ||
      u.username?.toLowerCase() === cleanId ||
      u.id.toLowerCase() === cleanId ||
      (cleanId === 'superadmin' && u.role === 'SUPER_ADMIN') ||
      (cleanId.includes('superadmin') && u.role === 'SUPER_ADMIN') ||
      (cleanId === 'admin' && u.role === 'ADMIN') ||
      (cleanId === 'schooladmin' && u.role === 'ADMIN')
    );
  });
}

export function getAllServerUsers() {
  const db = readServerDatabase();
  const deleted = db.deletedIdentifiers || { ids: [], emails: [], usernames: [] };

  return db.users.filter((u) => {
    if (u.deletedAt) return false;
    if (deleted.ids.includes(u.id)) return false;
    if (deleted.emails.includes(u.email.toLowerCase())) return false;
    if (u.username && deleted.usernames.includes(u.username.toLowerCase())) return false;
    return true;
  });
}

export function updateServerUser(userId: string, updates: Record<string, any>) {
  const db = readServerDatabase();
  const cleanId = userId.trim().toLowerCase();

  let targetIndex = db.users.findIndex(
    (u) =>
      u.id.toLowerCase() === cleanId ||
      u.email.toLowerCase() === cleanId ||
      (u.username && u.username.toLowerCase() === cleanId) ||
      (cleanId === 'superadmin' && u.role === 'SUPER_ADMIN') ||
      (cleanId === 'usr-superadmin-1' && u.role === 'SUPER_ADMIN')
  );

  if (targetIndex === -1 && updates.role === 'SUPER_ADMIN') {
    targetIndex = db.users.findIndex((u) => u.role === 'SUPER_ADMIN');
  }

  if (targetIndex === -1) return null;

  const existing = db.users[targetIndex];
  const updatedUser = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  db.users[targetIndex] = updatedUser;
  writeServerDatabase(db);
  return updatedUser;
}

export function deleteServerUser(userId: string) {
  const db = readServerDatabase();
  const cleanId = userId.trim().toLowerCase();

  const targetIndex = db.users.findIndex(
    (u) =>
      u.id.toLowerCase() === cleanId ||
      u.email.toLowerCase() === cleanId ||
      (u.username && u.username.toLowerCase() === cleanId)
  );

  if (targetIndex === -1) return false;

  const targetUser = db.users[targetIndex];
  if (targetUser.role === 'SUPER_ADMIN') {
    return false; // Prevent primary Super Admin root account deletion
  }

  // Soft delete and record in deletedIdentifiers
  targetUser.deletedAt = new Date().toISOString();
  targetUser.status = 'DEACTIVATED';

  if (!db.deletedIdentifiers.ids.includes(targetUser.id)) {
    db.deletedIdentifiers.ids.push(targetUser.id);
  }
  if (!db.deletedIdentifiers.emails.includes(targetUser.email.toLowerCase())) {
    db.deletedIdentifiers.emails.push(targetUser.email.toLowerCase());
  }
  if (targetUser.username && !db.deletedIdentifiers.usernames.includes(targetUser.username.toLowerCase())) {
    db.deletedIdentifiers.usernames.push(targetUser.username.toLowerCase());
  }

  // Remove completely from active array
  db.users.splice(targetIndex, 1);
  writeServerDatabase(db);
  return true;
}

export function createServerUser(user: any) {
  const db = readServerDatabase();
  const existing = db.users.find(
    (u) =>
      u.email.toLowerCase() === user.email.toLowerCase() ||
      (user.username && u.username?.toLowerCase() === user.username.toLowerCase())
  );

  if (existing) {
    if (existing.deletedAt) {
      // Reactivate
      Object.assign(existing, {
        ...user,
        deletedAt: null,
        status: 'ACTIVE',
        updatedAt: new Date().toISOString(),
      });
      // Remove from deletedIdentifiers
      db.deletedIdentifiers.ids = db.deletedIdentifiers.ids.filter((id) => id !== existing.id);
      db.deletedIdentifiers.emails = db.deletedIdentifiers.emails.filter((em) => em !== existing.email.toLowerCase());
      if (existing.username) {
        db.deletedIdentifiers.usernames = db.deletedIdentifiers.usernames.filter(
          (un) => un !== existing.username!.toLowerCase()
        );
      }
      writeServerDatabase(db);
      return existing;
    }
    return null; // Already exists
  }

  const newUser = {
    id: user.id || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    username: user.username || user.email.split('@')[0],
    name: user.name,
    email: user.email.toLowerCase().trim(),
    password: user.password || hashPassword('admin123'),
    role: user.role,
    phone: user.phone || null,
    avatar: user.avatar || null,
    assignedProgrammeId: user.assignedProgrammeId || null,
    assignedProgrammeName: user.assignedProgrammeName || null,
    status: user.status || 'ACTIVE',
    isFirstLogin: user.isFirstLogin ?? true,
    mustChangePassword: user.mustChangePassword ?? false,
    isLocked: false,
    failedLoginAttempts: 0,
    lastLoginAt: null,
    deletedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeServerDatabase(db);
  return newUser;
}

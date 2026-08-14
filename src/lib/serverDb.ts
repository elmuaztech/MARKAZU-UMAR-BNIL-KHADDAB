import fs from 'fs';
import path from 'path';
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
  programmes: Array<any>;
  classes: Array<any>;
  subjects: Array<any>;
  attendance: Array<any>;
  tahfizRecords: Array<any>;
  announcements: Array<any>;
  otpTokens?: Array<any>;
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

// Clean initial empty database structure
function getInitialDatabase(): ServerDatabase {
  return {
    users: [],
    programmes: [],
    classes: [],
    subjects: [],
    attendance: [],
    tahfizRecords: [],
    announcements: [],
    otpTokens: [],
    deletedIdentifiers: {
      ids: [],
      emails: [],
      usernames: [],
    },
    schoolSettings: {
      name: "MARKAZU UMAR BN AL-KHATTAB CENTRE FOR QUR'AN MEMORIZATION & ISLAMIC STUDIES - DANEJI",
      logo: '/logo.jpg',
      activeSession: '1447/1448 AH (2025/2026 AD)',
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

    // Ensure all top-level keys exist as clean arrays
    if (!Array.isArray(parsed.users)) parsed.users = [];
    if (!Array.isArray(parsed.programmes)) parsed.programmes = [];
    if (!Array.isArray(parsed.classes)) parsed.classes = [];
    if (!Array.isArray(parsed.subjects)) parsed.subjects = [];
    if (!Array.isArray(parsed.attendance)) parsed.attendance = [];
    if (!Array.isArray(parsed.tahfizRecords)) parsed.tahfizRecords = [];
    if (!Array.isArray(parsed.announcements)) parsed.announcements = [];
    if (!parsed.deletedIdentifiers) parsed.deletedIdentifiers = { ids: [], emails: [], usernames: [] };
    if (!parsed.schoolSettings) {
      parsed.schoolSettings = {
        name: "MARKAZU UMAR BN AL-KHATTAB CENTRE FOR QUR'AN MEMORIZATION & ISLAMIC STUDIES - DANEJI",
        logo: '/logo.jpg',
        activeSession: '1447/1448 AH (2025/2026 AD)',
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

export function findServerUser(identifier: string) {
  const db = readServerDatabase();
  const cleanId = identifier.trim().toLowerCase();

  return db.users.find((u) => {
    if (u.deletedAt) return false;

    return (
      u.email.toLowerCase() === cleanId ||
      (u.username && u.username.toLowerCase() === cleanId) ||
      u.id.toLowerCase() === cleanId
    );
  });
}

export function getAllServerUsers() {
  const db = readServerDatabase();
  return db.users.filter((u) => !u.deletedAt);
}

export function createServerUser(userData: {
  id?: string;
  username?: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  phone?: string;
  avatar?: string;
  assignedProgrammeId?: string;
  assignedProgrammeName?: string;
  status?: string;
  isFirstLogin?: boolean;
  mustChangePassword?: boolean;
}) {
  const db = readServerDatabase();
  const cleanEmail = userData.email.trim().toLowerCase();

  const existingIndex = db.users.findIndex(
    (u) => u.email.toLowerCase() === cleanEmail || (userData.username && u.username?.toLowerCase() === userData.username.toLowerCase())
  );

  const rolePrefixMap: Record<string, string> = {
    SUPER_ADMIN: 'MUBK-SAD',
    ADMIN: 'MUBK-ADM',
    HEADMASTER: 'MUBK-HM',
    TEACHER: 'MUBK-TEA',
    STUDENT: 'MUBK-STU',
    PARENT: 'MUBK-PAR',
  };

  const roleCount = db.users.filter((u) => u.role === userData.role && !u.deletedAt).length;
  const rolePrefix = rolePrefixMap[userData.role] || 'MUBK-USR';
  const autoUsername = userData.username || `${rolePrefix}-${(roleCount + 1).toString().padStart(4, '0')}`;
  const userId = userData.id || autoUsername;

  let passToStore = userData.password || hashPassword('@Aa123456789');
  if (userData.password && !userData.password.startsWith('argon2id$')) {
    passToStore = hashPassword(userData.password);
  }

  const newUser = {
    id: userId,
    username: autoUsername,
    name: userData.name.trim(),
    email: cleanEmail,
    password: passToStore,
    role: userData.role,
    phone: userData.phone || '',
    avatar: userData.avatar || '',
    assignedProgrammeId: userData.assignedProgrammeId || null,
    assignedProgrammeName: userData.assignedProgrammeName || null,
    status: userData.status || 'ACTIVE',
    isFirstLogin: userData.isFirstLogin ?? true,
    mustChangePassword: userData.mustChangePassword ?? true,
    isLocked: false,
    failedLoginAttempts: 0,
    lastLoginAt: null,
    deletedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    db.users[existingIndex] = { ...db.users[existingIndex], ...newUser };
  } else {
    db.users.unshift(newUser);
  }

  writeServerDatabase(db);
  return newUser;
}

export function updateServerUser(userId: string, updates: any) {
  const db = readServerDatabase();
  const cleanId = userId.trim().toLowerCase();

  const userIndex = db.users.findIndex(
    (u) =>
      !u.deletedAt &&
      (u.id.toLowerCase() === cleanId ||
        u.email.toLowerCase() === cleanId ||
        (u.username && u.username.toLowerCase() === cleanId))
  );

  if (userIndex === -1) return null;

  db.users[userIndex] = {
    ...db.users[userIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  writeServerDatabase(db);
  return db.users[userIndex];
}

export function deleteServerUser(userId: string) {
  const db = readServerDatabase();
  const cleanId = userId.trim().toLowerCase();

  const userIndex = db.users.findIndex(
    (u) =>
      u.id.toLowerCase() === cleanId ||
      u.email.toLowerCase() === cleanId ||
      (u.username && u.username.toLowerCase() === cleanId)
  );

  if (userIndex === -1) return false;

  const target = db.users[userIndex];
  target.deletedAt = new Date().toISOString();
  target.status = 'DEACTIVATED';

  if (!db.deletedIdentifiers) {
    db.deletedIdentifiers = { ids: [], emails: [], usernames: [] };
  }

  if (target.id && !db.deletedIdentifiers.ids.includes(target.id)) {
    db.deletedIdentifiers.ids.push(target.id);
  }
  if (target.email && !db.deletedIdentifiers.emails.includes(target.email.toLowerCase())) {
    db.deletedIdentifiers.emails.push(target.email.toLowerCase());
  }
  if (target.username && !db.deletedIdentifiers.usernames.includes(target.username.toLowerCase())) {
    db.deletedIdentifiers.usernames.push(target.username.toLowerCase());
  }

  writeServerDatabase(db);
  return true;
}

export function getAllServerProgrammes() {
  const db = readServerDatabase();
  return db.programmes || [];
}

export function createServerProgramme(progData: any) {
  const db = readServerDatabase();
  if (!Array.isArray(db.programmes)) db.programmes = [];

  const newProg = {
    id: progData.id || `prog-${Date.now()}`,
    programme_code: progData.programme_code || progData.code,
    programme_name_english: progData.programme_name_english || progData.nameEnglish,
    programme_name_arabic: progData.programme_name_arabic || progData.nameArabic || '',
    programme_name: progData.programme_name || progData.programme_name_english || progData.nameEnglish,
    hasSubcategories: progData.hasSubcategories ?? false,
    subcategories: progData.subcategories || [],
    status: progData.status || 'Active',
    display_order: progData.display_order || progData.displayOrder || db.programmes.length + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.programmes.push(newProg);
  writeServerDatabase(db);
  return newProg;
}

export function updateServerProgramme(id: string, updates: any) {
  const db = readServerDatabase();
  if (!Array.isArray(db.programmes)) db.programmes = [];
  const idx = db.programmes.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  db.programmes[idx] = { ...db.programmes[idx], ...updates, updated_at: new Date().toISOString() };
  writeServerDatabase(db);
  return db.programmes[idx];
}

export function deleteServerProgramme(id: string) {
  const db = readServerDatabase();
  if (!Array.isArray(db.programmes)) db.programmes = [];
  const idx = db.programmes.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  db.programmes.splice(idx, 1);
  writeServerDatabase(db);
  return true;
}

export function getAllServerClasses() {
  const db = readServerDatabase();
  return db.classes || [];
}

export function createServerClass(classData: any) {
  const db = readServerDatabase();
  if (!Array.isArray(db.classes)) db.classes = [];

  const newCls = {
    id: classData.id || `cls-${Date.now()}`,
    name: classData.name,
    category: classData.category,
    section: classData.section,
    subcategory: classData.subcategory || null,
    capacity: classData.capacity || 30,
    programmeId: classData.programmeId || null,
    classTeacherId: classData.classTeacherId || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.classes.push(newCls);
  writeServerDatabase(db);
  return newCls;
}

export function updateServerClass(id: string, updates: any) {
  const db = readServerDatabase();
  if (!Array.isArray(db.classes)) db.classes = [];
  const idx = db.classes.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  db.classes[idx] = { ...db.classes[idx], ...updates, updated_at: new Date().toISOString() };
  writeServerDatabase(db);
  return db.classes[idx];
}

export function deleteServerClass(id: string) {
  const db = readServerDatabase();
  if (!Array.isArray(db.classes)) db.classes = [];
  const idx = db.classes.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  db.classes.splice(idx, 1);
  writeServerDatabase(db);
  return true;
}

export function getAllServerSubjects() {
  const db = readServerDatabase();
  return db.subjects || [];
}

export function createServerSubject(subjectData: any) {
  const db = readServerDatabase();
  if (!Array.isArray(db.subjects)) db.subjects = [];

  const newSubj = {
    id: subjectData.id || `subj-${Date.now()}`,
    name: subjectData.name,
    arabicName: subjectData.arabicName || null,
    code: subjectData.code,
    category: subjectData.category || 'GENERAL',
    description: subjectData.description || null,
    programmeId: subjectData.programmeId || null,
    classId: subjectData.classId || null,
    status: subjectData.status || 'Active',
    displayOrder: subjectData.displayOrder || db.subjects.length + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.subjects.push(newSubj);
  writeServerDatabase(db);
  return newSubj;
}

export function updateServerSubject(id: string, updates: any) {
  const db = readServerDatabase();
  if (!Array.isArray(db.subjects)) db.subjects = [];
  const idx = db.subjects.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  db.subjects[idx] = { ...db.subjects[idx], ...updates, updated_at: new Date().toISOString() };
  writeServerDatabase(db);
  return db.subjects[idx];
}

export function deleteServerSubject(id: string) {
  const db = readServerDatabase();
  if (!Array.isArray(db.subjects)) db.subjects = [];
  const idx = db.subjects.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  db.subjects.splice(idx, 1);
  writeServerDatabase(db);
  return true;
}

export function getAllServerAttendance() {
  const db = readServerDatabase();
  return db.attendance || [];
}

export function saveServerAttendanceBatch(records: any[], isDraft: boolean = false) {
  const db = readServerDatabase();
  if (!Array.isArray(db.attendance)) db.attendance = [];

  for (const rec of records) {
    const existingIndex = db.attendance.findIndex((a) => a.id === rec.id || (a.studentId === rec.studentId && a.date === rec.date));
    if (existingIndex >= 0) {
      db.attendance[existingIndex] = { ...db.attendance[existingIndex], ...rec, isDraft, updated_at: new Date().toISOString() };
    } else {
      db.attendance.push({ ...rec, isDraft, created_at: new Date().toISOString() });
    }
  }

  writeServerDatabase(db);
  return db.attendance;
}

export function getAllServerTahfiz() {
  const db = readServerDatabase();
  return db.tahfizRecords || [];
}

export function createServerTahfizRecord(record: any) {
  const db = readServerDatabase();
  if (!Array.isArray(db.tahfizRecords)) db.tahfizRecords = [];

  const newRec = {
    id: record.id || `thf-${Date.now()}`,
    ...record,
    createdAt: new Date().toISOString(),
  };

  db.tahfizRecords.unshift(newRec);
  writeServerDatabase(db);
  return newRec;
}

export function getAllServerAnnouncements() {
  const db = readServerDatabase();
  return db.announcements || [];
}

export function createServerAnnouncement(data: any) {
  const db = readServerDatabase();
  if (!Array.isArray(db.announcements)) db.announcements = [];

  const newAnn = {
    id: data.id || `ann-${Date.now()}`,
    ...data,
    date: data.date || new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  db.announcements.unshift(newAnn);
  writeServerDatabase(db);
  return newAnn;
}

export function saveServerOtpToken(userIdOrToken: any, email?: string, token?: string, expiresAt?: Date | number) {
  const db = readServerDatabase();
  if (!Array.isArray(db.otpTokens)) db.otpTokens = [];

  const tokenObj = typeof userIdOrToken === 'object' ? userIdOrToken : {
    userId: userIdOrToken,
    email,
    token,
    expiresAt: expiresAt instanceof Date ? expiresAt.getTime() : expiresAt,
  };

  db.otpTokens.push({
    ...tokenObj,
    createdAt: new Date().toISOString(),
  });
  writeServerDatabase(db);
  return tokenObj;
}

export function findServerOtpToken(tokenString: string) {
  const db = readServerDatabase();
  if (!Array.isArray(db.otpTokens)) return null;
  return db.otpTokens.find((t: any) => t.token === tokenString && !t.used && t.expiresAt > Date.now()) || null;
}

export function markServerOtpTokenUsed(tokenString: string) {
  const db = readServerDatabase();
  if (!Array.isArray(db.otpTokens)) return false;
  const t = db.otpTokens.find((item: any) => item.token === tokenString);
  if (t) {
    t.used = true;
    writeServerDatabase(db);
    return true;
  }
  return false;
}

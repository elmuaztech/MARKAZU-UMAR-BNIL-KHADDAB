import fs from 'fs';
import path from 'path';
import {
  MOCK_USERS,
  MOCK_TEACHERS,
  MOCK_STUDENTS,
  MOCK_PARENTS,
  MOCK_PROGRAMMES,
  MOCK_CLASSES,
  MOCK_SUBJECTS,
  MOCK_ATTENDANCE,
  MOCK_TAHFIZ_RECORDS,
  MOCK_ANNOUNCEMENTS,
} from './mockData';
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
  classes: Array<any>;
  subjects: Array<any>;
  attendance: Array<any>;
  tahfizRecords: Array<any>;
  announcements: Array<any>;
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
    classes: MOCK_CLASSES || [],
    subjects: MOCK_SUBJECTS || [],
    attendance: MOCK_ATTENDANCE || [],
    tahfizRecords: MOCK_TAHFIZ_RECORDS || [],
    announcements: MOCK_ANNOUNCEMENTS || [],
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
    if (!Array.isArray(parsed.classes)) parsed.classes = MOCK_CLASSES || [];
    if (!Array.isArray(parsed.subjects)) parsed.subjects = MOCK_SUBJECTS || [];
    if (!Array.isArray(parsed.attendance)) parsed.attendance = MOCK_ATTENDANCE || [];
    if (!Array.isArray(parsed.tahfizRecords)) parsed.tahfizRecords = MOCK_TAHFIZ_RECORDS || [];
    if (!Array.isArray(parsed.announcements)) parsed.announcements = MOCK_ANNOUNCEMENTS || [];
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

// In-Memory & File-based OTP Token Management for Password Resets
interface ServerOtpToken {
  token: string;
  userId: string;
  email: string;
  expiresAt: number;
  used: boolean;
}

const globalServerOtpTokens: ServerOtpToken[] = [];

export function saveServerOtpToken(userId: string, email: string, token: string, expiresAt: Date) {
  globalServerOtpTokens.push({
    token: token.trim(),
    userId,
    email: email.toLowerCase().trim(),
    expiresAt: expiresAt.getTime(),
    used: false,
  });
}

export function findServerOtpToken(otp: string) {
  const cleanOtp = otp.trim();
  const now = Date.now();
  return globalServerOtpTokens.find((t) => !t.used && t.token === cleanOtp && t.expiresAt > now);
}

export function markServerOtpTokenUsed(otp: string) {
  const token = findServerOtpToken(otp);
  if (token) {
    token.used = true;
  }
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

// ------------------------------------
// Classes CRUD Helpers
// ------------------------------------
export function getAllServerClasses(programmeId?: string | null) {
  const db = readServerDatabase();
  let result = db.classes || [];
  if (programmeId) {
    result = result.filter((c) => c.programmeId === programmeId);
  }
  return result;
}

export function createServerClass(newClassData: any) {
  const db = readServerDatabase();
  const newClass = {
    id: newClassData.id || `cls-${Date.now()}`,
    name: newClassData.name,
    category: newClassData.category,
    section: newClassData.section,
    subcategory: newClassData.subcategory || null,
    capacity: Number(newClassData.capacity || 30),
    programmeId: newClassData.programmeId || null,
    classTeacherId: newClassData.classTeacherId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.classes = [newClass, ...(db.classes || [])];
  writeServerDatabase(db);
  return newClass;
}

export function updateServerClass(classId: string, updates: any) {
  const db = readServerDatabase();
  const idx = (db.classes || []).findIndex((c) => c.id === classId);
  if (idx === -1) return null;
  const updated = {
    ...db.classes[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  db.classes[idx] = updated;
  writeServerDatabase(db);
  return updated;
}

export function deleteServerClass(classId: string) {
  const db = readServerDatabase();
  const idx = (db.classes || []).findIndex((c) => c.id === classId);
  if (idx === -1) return false;
  db.classes.splice(idx, 1);
  writeServerDatabase(db);
  return true;
}

// ------------------------------------
// Subjects CRUD Helpers
// ------------------------------------
export function getAllServerSubjects(classId?: string | null, programmeId?: string | null) {
  const db = readServerDatabase();
  let result = db.subjects || [];
  if (classId) result = result.filter((s) => s.classId === classId);
  if (programmeId) result = result.filter((s) => s.programmeId === programmeId);
  return result;
}

export function createServerSubject(subjectData: any) {
  const db = readServerDatabase();
  const newSubject = {
    id: subjectData.id || `subj-${Date.now()}`,
    name: subjectData.name,
    arabicName: subjectData.arabicName || null,
    code: subjectData.code,
    category: subjectData.category || 'GENERAL',
    description: subjectData.description || null,
    programmeId: subjectData.programmeId || null,
    classId: subjectData.classId || null,
    status: subjectData.status || 'ACTIVE',
    displayOrder: Number(subjectData.displayOrder || 1),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.subjects = [newSubject, ...(db.subjects || [])];
  writeServerDatabase(db);
  return newSubject;
}

export function updateServerSubject(subjectId: string, updates: any) {
  const db = readServerDatabase();
  const idx = (db.subjects || []).findIndex((s) => s.id === subjectId);
  if (idx === -1) return null;
  const updated = {
    ...db.subjects[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  db.subjects[idx] = updated;
  writeServerDatabase(db);
  return updated;
}

export function deleteServerSubject(subjectId: string) {
  const db = readServerDatabase();
  const idx = (db.subjects || []).findIndex((s) => s.id === subjectId);
  if (idx === -1) return false;
  db.subjects.splice(idx, 1);
  writeServerDatabase(db);
  return true;
}

// ------------------------------------
// Attendance CRUD Helpers
// ------------------------------------
export function getAllServerAttendance(date?: string | null, classId?: string | null, programmeId?: string | null) {
  const db = readServerDatabase();
  let result = db.attendance || [];
  if (date) result = result.filter((a) => a.date?.startsWith(date) || a.date === date);
  if (classId) result = result.filter((a) => a.classId === classId);
  if (programmeId) result = result.filter((a) => a.programmeId === programmeId);
  return result;
}

export function saveServerAttendanceBatch(records: any[], isDraft: boolean = false) {
  const db = readServerDatabase();
  if (!Array.isArray(db.attendance)) db.attendance = [];

  records.forEach((rec) => {
    const existingIdx = db.attendance.findIndex(
      (a) => a.studentId === rec.studentId && a.date === rec.date
    );
    const newRecord = {
      id: rec.id || `att-${rec.classId}-${rec.studentId}-${rec.date}`,
      date: rec.date || new Date().toISOString().split('T')[0],
      studentId: rec.studentId,
      classId: rec.classId,
      programmeId: rec.programmeId || null,
      teacherId: rec.teacherId || null,
      status: rec.status || 'PRESENT',
      statusEnum: rec.status || 'PRESENT',
      remarks: rec.remarks || '',
      isDraft,
      createdAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      db.attendance[existingIdx] = { ...db.attendance[existingIdx], ...newRecord };
    } else {
      db.attendance.push(newRecord);
    }
  });

  writeServerDatabase(db);
  return db.attendance;
}

// ------------------------------------
// Tahfiz CRUD Helpers
// ------------------------------------
export function getAllServerTahfiz(studentId?: string | null, classId?: string | null, programmeId?: string | null) {
  const db = readServerDatabase();
  let result = db.tahfizRecords || [];
  if (studentId) result = result.filter((t) => t.studentId === studentId);
  if (classId) result = result.filter((t) => t.classId === classId);
  if (programmeId) result = result.filter((t) => t.programmeId === programmeId);
  return result;
}

export function createServerTahfizRecord(recordData: any) {
  const db = readServerDatabase();
  const newRecord = {
    id: recordData.id || `tahfiz-${Date.now()}`,
    date: recordData.date || new Date().toISOString(),
    studentId: recordData.studentId,
    classId: recordData.classId,
    programmeId: recordData.programmeId || null,
    teacherId: recordData.teacherId || 'usr-teacher-1',
    hifzSurah: recordData.hifzSurah || 'Surah Al-Fatihah',
    hifzFromAyah: Number(recordData.hifzFromAyah || 1),
    hifzToAyah: Number(recordData.hifzToAyah || 1),
    hifzPages: Number(recordData.hifzPages || 1.0),
    currentJuz: Number(recordData.currentJuz || 1),
    sabkiSurah: recordData.sabkiSurah || '',
    sabkiRating: Number(recordData.sabkiRating || 5),
    manzilJuz: Number(recordData.manzilJuz || 1),
    manzilRating: Number(recordData.manzilRating || 5),
    teacherNotes: recordData.teacherNotes || '',
    studentBehaviour: recordData.studentBehaviour || 'EXCELLENT',
    completionPercentage: Number(recordData.completionPercentage || 0),
    createdAt: new Date().toISOString(),
  };
  db.tahfizRecords = [newRecord, ...(db.tahfizRecords || [])];
  writeServerDatabase(db);
  return newRecord;
}

// ------------------------------------
// Announcements CRUD Helpers
// ------------------------------------
export function getAllServerAnnouncements() {
  const db = readServerDatabase();
  return db.announcements || [];
}

export function createServerAnnouncement(annData: any) {
  const db = readServerDatabase();
  const newAnn = {
    id: annData.id || `ann-${Date.now()}`,
    title: annData.title,
    content: annData.content,
    date: annData.date || new Date().toISOString(),
    category: annData.category || 'GENERAL',
    targetRole: annData.targetRole || 'ALL',
    author: annData.author || 'Admin',
    pinned: !!annData.pinned,
    createdAt: new Date().toISOString(),
  };
  db.announcements = [newAnn, ...(db.announcements || [])];
  writeServerDatabase(db);
  return newAnn;
}

export function deleteServerAnnouncement(id: string) {
  const db = readServerDatabase();
  const idx = (db.announcements || []).findIndex((a) => a.id === id);
  if (idx === -1) return false;
  db.announcements.splice(idx, 1);
  writeServerDatabase(db);
  return true;
}

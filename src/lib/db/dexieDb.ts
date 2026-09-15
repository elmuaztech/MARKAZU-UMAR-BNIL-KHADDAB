import Dexie, { Table } from 'dexie';
import {
  User,
  Student,
  Teacher,
  Parent,
  SchoolClass,
  Subject,
  Programme,
  AttendanceRecord,
  TahfizRecord,
  GradeRecord,
  Announcement,
  TimetablePeriod,
  DirectMessage,
  SchoolSession,
} from '@/types';
import { AuditEntry } from '@/lib/audit';

export interface SyncQueueItem {
  id?: number;
  clientMutationId: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: any;
  entityType: string;
  entityId?: string;
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'SUCCESS';
  retryCount: number;
  lastError?: string;
  createdAt: string;
}

/**
 * MarkazuLocalDatabase: High-performance IndexedDB local-first storage using Dexie.js.
 * Operates offline without storage quota limits of localStorage.
 */
export class MarkazuLocalDatabase extends Dexie {
  users!: Table<User, string>;
  students!: Table<Student, string>;
  teachers!: Table<Teacher, string>;
  parents!: Table<Parent, string>;
  classes!: Table<SchoolClass, string>;
  subjects!: Table<Subject, string>;
  programmes!: Table<Programme, string>;
  attendance!: Table<AttendanceRecord, string>;
  tahfizRecords!: Table<TahfizRecord, string>;
  grades!: Table<GradeRecord, string>;
  announcements!: Table<Announcement, string>;
  timetablePeriods!: Table<TimetablePeriod, string>;
  directMessages!: Table<DirectMessage, string>;
  sessions!: Table<SchoolSession, string>;
  auditLogs!: Table<AuditEntry, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('MarkazuLocalDB');
    this.version(1).stores({
      users: 'id, email, username, role, status',
      students: 'id, admissionNo, fullName, classId, guardianId, status',
      teachers: 'id, staffNo, fullName, email, status',
      parents: 'id, fullName, email, phone',
      classes: 'id, name, category, programmeId',
      subjects: 'id, code, name, category, classId, programmeId',
      programmes: 'id, programme_code, status',
      attendance: 'id, date, studentId, classId, status',
      tahfizRecords: 'id, date, studentId, classId, teacherId',
      grades: 'id, studentId, classId, subjectId, term, session',
      announcements: 'id, category, targetRole, pinned, createdAt',
      timetablePeriods: 'id, classId, teacherId, dayOfWeek',
      directMessages: 'id, senderId, recipientStudentId, isRead, createdAt',
      sessions: 'id, sessionName, isCurrent',
      auditLogs: 'id, action, userId, timestamp',
      syncQueue: '++id, clientMutationId, endpoint, method, status, createdAt, entityType',
    });
  }
}

// Global singleton instance for the client browser
export const localDb = new MarkazuLocalDatabase();

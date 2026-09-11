'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { EnterpriseToastContainer, ToastItem } from '../components/ui/EnterpriseToastContainer';
import { EnterpriseConfirmModal, ConfirmOptions } from '../components/ui/EnterpriseConfirmModal';
import { EnterpriseProgressModal, ProgressOptions } from '../components/ui/EnterpriseProgressModal';
import {
  User,
  UserRole,
  Student,
  Teacher,
  Parent,
  SchoolClass,
  Subject,
  AttendanceRecord,
  TahfizRecord,
  GradeRecord,
  AssessmentConfig,
  ResultApprovalSubmission,
  Announcement,
  SchoolSession,
  Programme,
  TeacherAssignment,
  AdmissionApplication,
  CommunicationMessage,
  MessageTemplate,
  QueueItem,
  InAppNotification,
  CommunicationSettings,
  AttendanceStatusType,
  TimetablePeriod,
  DirectMessage,
  AcademicEvent,
  ReportCardTemplate,
  DEFAULT_REPORT_CARD_TEMPLATE,
  NewsArticle,
  GalleryItem,
  ValidatedImportRow,
  ImportSchoolStructureSummary,
} from '../types';
import {
  DEFAULT_ASSESSMENT_CONFIG,
  DEFAULT_COMMUNICATION_SETTINGS,
  CURRENT_SESSION,
} from './mockData';
import { AuditEntry, INITIAL_AUDIT_LOGS, createAuditLogEntry } from './audit';
import { sendSystemEmail } from './emailClient';
import { UserSession, ACTIVE_SESSIONS, revokeSession, revokeAllUserSessions, hashPassword, generateTemporaryPassword } from './security';
import { NotificationService } from '../services/notificationService';

const INITIAL_ADMISSION_APPLICATIONS: AdmissionApplication[] = [];

const INITIAL_ACADEMIC_EVENTS: AcademicEvent[] = [];

const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [
  { id: 'gal-01', title: 'Huffazu Daru Abi-Bakr As-Siddiq', category: 'Classes', image: '/gallery/huffazu-abi-bakr.jpg' },
  { id: 'gal-02', title: 'Huffazu Daru Umar Bin Khaddab', category: 'Classes', image: '/gallery/huffazu-umar-bin-khaddab.jpg' },
  { id: 'gal-03', title: 'Alh. Salisu Abubakar Daneji (Director)', category: 'School Officials', image: '/gallery/director.jpg' },
  { id: 'gal-04', title: 'Ustaz Sani Abubakar Daneji (Deputy Director)', category: 'School Officials', image: '/gallery/deputy-director.jpg' },
  { id: 'gal-05', title: 'Mal. Ahmad Abba - Headmaster, Matan Aure Section', category: 'School Officials', image: '/gallery/headmaster-matan-aure.jpg' },
  { id: 'gal-06', title: 'Mal. Siraɗullahi Balarabe Lawan - Headmaster, Asuba da Maghrib Section', category: 'School Officials', image: '/gallery/headmaster-asuba-maghrib.jpg' },
  { id: 'gal-07', title: 'Female Tahfiz Halqa Recitation Class', category: 'Students', image: '/gallery/students-group-1.jpg' },
  { id: 'gal-08', title: 'Markazu Umar Female Students Assembly', category: 'Students', image: '/gallery/students-group-2.jpg' },
  { id: 'gal-09', title: 'Academic Teachers Halqa Supervision', category: 'Teachers', image: '/gallery/teachers-1.jpg' },
  { id: 'gal-10', title: 'Markazu Umar Teaching Staff', category: 'Teachers', image: '/gallery/teachers-2.jpg' },
  { id: 'gal-11', title: 'Tahfiz Instructors Assembly', category: 'Teachers', image: '/gallery/teachers-3.jpg' },
];

interface AppContextType {
  // Enterprise Action Feedback & Toast System
  toasts: ToastItem[];
  notify: (toast: { type: 'success' | 'info' | 'warning' | 'error'; title: string; message: string; duration?: number }) => void;
  dismissToast: (id: string) => void;
  showConfirm: (options: ConfirmOptions) => void;
  confirmOptions: ConfirmOptions | null;
  dismissConfirm: () => void;
  showProgress: (options: ProgressOptions) => void;
  progressOptions: ProgressOptions | null;
  dismissProgress: () => void;

  isHydrated: boolean;
  currentUser: User;
  users: User[];
  updateUserAvatar: (avatarUrl: string) => Promise<User | undefined>;
  auditLogs: AuditEntry[];
  activeSessions: UserSession[];
  schoolLogo: string | null;
  setSchoolLogo: (logo: string | null) => void;
  schoolName: string;
  setSchoolName: (name: string) => void;
  
  switchRole: (role: UserRole) => void;
  setCurrentUser: (user: User) => void;
  
  // Security & Account Management
  createUserAccount: (userData: {
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    assignedProgrammeId?: string;
    assignedProgrammeName?: string;
  }) => Promise<User>;
  deleteUserAccount: (userId: string) => void;
  restoreUserAccount: (userId: string) => Promise<any>;
  permanentlyDeleteUserAccount: (userId: string) => Promise<any>;
  deactivatedUsers: User[];
  fetchDeactivatedUsers: () => Promise<User[]>;
  updateUserAccount: (userId: string, updates: Partial<User>) => void;
  unlockAccount: (userId: string) => void;
  resetUserPassword: (userId: string, newPass: string) => void;
  updateUserPasswordByEmail: (email: string, newPass: string) => void;
  terminateSession: (sessionId: string) => void;
  terminateAllSessions: (userId: string) => void;
  addAuditLog: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;

  programmes: Programme[];
  students: Student[];
  teachers: Teacher[];
  parents: Parent[];
  classes: SchoolClass[];
  subjects: Subject[];
  teacherAssignments: TeacherAssignment[];
  attendance: AttendanceRecord[];
  tahfizRecords: TahfizRecord[];
  timetablePeriods: TimetablePeriod[];
  directMessages: DirectMessage[];
  grades: GradeRecord[];
  announcements: Announcement[];
  currentSession: SchoolSession;
  assessmentConfig: AssessmentConfig;
  resultSubmissions: ResultApprovalSubmission[];
  reportCardTemplate: ReportCardTemplate;
  updateReportCardTemplate: (updated: Partial<ReportCardTemplate>) => void;

  newsArticles: NewsArticle[];
  addNewsArticle: (article: NewsArticle) => void;
  updateNewsArticle: (id: string, updatedFields: Partial<NewsArticle>) => void;
  deleteNewsArticle: (id: string) => void;

  galleryItems: GalleryItem[];
  addGalleryItem: (item: GalleryItem) => void;
  updateGalleryItem: (id: string, updatedFields: Partial<GalleryItem>) => void;
  deleteGalleryItem: (id: string) => void;

  saveAttendanceBatch: (records: AttendanceRecord[], isDraft?: boolean) => void;
  adminOverrideAttendance: (attendanceId: string, newStatus: AttendanceStatusType, reason: string) => void;
  saveTahfizRecord: (record: Omit<TahfizRecord, 'id'>) => void;
  sendTeacherDirectMessage: (msg: Omit<DirectMessage, 'id' | 'createdAt' | 'isRead'>) => void;
  markDirectMessageRead: (messageId: string) => void;
  archiveDirectMessage: (messageId: string) => void;

  updateAssessmentConfig: (updated: Partial<AssessmentConfig>) => void;
  saveGradeGridDraft: (draftGrades: GradeRecord[]) => void;
  submitResultBatch: (params: {
    teacherId: string;
    teacherName: string;
    programmeId: string;
    programmeName: string;
    classId: string;
    className: string;
    subjectId: string;
    subjectName: string;
    term: string;
    session: string;
    totalStudents: number;
    completedRecords: number;
    missingScores: number;
    classAverage: number;
    highestScore: number;
    lowestScore: number;
    grades: GradeRecord[];
  }) => void;
  approveResultSubmission: (submissionId: string, comments?: string) => void;
  rejectResultSubmission: (submissionId: string, reason: string) => void;
  returnResultSubmission: (submissionId: string, comments: string) => void;

  // Enterprise Communication Center State & Operations
  communications: CommunicationMessage[];
  messageTemplates: MessageTemplate[];
  deliveryQueue: QueueItem[];
  inAppNotifications: InAppNotification[];
  communicationSettings: CommunicationSettings;

  createCommunication: (comm: Omit<CommunicationMessage, 'id' | 'createdAt' | 'stats' | 'status'>, scheduleTime?: string) => Promise<CommunicationMessage>;
  testSendCommunication: (comm: Partial<CommunicationMessage>, channel: string) => Promise<void>;
  retryFailedDelivery: (queueItemId: string) => void;
  retryAllFailedDeliveries: (messageId?: string) => void;
  
  createTemplate: (template: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTemplate: (id: string, updated: Partial<MessageTemplate>) => void;
  deleteTemplate: (id: string) => void;
  duplicateTemplate: (id: string) => void;

  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  pinNotification: (id: string) => void;
  archiveNotification: (id: string) => void;
  deleteNotification: (id: string) => void;

  publishReportSheetsBatch: (
    sessionId: string,
    term: string,
    programmeId: string,
    classId: string,
    channels: string[]
  ) => Promise<{ successCount: number; parentGroupsCount: number }>;

  updateCommunicationSettings: (settings: Partial<CommunicationSettings>) => void;

  addProgramme: (programme: Omit<Programme, 'id' | 'created_at' | 'updated_at'>) => void;
  updateProgramme: (id: string, updated: Partial<Programme>) => void;
  toggleProgrammeStatus: (id: string) => void;
  deleteProgramme: (id: string) => void;
  addSubcategory: (programmeId: string, subcategoryName: string) => void;
  updateSubcategory: (programmeId: string, oldName: string, newName: string) => void;
  deleteSubcategory: (programmeId: string, subcategoryName: string) => void;
  assignHeadmasterProgramme: (headmasterUserId: string, programmeId: string, programmeName: string) => void;

  addClass: (newClass: Omit<SchoolClass, 'id'>) => void;
  updateClass: (id: string, updated: Partial<SchoolClass>) => void;
  deleteClass: (id: string) => void;

  addSubject: (subject: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, updated: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;

  assignTeacher: (assignment: Omit<TeacherAssignment, 'id'>) => void;
  removeTeacherAssignment: (id: string) => void;

  importSchoolStructureBatch: (
    validatedRows: ValidatedImportRow[]
  ) => Promise<ImportSchoolStructureSummary>;

  addStudent: (student: Omit<Student, 'id'>, customPassword?: string) => void;
  updateStudent: (id: string, updated: Partial<Student>) => void;
  deleteStudent: (id: string) => void;

  addTeacher: (teacher: Omit<Teacher, 'id'>, customPassword?: string) => void;
  updateTeacher: (id: string, updated: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;

  addParent: (parent: Omit<Parent, 'id'>, customPassword?: string) => void;
  updateParent: (id: string, updated: Partial<Parent>) => void;
  deleteParent: (id: string) => void;

  bulkImportTeachers: (teachersData: Omit<Teacher, 'id'>[]) => { successCount: number };
  bulkImportStudents: (studentsData: (Omit<Student, 'id'> & { parentName?: string; parentPhone?: string; parentEmail?: string })[]) => { successCount: number; linkedParentsCount?: number; duplicatesPreventedCount?: number };
  bulkImportParents: (parentsData: (Omit<Parent, 'id'> & { id?: string; linkedChildrenStr?: string })[]) => { successCount: number };

  syncUsersFromBackend: () => Promise<void>;
  syncStudentsFromBackend: () => Promise<void>;
  syncTeachersFromBackend: () => Promise<void>;
  syncParentsFromBackend: () => Promise<void>;
  syncAttendanceFromBackend: () => Promise<void>;

  addTahfizRecord: (record: Omit<TahfizRecord, 'id'>) => void;
  markAttendance: (records: Omit<AttendanceRecord, 'id'>[]) => void;
  addGradeRecord: (record: Omit<GradeRecord, 'id'>) => void;
  addAnnouncement: (announcement: Omit<Announcement, 'id'>) => void;

  admissionStatus: 'OPEN' | 'CLOSED';
  admissionApplications: AdmissionApplication[];
  toggleAdmissionStatus: (status: 'OPEN' | 'CLOSED') => void;
  submitAdmissionApplication: (data: Omit<AdmissionApplication, 'id' | 'applicationNo' | 'status' | 'submittedAt'>) => AdmissionApplication;
  approveAdmissionApplication: (appId: string, programmeIds: string[], classIds: string[]) => void;
  rejectAdmissionApplication: (appId: string, reason?: string) => void;

  academicEvents: AcademicEvent[];
  addAcademicEvent: (event: Omit<AcademicEvent, 'id'>) => void;
  updateAcademicEvent: (id: string, updated: Partial<AcademicEvent>) => void;
  deleteAcademicEvent: (id: string) => void;
}

export interface DeletedIdentifiers {
  ids: string[];
  emails: string[];
  usernames: string[];
}

export function getDeletedUserIdentifiers(): DeletedIdentifiers {
  if (typeof window === 'undefined') return { ids: [], emails: [], usernames: [] };
  try {
    const saved = localStorage.getItem('markazu_deleted_users');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ids: Array.isArray(parsed.ids) ? parsed.ids : [],
        emails: Array.isArray(parsed.emails) ? parsed.emails.map((e: string) => e.toLowerCase().trim()) : [],
        usernames: Array.isArray(parsed.usernames) ? parsed.usernames.map((u: string) => u.toLowerCase().trim()) : [],
      };
    }
  } catch {}
  return { ids: [], emails: [], usernames: [] };
}

export function recordDeletedUserIdentifier(id?: string, email?: string, username?: string) {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeletedUserIdentifiers();
    const newIds = new Set(current.ids);
    const newEmails = new Set(current.emails);
    const newUsernames = new Set(current.usernames);

    if (id) newIds.add(id);
    if (email) newEmails.add(email.toLowerCase().trim());
    if (username) newUsernames.add(username.toLowerCase().trim());

    localStorage.setItem(
      'markazu_deleted_users',
      JSON.stringify({
        ids: Array.from(newIds),
        emails: Array.from(newEmails),
        usernames: Array.from(newUsernames),
      })
    );
  } catch {}
}

export function clearDeletedUserIdentifier(id?: string, email?: string, username?: string) {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeletedUserIdentifiers();
    const updatedIds = current.ids.filter((i) => i !== id);
    const updatedEmails = current.emails.filter((e) => !email || e !== email.toLowerCase().trim());
    const updatedUsernames = current.usernames.filter((u) => !username || u !== username.toLowerCase().trim());

    localStorage.setItem(
      'markazu_deleted_users',
      JSON.stringify({
        ids: updatedIds,
        emails: updatedEmails,
        usernames: updatedUsernames,
      })
    );
  } catch {}
}

export function isUserDeleted(id?: string, email?: string, username?: string): boolean {
  const deleted = getDeletedUserIdentifiers();
  if (id && deleted.ids.includes(id)) return true;
  if (email && deleted.emails.includes(email.toLowerCase().trim())) return true;
  if (username && deleted.usernames.includes(username.toLowerCase().trim())) return true;
  return false;
}

export function safeLocalStorageSet(key: string, value: any) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch (err) {
    console.warn(`[safeLocalStorageSet] Failed to set ${key}:`, err);
  }
}

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('markazu_session_token') || '';
    const userStr = localStorage.getItem('markazu_current_user');
    let userId = '';
    let userRole = '';
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        userId = u.id || u.email || '';
        userRole = u.role || '';
      } catch (e) {}
    }
    const sessionVal = token || userId;
    if (sessionVal) {
      headers['Authorization'] = `Bearer ${sessionVal}`;
      headers['x-session-id'] = sessionVal;
    }
    if (userId) headers['x-user-id'] = userId;
    if (userRole) headers['x-user-role'] = userRole;
  }
  return headers;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const [progressOptions, setProgressOptions] = useState<ProgressOptions | null>(null);

  const notify = (toast: { type: 'success' | 'info' | 'warning' | 'error'; title: string; message: string; duration?: number }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = { ...toast, id };
    setToasts((prev) => [newToast, ...prev].slice(0, 5));

    setTimeout(() => {
      dismissToast(id);
    }, toast.duration || 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showConfirm = (options: ConfirmOptions) => {
    setConfirmOptions(options);
  };

  const dismissConfirm = () => {
    setConfirmOptions(null);
  };

  const showProgress = (options: ProgressOptions) => {
    setProgressOptions(options);
  };

  const dismissProgress = () => {
    setProgressOptions(null);
  };

  const [users, setUsers] = useState<User[]>([]);

  const DEFAULT_USER: User = {
    id: '',
    name: '',
    email: '',
    role: 'SUPER_ADMIN',
    username: '',
    avatar: '',
    status: 'ACTIVE',
    isFirstLogin: false,
    mustChangePassword: false,
    isLocked: false,
    failedLoginAttempts: 0,
    lastLoginAt: '',
  };

  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);

  const DEFAULT_SCHOOL_NAME = "MARKAZU UMAR BN AL-KHATTAB CENTRE FOR QUR'AN MEMORIZATION & ISLAMIC STUDIES - DANEJI";
  const [schoolLogo, setSchoolLogoState] = useState<string | null>('/logo.jpg');
  const [schoolName, setSchoolNameState] = useState<string>(DEFAULT_SCHOOL_NAME);

  useEffect(() => {
    setIsHydrated(true);

    if (typeof window !== 'undefined') {
      const savedLogo = localStorage.getItem('markazu_school_logo');
      if (savedLogo) {
        setSchoolLogoState(savedLogo);
      } else {
        setSchoolLogoState('/logo.jpg');
      }
      const savedName = localStorage.getItem('markazu_school_name');
      if (savedName) {
        setSchoolNameState(savedName);
      }

      // 1. Immediately hydrate saved currentUser from localStorage on client mount
      const savedUserStr = localStorage.getItem('markazu_current_user');
      if (savedUserStr) {
        try {
          const parsedUser = JSON.parse(savedUserStr);
          if (parsedUser && typeof parsedUser === 'object' && (parsedUser.name || parsedUser.email)) {
            setCurrentUser(parsedUser);
          }
        } catch {}
      }

      // 2. Hydrate other local storage caches safely after mount
      const savedTmpl = localStorage.getItem('markazu_report_card_template');
      if (savedTmpl) {
        try {
          setReportCardTemplateState(JSON.parse(savedTmpl));
        } catch {}
      }

      const savedNews = localStorage.getItem('markazu_news_articles');
      if (savedNews) {
        try {
          setNewsArticles(JSON.parse(savedNews));
        } catch {}
      }

      const savedGallery = localStorage.getItem('markazu_gallery_items');
      if (savedGallery) {
        try {
          setGalleryItems(JSON.parse(savedGallery));
        } catch {}
      }

      const savedAdmStatus = localStorage.getItem('markazu_admission_status');
      if (savedAdmStatus === 'CLOSED') {
        setAdmissionStatusState('CLOSED');
      }

      const savedAdmApps = localStorage.getItem('markazu_admission_apps');
      if (savedAdmApps) {
        try {
          setAdmissionApplications(JSON.parse(savedAdmApps));
        } catch {}
      }

      // 3. Sync latest persisted users from PostgreSQL backend
      fetch('/api/users')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.users)) {
            const deleted = getDeletedUserIdentifiers();
            const validUsers = data.users.filter(
              (u: any) =>
                !deleted.ids.includes(u.id) &&
                !deleted.emails.includes(u.email.toLowerCase().trim()) &&
                (!u.username || !deleted.usernames.includes(u.username.toLowerCase().trim()))
            );
            setUsers(validUsers);
            safeLocalStorageSet('markazu_users', validUsers);

            // Sync logged-in currentUser with latest real PostgreSQL database record
            setCurrentUser((curr) => {
              if (!curr || (!curr.id && !curr.email && !curr.username)) return curr;
              const matched = validUsers.find(
                (u: any) =>
                  (curr.id && u.id === curr.id) ||
                  (curr.email && u.email.toLowerCase().trim() === curr.email.toLowerCase().trim()) ||
                  (curr.username && u.username && u.username.toLowerCase().trim() === curr.username.toLowerCase().trim())
              );
              if (matched) {
                const synced = {
                  ...curr,
                  ...matched,
                  avatar: matched.avatar !== undefined ? matched.avatar : curr.avatar,
                };
                safeLocalStorageSet('markazu_current_user', synced);
                return synced;
              }
              return curr;
            });
          }
        })
        .catch(() => {});
    }
  }, []);

  const syncTeachersFromBackend = async () => {
    try {
      const res = await fetch('/api/teachers');
      const data = await res.json();
      if (data && Array.isArray(data.teachers)) {
        const deleted = getDeletedUserIdentifiers();
        const extractedAssignments: TeacherAssignment[] = [];

        const mappedTeachers = data.teachers
          .filter((t: any) => !deleted.ids.includes(t.id))
          .map((t: any) => {
            const assignmentClassIds = t.teacherAssignments?.map((a: any) => a.classId) || [];
            const managedClassIds = t.classesManaged?.map((c: any) => c.id) || [];
            const classesAssigned = Array.from(new Set([...assignmentClassIds, ...managedClassIds]));

            const assignmentProgIds = t.teacherAssignments?.map((a: any) => a.programmeId) || [];
            const managedProgIds = t.classesManaged?.map((c: any) => c.programmeId).filter(Boolean) || [];
            const programmeIds = Array.from(new Set([...assignmentProgIds, ...managedProgIds]));

            const subjectsAssigned = t.teacherAssignments?.flatMap((a: any) => a.assignedSubjects?.map((s: any) => s.subjectId) || []) || [];

            // Extract all real relational assignments
            if (Array.isArray(t.teacherAssignments)) {
              t.teacherAssignments.forEach((ta: any) => {
                extractedAssignments.push({
                  id: ta.id,
                  teacherId: ta.teacherId,
                  programmeId: ta.programmeId,
                  classId: ta.classId,
                  subjectIds: ta.assignedSubjects?.map((s: any) => s.subjectId) || [],
                  createdAt: ta.createdAt,
                  updatedAt: ta.updatedAt,
                });
              });
            }

            return {
              id: t.id,
              userId: t.userId || null,
              staffNo: t.staffNo,
              fullName: t.fullName,
              email: t.email,
              phone: t.phone,
              qualification: t.qualification || '',
              specialization: t.specialization || '',
              programmeIds,
              classesAssigned,
              subjectsAssigned,
              dateJoined: t.dateJoined,
              status: t.status,
              avatar: t.avatar || undefined,
            };
          });

        setTeachers(mappedTeachers);
        safeLocalStorageSet('markazu_teachers', mappedTeachers);

        if (extractedAssignments.length > 0) {
          setTeacherAssignments((prev) => {
            const assignmentMap = new Map<string, TeacherAssignment>();
            prev.forEach((a) => assignmentMap.set(`${a.teacherId}-${a.classId}`, a));
            extractedAssignments.forEach((a) => assignmentMap.set(`${a.teacherId}-${a.classId}`, a));
            const merged = Array.from(assignmentMap.values());
            safeLocalStorageSet('markazu_teacher_assignments', merged);
            return merged;
          });
        }
      }
    } catch (e) {
      console.warn('[syncTeachersFromBackend] error:', e);
    }
  };

  const syncStudentsFromBackend = async () => {
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      if (data && Array.isArray(data.students)) {
        const deleted = getDeletedUserIdentifiers();
        const mappedStudents = data.students
          .filter((s: any) => !deleted.ids.includes(s.id))
          .map((s: any) => ({
            id: s.id,
            userId: s.userId || null,
            email: s.user?.email || s.email || undefined,
            admissionNo: s.admissionNo,
            fullName: s.fullName,
            gender: s.gender,
            dob: s.dob,
            dateEnrolled: s.dateEnrolled,
            programmeId: s.programmeId || s.schoolClass?.programmeId || null,
            classId: s.classId,
            className: s.schoolClass?.name || 'Class',
            guardianId: s.guardianId,
            guardianName: s.parent?.fullName || 'Parent',
            guardianPhone: s.parent?.phone || '',
            status: s.status,
            hifzProgress: {
              currentJuz: s.currentJuz || 1,
              juzCompleted: s.juzCompleted || 0,
              currentSurah: s.currentSurah || 'Surah Al-Fatihah',
              currentAyah: s.currentAyah || 1,
              completedSurahsCount: s.completedSurahsCount || 0,
              tajweedRating: s.tajweedRating || 5,
              sabkiRating: s.sabkiRating || 5,
              manzilRating: s.manzilRating || 5,
            },
            akhlaqRating: s.akhlaqRating || 'EXCELLENT',
            avatar: s.avatar || undefined,
          }));
        setStudents(mappedStudents);
        safeLocalStorageSet('markazu_students', mappedStudents);
      }
    } catch (e) {
      console.warn('[syncStudentsFromBackend] error:', e);
    }
  };

  const syncParentsFromBackend = async () => {
    try {
      const res = await fetch('/api/parents');
      const data = await res.json();
      if (data && Array.isArray(data.parents)) {
        const deleted = getDeletedUserIdentifiers();
        const mappedParents = data.parents
          .filter((p: any) => !deleted.ids.includes(p.id))
          .map((p: any) => ({
            id: p.id,
            userId: p.userId || null,
            fullName: p.fullName,
            email: p.email,
            phone: p.phone,
            occupation: p.occupation || '',
            address: p.address || '',
            wardIds: p.wards?.map((w: any) => w.id) || [],
          }));
        setParents(mappedParents);
        safeLocalStorageSet('markazu_parents', mappedParents);
      }
    } catch (e) {
      console.warn('[syncParentsFromBackend] error:', e);
    }
  };

  const syncAttendanceFromBackend = async () => {
    try {
      const res = await fetch('/api/attendance');
      const resData = await res.json();
      if (resData && resData.success && Array.isArray(resData.data)) {
        const mappedAttendance = resData.data.map((a: any) => ({
          id: a.id,
          date: a.date ? (typeof a.date === 'string' ? a.date.split('T')[0] : new Date(a.date).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
          studentId: a.studentId,
          studentName: a.student?.fullName || 'Student',
          programmeId: a.programmeId || undefined,
          classId: a.classId,
          className: a.schoolClass?.name || 'Class',
          teacherId: a.teacherId || undefined,
          status: a.statusEnum || a.status,
          remarks: a.remarks || undefined,
          isDraft: a.isDraft,
        }));
        setAttendance(mappedAttendance);
        safeLocalStorageSet('markazu_attendance', mappedAttendance);
      }
    } catch (e) {
      console.warn('[syncAttendanceFromBackend] error:', e);
    }
  };

  const syncUsersFromBackend = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (e) {
      console.warn('[syncUsersFromBackend] error:', e);
    }
  };

  const [deactivatedUsers, setDeactivatedUsers] = useState<User[]>([]);

  const fetchDeactivatedUsers = async (): Promise<User[]> => {
    try {
      const res = await fetch('/api/users?status=DEACTIVATED');
      const data = await res.json();
      if (data && Array.isArray(data.users)) {
        setDeactivatedUsers(data.users);
        return data.users;
      }
    } catch (e) {
      console.warn('[fetchDeactivatedUsers] error:', e);
    }
    return [];
  };

  const restoreUserAccount = async (userId: string) => {
    try {
      const targetUser = users.find((u) => u.id === userId) || deactivatedUsers.find((u) => u.id === userId);
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to restore user account.');
      }

      // Clear local deleted filters for this user identity
      clearDeletedUserIdentifier(userId, targetUser?.email, targetUser?.username);

      notify({
        type: 'success',
        title: 'Account Restored Successfully',
        message: `Account for "${data.user?.name || targetUser?.name || userId}" has been restored and is now ACTIVE.`,
      });

      // Synchronize all arrays cleanly from PostgreSQL Prisma source of truth
      await Promise.all([
        syncUsersFromBackend(),
        syncStudentsFromBackend(),
        syncTeachersFromBackend(),
        syncParentsFromBackend(),
        fetchDeactivatedUsers(),
      ]);

      return data;
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Restoration Failed',
        message: err.message || 'Could not restore user account.',
      });
      throw err;
    }
  };

  const permanentlyDeleteUserAccount = async (userId: string): Promise<any> => {
    try {
      const targetUser = users.find((u) => u.id === userId) || deactivatedUsers.find((u) => u.id === userId);
      const headers = getAuthHeaders();
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}/permanent-delete`, {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to permanently delete user account.');
      }

      clearDeletedUserIdentifier(userId, targetUser?.email, targetUser?.username);

      notify({
        type: 'success',
        title: 'Account Permanently Deleted',
        message: `Account for "${data.user?.name || targetUser?.name || userId}" has been permanently removed from the system.`,
      });

      await Promise.all([
        syncUsersFromBackend(),
        syncStudentsFromBackend(),
        syncTeachersFromBackend(),
        syncParentsFromBackend(),
        fetchDeactivatedUsers(),
      ]);

      return data;
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Permanent Deletion Failed',
        message: err.message || 'Could not permanently delete user account.',
      });
      throw err;
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Fetch Students
      syncStudentsFromBackend();

      // 2. Fetch Teachers
      syncTeachersFromBackend();

      // 2.2 Fetch Parents
      syncParentsFromBackend();

      // 2.3 Fetch Attendance
      syncAttendanceFromBackend();

      // 2.2 Fetch Parents
      syncParentsFromBackend();

      // 2.5 Fetch Programmes from PostgreSQL
      fetch('/api/programmes')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.programmes)) {
            const mappedProgrammes = data.programmes.map((p: any) => {
              let subcats: string[] = [];
              if (p.subcategories) {
                try {
                  subcats = typeof p.subcategories === 'string' ? JSON.parse(p.subcategories) : p.subcategories;
                } catch (e) {
                  subcats = [];
                }
              }
              return {
                id: p.id,
                programme_code: p.programme_code || p.code,
                programme_name_english: p.programme_name_english || p.nameEnglish || p.name,
                programme_name_arabic: p.programme_name_arabic || p.nameArabic || '',
                programme_name: p.programme_name_english || p.nameEnglish || p.name,
                hasSubcategories: !!p.hasSubcategories,
                subcategories: subcats,
                status: p.status === 'Active' || p.status === 'ACTIVE' ? 'Active' : 'Inactive',
                created_at: p.createdAt || p.created_at || new Date().toISOString(),
                updated_at: p.updatedAt || p.updated_at || new Date().toISOString(),
              };
            });
            setProgrammes(mappedProgrammes);
            safeLocalStorageSet('markazu_programmes', mappedProgrammes);
          }
        })
        .catch((e) => console.warn('[syncProgrammes] error:', e));

      // 3. Fetch Classes from PostgreSQL
      fetch('/api/classes')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.classes)) {
            const mappedClasses = data.classes.map((c: any) => ({
              id: c.id,
              name: c.name || c.class_name_english,
              class_name_english: c.name || c.class_name_english,
              class_name_arabic: c.class_name_arabic || c.classTeacher?.full_name_arabic || '',
              category: c.category,
              section: c.section,
              subcategory: c.subcategory || undefined,
              capacity: c.capacity,
              studentCount: c.studentCount || c._count?.students || 0,
              classTeacherId: c.classTeacherId || undefined,
              classTeacherName: c.classTeacherName || c.classTeacher?.fullName || undefined,
              classTeacherNameArabic: c.classTeacherNameArabic || c.classTeacher?.full_name_arabic || undefined,
              programmeId: c.programmeId || '',
              programmeName: c.programmeName || c.programme?.nameEnglish || 'Programme',
              programmeNameArabic: c.programmeNameArabic || c.programme?.nameArabic || '',
            }));
            setClasses(mappedClasses);
            safeLocalStorageSet('markazu_classes', mappedClasses);
          }
        })
        .catch((e) => console.warn('[syncClasses] error:', e));

      // 4. Fetch Subjects
      fetch('/api/subjects')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.subjects)) {
            const mappedSubjects = data.subjects.map((s: any) => ({
              id: s.id,
              name: s.name,
              arabicName: s.arabicName || undefined,
              code: s.code,
              category: s.category,
              description: s.description || '',
              programmeId: s.programmeId || undefined,
              programmeName: s.programme?.nameEnglish || undefined,
              classId: s.classId || undefined,
              className: s.schoolClass?.name || undefined,
              status: s.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
              displayOrder: s.displayOrder || 1,
            }));
            setSubjects(mappedSubjects);
            safeLocalStorageSet('markazu_subjects', mappedSubjects);
          }
        })
        .catch((e) => console.warn('[syncSubjects] error:', e));

      // 5. Fetch Attendance
      fetch('/api/attendance')
        .then((res) => res.json())
        .then((resData) => {
          if (resData && resData.success && Array.isArray(resData.data)) {
            const mappedAttendance = resData.data.map((a: any) => ({
              id: a.id,
              date: a.date,
              studentId: a.studentId,
              studentName: a.student?.fullName || 'Student',
              programmeId: a.programmeId || undefined,
              classId: a.classId,
              className: a.schoolClass?.name || 'Class',
              teacherId: a.teacherId || undefined,
              status: a.statusEnum || a.status,
              remarks: a.remarks || undefined,
              isDraft: a.isDraft,
            }));
            setAttendance(mappedAttendance);
            safeLocalStorageSet('markazu_attendance', mappedAttendance);
          }
        })
        .catch((e) => console.warn('[syncAttendance] error:', e));

      // 6. Fetch Tahfiz Progress
      fetch('/api/tahfiz')
        .then((res) => res.json())
        .then((resData) => {
          if (resData && resData.success && Array.isArray(resData.data)) {
            const mappedTahfiz = resData.data.map((t: any) => ({
              id: t.id,
              date: t.date,
              studentId: t.studentId,
              studentName: t.student?.fullName || 'Student',
              programmeId: t.programmeId || undefined,
              classId: t.classId,
              className: t.schoolClass?.name || 'Class',
              teacherId: t.teacherId,
              teacherName: t.teacher?.fullName || 'Teacher',
              hifzSurah: t.hifzSurah,
              hifzFromAyah: t.hifzFromAyah,
              hifzToAyah: t.hifzToAyah,
              hifzPages: t.hifzPages,
              currentJuz: t.currentJuz,
              sabkiSurah: t.sabkiSurah,
              sabkiRating: t.sabkiRating,
              manzilJuz: t.manzilJuz,
              manzilRating: t.manzilRating,
              teacherNotes: t.teacherNotes,
              studentBehaviour: t.studentBehaviour,
              completionPercentage: t.completionPercentage,
              teacherComment: t.teacherComment || undefined,
            }));
            setTahfizRecords(mappedTahfiz);
            safeLocalStorageSet('markazu_tahfiz_records', mappedTahfiz);
          }
        })
        .catch((e) => console.warn('[syncTahfiz] error:', e));

      // 7. Fetch Announcements
      fetch('/api/announcements')
        .then((res) => res.json())
        .then((resData) => {
          if (resData && Array.isArray(resData.announcements)) {
            setAnnouncements(resData.announcements);
            safeLocalStorageSet('markazu_announcements', resData.announcements);
          }
        })
        .catch((e) => console.warn('[syncAnnouncements] error:', e));

      // 8. Fetch Parents
      fetch('/api/parents')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.parents)) {
            setParents(data.parents);
            safeLocalStorageSet('markazu_parents', data.parents);
          }
        })
        .catch((e) => console.warn('[syncParents] error:', e));

      // 9. Fetch Programmes
      fetch('/api/programmes')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.programmes)) {
            setProgrammes(data.programmes);
            safeLocalStorageSet('markazu_programmes', data.programmes);
          }
        })
        .catch((e) => console.warn('[syncProgrammes] error:', e));

      // 10. Fetch Timetable Periods
      fetch('/api/timetable')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.timetablePeriods)) {
            setTimetablePeriods(data.timetablePeriods);
            safeLocalStorageSet('markazu_timetable', data.timetablePeriods);
          }
        })
        .catch((e) => console.warn('[syncTimetable] error:', e));

      // 11. Fetch Direct Messages
      fetch('/api/messages')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && Array.isArray(data.data)) {
            setDirectMessages(data.data);
            safeLocalStorageSet('markazu_direct_messages', data.data);
          }
        })
        .catch((e) => console.warn('[syncMessages] error:', e));

      // 12. Fetch Grades / Results
      fetch('/api/results')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.grades)) {
            setGrades(data.grades);
            safeLocalStorageSet('markazu_grades', data.grades);
          }
        })
        .catch((e) => console.warn('[syncResults] error:', e));

      // 13. Fetch Audit Logs
      fetch('/api/audit')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.auditLogs)) {
            setAuditLogs(data.auditLogs);
            safeLocalStorageSet('markazu_audit_logs', data.auditLogs);
          }
        })
        .catch((e) => console.warn('[syncAudit] error:', e));

      // 14. Fetch Academic Sessions
      fetch('/api/sessions')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.sessions)) {
            const active = data.sessions.find((s: any) => s.isCurrent) || data.sessions[0];
            if (active) {
              setCurrentSession({
                id: active.id,
                sessionName: active.sessionName,
                activeTerm: active.activeTerm,
                isCurrent: active.isCurrent,
              });
            }
          }
        })
        .catch((e) => console.warn('[syncSessions] error:', e));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && users && users.length > 0) {
      safeLocalStorageSet('markazu_users', users);
    }
  }, [users]);

  useEffect(() => {
    if (typeof window !== 'undefined' && currentUser) {
      safeLocalStorageSet('markazu_current_user', currentUser);
    }
  }, [currentUser]);

  const updateUserAvatar = async (avatarUrl: string): Promise<User | undefined> => {
    if (!currentUser) return undefined;

    const targetId = currentUser.id || currentUser.email || currentUser.username;
    if (!targetId) return undefined;

    // Optimistically update frontend state
    const optimisticUser: User = { ...currentUser, avatar: avatarUrl };
    setCurrentUser(optimisticUser);
    safeLocalStorageSet('markazu_current_user', optimisticUser);

    setUsers((prev) =>
      prev.map((u) =>
        (currentUser.id && u.id === currentUser.id) ||
        (currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUser.username && u.username && u.username.toLowerCase() === currentUser.username.toLowerCase())
          ? { ...u, avatar: avatarUrl }
          : u
      )
    );
    setTeachers((prev) =>
      prev.map((t) =>
        (currentUser.id && t.id === currentUser.id) ||
        (currentUser.id && t.userId === currentUser.id) ||
        (currentUser.email && t.email && t.email.toLowerCase() === currentUser.email.toLowerCase())
          ? { ...t, avatar: avatarUrl }
          : t
      )
    );
    setStudents((prev) =>
      prev.map((s) =>
        (currentUser.id && s.id === currentUser.id) ||
        (currentUser.id && s.userId === currentUser.id) ||
        (currentUser.email && s.email && s.email.toLowerCase() === currentUser.email.toLowerCase())
          ? { ...s, avatar: avatarUrl }
          : s
      )
    );
    setParents((prev) =>
      prev.map((p) =>
        (currentUser.id && p.id === currentUser.id) ||
        (currentUser.id && p.userId === currentUser.id) ||
        (currentUser.email && p.email && p.email.toLowerCase() === currentUser.email.toLowerCase())
          ? { ...p, avatar: avatarUrl }
          : p
      )
    );

    // Persist to PostgreSQL database via shared API
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(targetId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: avatarUrl }),
      });
      const data = await res.json();
      if (res.ok && data && data.user) {
        const savedUser: User = data.user;
        setCurrentUser((prev) => {
          const synced = { ...prev, ...savedUser };
          safeLocalStorageSet('markazu_current_user', synced);
          return synced;
        });
        setUsers((prev) =>
          prev.map((u) =>
            u.id === savedUser.id || (savedUser.email && u.email.toLowerCase() === savedUser.email.toLowerCase())
              ? { ...u, ...savedUser }
              : u
          )
        );
        return savedUser;
      }
    } catch (e) {
      console.warn('[updateUserAvatar] API sync warning:', e);
    }

    notify({
      type: 'success',
      title: 'Profile Photo Updated',
      message: `Profile photo updated successfully.`,
    });

    return optimisticUser;
  };

  const setSchoolLogo = (logo: string | null) => {
    setSchoolLogoState(logo);
    if (typeof window !== 'undefined') {
      try {
        if (logo) {
          localStorage.setItem('markazu_school_logo', logo);
        } else {
          localStorage.removeItem('markazu_school_logo');
        }
      } catch {}
    }
  };

  const setSchoolName = (name: string) => {
    const finalName = name.trim() || DEFAULT_SCHOOL_NAME;
    setSchoolNameState(finalName);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('markazu_school_name', finalName);
      } catch {}
    }
  };

  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [tahfizRecords, setTahfizRecords] = useState<TahfizRecord[]>([]);
  const [timetablePeriods, setTimetablePeriods] = useState<TimetablePeriod[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [assessmentConfig, setAssessmentConfig] = useState<AssessmentConfig>(DEFAULT_ASSESSMENT_CONFIG);
  const [resultSubmissions, setResultSubmissions] = useState<ResultApprovalSubmission[]>([]);
  const [reportCardTemplate, setReportCardTemplateState] = useState<ReportCardTemplate>(DEFAULT_REPORT_CARD_TEMPLATE);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(DEFAULT_GALLERY_ITEMS);

  // Permanent Auto-Syncing useEffect Hooks to ensure zero data loss on logout/login/refresh
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('markazu_users', JSON.stringify(users));
      } catch {}
    }
  }, [users]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('markazu_students', JSON.stringify(students));
      } catch {}
    }
  }, [students]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('markazu_teachers', JSON.stringify(teachers));
      } catch {}
    }
  }, [teachers]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('markazu_parents', JSON.stringify(parents));
      } catch {}
    }
  }, [parents]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('markazu_programmes', JSON.stringify(programmes));
      } catch {}
    }
  }, [programmes]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('markazu_classes', JSON.stringify(classes));
      } catch {}
    }
  }, [classes]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('markazu_subjects', JSON.stringify(subjects));
      } catch {}
    }
  }, [subjects]);

  const addNewsArticle = (art: NewsArticle) => {
    setNewsArticles((prev) => {
      const updated = [art, ...prev];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('markazu_news_articles', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const updateNewsArticle = (id: string, updatedFields: Partial<NewsArticle>) => {
    setNewsArticles((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, ...updatedFields } : a));
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('markazu_news_articles', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const deleteNewsArticle = (id: string) => {
    setNewsArticles((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('markazu_news_articles', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const addGalleryItem = (item: GalleryItem) => {
    setGalleryItems((prev) => {
      const updated = [item, ...prev];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('markazu_gallery_items', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const updateGalleryItem = (id: string, updatedFields: Partial<GalleryItem>) => {
    setGalleryItems((prev) => {
      const updated = prev.map((g) => (g.id === id ? { ...g, ...updatedFields } : g));
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('markazu_gallery_items', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const deleteGalleryItem = (id: string) => {
    setGalleryItems((prev) => {
      const updated = prev.filter((g) => g.id !== id);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('markazu_gallery_items', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const updateReportCardTemplate = (updated: Partial<ReportCardTemplate>) => {
    setReportCardTemplateState((prev) => {
      const next = { ...prev, ...updated, updatedAt: new Date().toISOString(), updatedBy: currentUser.name };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('markazu_report_card_template', JSON.stringify(next));
        } catch (e) {
          console.warn('[localStorage] Failed to save report sheet template:', e);
        }
      }
      return next;
    });
    notify({
      type: 'success',
      title: 'Report Sheet Template Saved',
      message: 'Default report card template & signature settings updated successfully across all student report cards.',
    });
  };

  // Safe LocalStorage Persistence Helper to prevent QuotaExceededError
  const safeLocalStorageSet = (key: string, data: any) => {
    if (typeof window === 'undefined') return;
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
    } catch (err: any) {
      console.warn(`[localStorage QUOTA EXCEEDED] Storage quota limit reached for key '${key}'. Cleaning up legacy cache...`);
      try {
        // Clear redundant legacy keys
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('markazu_user_avatar_') || k.startsWith('markazu_user_profile_') || k.startsWith('markazu_fav_') || k.startsWith('markazu_recent_'))) {
            localStorage.removeItem(k);
          }
        }
        // Save without modification if key is markazu_current_user
        if (key === 'markazu_current_user') {
          localStorage.setItem(key, JSON.stringify(data));
          return;
        }
        if (Array.isArray(data)) {
          const sanitized = data.map((item: any) => {
            if (item && typeof item === 'object') {
              const copy = { ...item };
              // Strip heavy avatars only from multi-item array lists if quota is critically exceeded
              if (typeof copy.avatar === 'string' && copy.avatar.length > 50000) delete copy.avatar;
              if (typeof copy.photoUrl === 'string' && copy.photoUrl.length > 50000) delete copy.photoUrl;
              return copy;
            }
            return item;
          });
          localStorage.setItem(key, JSON.stringify(sanitized));
        } else {
          localStorage.setItem(key, JSON.stringify(data));
        }
      } catch (innerErr) {
        console.error(`[localStorage FALLBACK] Storage full for '${key}'. Kept safely in active memory state.`);
      }
    }
  };

  // Automatic localStorage Persistence Effects
  useEffect(() => {
    safeLocalStorageSet('markazu_teachers', teachers);
  }, [teachers]);

  useEffect(() => {
    safeLocalStorageSet('markazu_parents', parents);
  }, [parents]);

  useEffect(() => {
    safeLocalStorageSet('markazu_students', students);
  }, [students]);

  useEffect(() => {
    safeLocalStorageSet('markazu_users', users);
  }, [users]);

  useEffect(() => {
    safeLocalStorageSet('markazu_teacher_assignments', teacherAssignments);
  }, [teacherAssignments]);

  useEffect(() => {
    safeLocalStorageSet('markazu_attendance', attendance);
  }, [attendance]);

  useEffect(() => {
    safeLocalStorageSet('markazu_tahfiz_records', tahfizRecords);
  }, [tahfizRecords]);

  useEffect(() => {
    safeLocalStorageSet('markazu_grades', grades);
  }, [grades]);

  useEffect(() => {
    safeLocalStorageSet('markazu_audit_logs', auditLogs);
  }, [auditLogs]);

  // Admission System State
  const [admissionStatus, setAdmissionStatusState] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [admissionApplications, setAdmissionApplications] = useState<AdmissionApplication[]>(INITIAL_ADMISSION_APPLICATIONS);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('markazu_admission_apps', JSON.stringify(admissionApplications));
    }
  }, [admissionApplications]);

  const toggleAdmissionStatus = (status: 'OPEN' | 'CLOSED') => {
    setAdmissionStatusState(status);
    if (typeof window !== 'undefined') {
      localStorage.setItem('markazu_admission_status', status);
    }
    notify({
      type: 'info',
      title: `Admission Status Updated`,
      message: `Online Admissions are now ${status}. Public announcement banner updated.`,
    });
    addAuditLog({
      action: 'SYSTEM_SETTINGS_UPDATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Changed online admission status to ${status}`,
      ipAddress: '197.210.227.14',
      status: 'SUCCESS',
    });
  };

  const submitAdmissionApplication = (
    data: Omit<AdmissionApplication, 'id' | 'applicationNo' | 'status' | 'submittedAt'>
  ): AdmissionApplication => {
    const appId = `app-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const appNo = `APP-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newApp: AdmissionApplication = {
      ...data,
      id: appId,
      applicationNo: appNo,
      status: 'PENDING_REVIEW',
      submittedAt: new Date().toISOString(),
    };

    setAdmissionApplications((prev) => [newApp, ...prev]);

    notify({
      type: 'success',
      title: 'Application Submitted!',
      message: `Your admission application (${appNo}) for ${data.studentFullName} has been submitted for review.`,
    });

    addAuditLog({
      action: 'ADMISSION_SUBMITTED',
      performedBy: data.parentName,
      userRole: 'PARENT',
      details: `Submitted online admission application (${appNo}) for student candidate ${data.studentFullName}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `AdmissionApplication/${appId}`,
      status: 'SUCCESS',
    });

    return newApp;
  };

  const approveAdmissionApplication = (appId: string, programmeIds: string[], classIds: string[]) => {
    const app = admissionApplications.find((a) => a.id === appId);
    if (!app) return;

    if (app.status === 'APPROVED') {
      notify({ type: 'warning', title: 'Already Approved', message: 'This admission application has already been approved.' });
      return;
    }

    const studentId = `MU-2026-STUD-${Math.floor(100 + Math.random() * 900)}`;
    const studentUserId = `usr-student-${Date.now()}`;
    const parentUserId = `usr-parent-${Date.now()}`;

    const assignedProgs = programmes.filter((p) => programmeIds.includes(p.id));
    const assignedCls = classes.filter((c) => classIds.includes(c.id));
    const firstProg = assignedProgs[0] || programmes[0];
    const firstCls = assignedCls[0] || classes[0];

    const newStudent: Student = {
      id: studentId,
      userId: studentUserId,
      admissionNo: studentId,
      fullName: app.studentFullName,
      gender: app.studentGender,
      dob: app.studentDob,
      dateEnrolled: new Date().toISOString().split('T')[0],
      email: app.parentEmail,
      programmeId: firstProg.id,
      programmeName: firstProg.programme_name_english,
      programmeNameArabic: firstProg.programme_name_arabic,
      classId: firstCls.id,
      className: firstCls.name,
      guardianName: app.parentName,
      guardianId: parentUserId,
      guardianPhone: app.parentPhone,
      stateOfOrigin: app.state,
      localGovtArea: app.lga,
      residentialAddress: app.studentAddress,
      status: 'ACTIVE',
      hifzProgress: {
        currentJuz: 1,
        juzCompleted: 0,
        currentSurah: 'Al-Fatiha',
        currentAyah: 1,
        completedSurahsCount: 0,
        tajweedRating: 5,
        sabkiRating: 5,
        manzilRating: 5,
        completionPercentage: 0,
      },
      akhlaqRating: 'EXCELLENT',
    };

    const studentTempPass = generateTemporaryPassword();
    const newStudentUser: User = {
      id: studentUserId,
      name: app.studentFullName,
      email: app.parentEmail,
      username: studentId,
      role: 'STUDENT',
      passwordHash: hashPassword(studentTempPass),
      isFirstLogin: true,
      mustChangePassword: true,
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      isLocked: false,
      createdAt: new Date().toISOString(),
    };

    const newParent: Parent = {
      id: parentUserId,
      userId: parentUserId,
      fullName: app.parentName,
      email: app.parentEmail,
      phone: app.parentPhone,
      whatsapp: app.parentWhatsapp,
      relationship: app.parentRelationship,
      occupation: app.parentOccupation,
      address: app.parentAddress,
      wardsCount: 1,
      wardIds: [studentId],
      linkedStudentIds: [studentId],
      dateRegistered: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
    };

    const parentTempPass = generateTemporaryPassword();
    const newParentUser: User = {
      id: parentUserId,
      name: app.parentName,
      email: app.parentEmail,
      username: app.parentEmail,
      role: 'PARENT',
      passwordHash: hashPassword(parentTempPass),
      isFirstLogin: true,
      mustChangePassword: true,
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      isLocked: false,
      createdAt: new Date().toISOString(),
    };

    setStudents((prev) => [newStudent, ...prev]);
    setParents((prev) => [newParent, ...prev]);
    setUsers((prev) => [newStudentUser, newParentUser, ...prev]);

    setAdmissionApplications((prev) =>
      prev.map((a) =>
        a.id === appId
          ? {
              ...a,
              status: 'APPROVED',
              reviewedAt: new Date().toISOString(),
              reviewedBy: currentUser.name,
              assignedProgrammeIds: programmeIds,
              assignedClassIds: classIds,
              generatedStudentId: studentId,
              generatedParentId: parentUserId,
            }
          : a
      )
    );

    sendSystemEmail({
      to: app.parentEmail,
      recipientName: app.parentName,
      subject: `Admission Approved! Credentials for ${app.studentFullName} - Markazu Umar`,
      template: 'WELCOME_NEW_ACCOUNT',
      metadata: {
        username: `Parent Portal: ${app.parentEmail} | Student Portal Username (Student ID): ${studentId}`,
        tempPassword: parentTempPass,
      },
    });

    addAuditLog({
      action: 'ADMISSION_APPROVED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Approved admission for student ${app.studentFullName} (Student ID: ${studentId}). Created Student & Parent portal accounts.`,
      ipAddress: '197.210.227.14',
      affectedRecord: `AdmissionApplication/${appId}`,
      status: 'SUCCESS',
    });

    notify({
      type: 'success',
      title: 'Admission Approved!',
      message: `Student Portal (${studentId}) & Parent Portal created successfully. Login credentials emailed to ${app.parentEmail}.`,
    });
  };

  const rejectAdmissionApplication = (appId: string, reason?: string) => {
    setAdmissionApplications((prev) =>
      prev.map((a) =>
        a.id === appId
          ? {
              ...a,
              status: 'REJECTED',
              reviewedAt: new Date().toISOString(),
              reviewedBy: currentUser.name,
              rejectionReason: reason || 'Application did not meet requirements.',
            }
          : a
      )
    );

    addAuditLog({
      action: 'ADMISSION_REJECTED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Rejected admission application ID: ${appId}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `AdmissionApplication/${appId}`,
      status: 'WARNING',
    });

    notify({
      type: 'warning',
      title: 'Application Rejected',
      message: `Admission application ID ${appId} marked as rejected.`,
    });
  };

  const saveAttendanceBatch = (newRecords: AttendanceRecord[], isDraft: boolean = false) => {
    const normalizedRecords = newRecords.map((r) => ({
      ...r,
      date: r.date.includes('T') ? r.date.split('T')[0] : r.date,
      isDraft,
    }));

    setAttendance((prev) => {
      const updated = [...prev];
      normalizedRecords.forEach((rec) => {
        const idx = updated.findIndex((r) => r.studentId === rec.studentId && r.date === rec.date);
        if (idx >= 0) {
          updated[idx] = rec;
        } else {
          updated.push(rec);
        }
      });
      safeLocalStorageSet('markazu_attendance', updated);
      return updated;
    });

    // Sync batch to backend database
    try {
      fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: normalizedRecords, isDraft }),
      })
        .then((res) => res.json())
        .then((resData) => {
          if (resData && resData.success) {
            syncAttendanceFromBackend();
          }
        })
        .catch((err) => console.warn('[saveAttendanceBatch] API sync warning:', err));
    } catch (e) {
      console.warn('[saveAttendanceBatch] API error:', e);
    }

    if (!isDraft) {
      addAuditLog({
        action: 'ATTENDANCE_CREATED',
        performedBy: currentUser.name,
        userRole: currentUser.role,
        details: `Marked attendance roster batch of ${newRecords.length} student records for date ${newRecords[0]?.date || 'today'}`,
        ipAddress: '197.210.227.14',
        status: 'SUCCESS',
      });

      // Automatically generate parent in-app notifications for Absent/Late students
      newRecords.filter((r) => r.status === 'ABSENT' || r.status === 'LATE').forEach((rec) => {
        const targetStudent = students.find((s) => s.id === rec.studentId);
        if (targetStudent) {
          const parent = parents.find((p) => p.wardIds?.includes(targetStudent.id) || p.id === targetStudent.guardianId);
          if (parent) {
            setInAppNotifications((prev) => [
              {
                id: `notif-att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                userId: parent.id,
                title: `Attendance Alert: ${targetStudent.fullName} marked ${rec.status}`,
                body: `Your ward ${targetStudent.fullName} was marked ${rec.status.toLowerCase()} for date ${rec.date}. Remarks: ${rec.remarks || 'None'}.`,
                priority: rec.status === 'ABSENT' ? 'URGENT' : 'IMPORTANT',
                category: 'GENERAL_NOTICE',
                channels: ['IN_APP', 'WHATSAPP'],
                senderName: currentUser.name,
                read: false,
                pinned: false,
                isArchived: false,
                createdAt: new Date().toISOString(),
              },
              ...prev,
            ]);
          }
        }
      });
    }
  };

  const adminOverrideAttendance = (attendanceId: string, newStatus: AttendanceStatusType, reason: string) => {
    setAttendance((prev) =>
      prev.map((rec) => {
        if (rec.id === attendanceId) {
          return {
            ...rec,
            status: newStatus,
            editedBy: `${currentUser.name} (${currentUser.role})`,
            editedAt: new Date().toISOString(),
            editReason: reason,
            isDraft: false,
          };
        }
        return rec;
      })
    );

    addAuditLog({
      action: 'ATTENDANCE_ADMIN_OVERRIDE',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Administrator override attendance record ${attendanceId} to ${newStatus}. Reason: ${reason}`,
      ipAddress: '197.210.227.14',
      status: 'SUCCESS',
    });
  };

  const saveTahfizRecord = (newRecord: Omit<TahfizRecord, 'id'>) => {
    const recordWithId: TahfizRecord = {
      ...newRecord,
      id: `tahfiz-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    setTahfizRecords((prev) => [recordWithId, ...prev]);

    // Sync to backend database
    try {
      fetch('/api/tahfiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordWithId),
      }).catch((err) => console.warn('[saveTahfizRecord] API sync warning:', err));
    } catch (e) {
      console.warn('[saveTahfizRecord] API error:', e);
    }

    // Update student's primary Hifz stats
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === newRecord.studentId) {
          return {
            ...s,
            hifzProgress: {
              ...s.hifzProgress,
              currentSurah: newRecord.hifzSurah,
              currentAyah: newRecord.hifzToAyah,
              currentJuz: newRecord.currentJuz || s.hifzProgress.currentJuz,
              completionPercentage: newRecord.completionPercentage ?? s.hifzProgress.completionPercentage,
            },
          };
        }
        return s;
      })
    );

    addAuditLog({
      action: 'TAHFIZ_UPDATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Recorded Tahfiz progress for ${newRecord.studentName}: ${newRecord.hifzSurah} (Ayah ${newRecord.hifzFromAyah}-${newRecord.hifzToAyah})`,
      ipAddress: '197.210.227.14',
      status: 'SUCCESS',
    });

    // Generate parent alert
    const targetStudent = students.find((s) => s.id === newRecord.studentId);
    if (targetStudent) {
      const parent = parents.find((p) => p.wardIds?.includes(targetStudent.id) || p.id === targetStudent.guardianId);
      if (parent) {
        setInAppNotifications((prev) => [
          {
            id: `notif-tahfiz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            userId: parent.id,
            title: `Tahfiz Progress Summary: ${targetStudent.fullName}`,
            body: `Today's Hifz: ${newRecord.hifzSurah} (Ayah ${newRecord.hifzFromAyah}-${newRecord.hifzToAyah}). Sabki: ${newRecord.sabkiSurah} (${newRecord.sabkiRating}/5). Notes: ${newRecord.teacherNotes}`,
            priority: 'IMPORTANT',
            category: 'GENERAL_NOTICE',
            channels: ['IN_APP', 'WHATSAPP'],
            senderName: currentUser.name,
            read: false,
            pinned: false,
            isArchived: false,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    }
  };

  const sendTeacherDirectMessage = (msg: Omit<DirectMessage, 'id' | 'createdAt' | 'isRead'>) => {
    const fullMsg: DirectMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setDirectMessages((prev) => [fullMsg, ...prev]);

    addAuditLog({
      action: 'TEACHER_MESSAGE_SENT',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Sent direct message (${msg.messageType}) to student ${msg.studentName}: "${msg.subject}"`,
      ipAddress: '197.210.227.14',
      status: 'SUCCESS',
    });

    // Notify student via in-app notification
    setInAppNotifications((prev) => [
      {
        id: `notif-msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: msg.recipientStudentId,
        title: `Teacher Message: ${msg.subject}`,
        body: msg.content,
        priority: msg.messageType === 'EXAMINATION' || msg.messageType === 'HOMEWORK' ? 'IMPORTANT' : 'NORMAL',
        category: 'GENERAL_NOTICE',
        channels: ['IN_APP'],
        senderName: currentUser.name,
        read: false,
        pinned: false,
        isArchived: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const markDirectMessageRead = (messageId: string) => {
    setDirectMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isRead: true } : m))
    );
    addAuditLog({
      action: 'NOTIFICATION_READ',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Marked direct message ${messageId} as read`,
      ipAddress: '197.210.227.14',
      status: 'SUCCESS',
    });
  };

  const archiveDirectMessage = (messageId: string) => {
    setDirectMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isArchived: true } : m))
    );
  };

  const updateAssessmentConfig = (updated: Partial<AssessmentConfig>) => {
    setAssessmentConfig((prev) => ({ ...prev, ...updated, updatedAt: new Date().toISOString() }));
    addAuditLog({
      action: 'ASSESSMENT_CONFIG_UPDATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: 'Updated global assessment components, max marks, and grading scale parameters',
      ipAddress: '197.210.227.14',
      status: 'SUCCESS',
    });
  };

  const saveGradeGridDraft = (draftGrades: GradeRecord[]) => {
    setGrades((prev) => {
      const remaining = prev.filter(
        (g) => !draftGrades.some((d) => d.studentId === g.studentId && d.subjectId === g.subjectId && d.term === g.term && d.session === g.session)
      );
      return [...draftGrades, ...remaining];
    });
    addAuditLog({
      action: 'RESULT_UPDATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Saved draft marks for ${draftGrades.length} students`,
      ipAddress: '197.210.227.14',
      status: 'SUCCESS',
    });
  };

  const submitResultBatch = (params: {
    teacherId: string;
    teacherName: string;
    programmeId: string;
    programmeName: string;
    classId: string;
    className: string;
    subjectId: string;
    subjectName: string;
    term: string;
    session: string;
    totalStudents: number;
    completedRecords: number;
    missingScores: number;
    classAverage: number;
    highestScore: number;
    lowestScore: number;
    grades: GradeRecord[];
  }) => {
    const submissionId = `sub-${Date.now()}`;
    const newSubmission: ResultApprovalSubmission = {
      id: submissionId,
      teacherId: params.teacherId,
      teacherName: params.teacherName,
      programmeId: params.programmeId,
      programmeName: params.programmeName,
      classId: params.classId,
      className: params.className,
      subjectId: params.subjectId,
      subjectName: params.subjectName,
      term: params.term,
      session: params.session,
      totalStudents: params.totalStudents,
      completedRecords: params.completedRecords,
      missingScores: params.missingScores,
      classAverage: params.classAverage,
      highestScore: params.highestScore,
      lowestScore: params.lowestScore,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    };

    setResultSubmissions((prev) => [newSubmission, ...prev]);

    // Update grade records status to SUBMITTED
    const submittedGrades = params.grades.map((g) => ({
      ...g,
      status: 'SUBMITTED' as const,
      submissionId,
      submittedAt: new Date().toISOString(),
    }));

    setGrades((prev) => {
      const remaining = prev.filter(
        (g) => !submittedGrades.some((d) => d.studentId === g.studentId && d.subjectId === g.subjectId && d.term === g.term && d.session === g.session)
      );
      return [...submittedGrades, ...remaining];
    });

    addAuditLog({
      action: 'RESULT_SUBMITTED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Submitted result entry batch for ${params.subjectName} (${params.className}) to Administrator Approval Queue`,
      affectedRecord: `ResultApprovalSubmission/${submissionId}`,
      ipAddress: '197.210.227.14',
      status: 'SUCCESS',
    });
  };

  const approveResultSubmission = (submissionId: string, comments?: string) => {
    const targetSub = resultSubmissions.find((s) => s.id === submissionId);
    if (!targetSub) return;

    const now = new Date().toISOString();
    setResultSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              status: 'APPROVED',
              adminComments: comments || 'Approved by Administrator',
              reviewedAt: now,
              reviewedBy: currentUser.name,
            }
          : s
      )
    );

    setGrades((prev) =>
      prev.map((g) =>
        g.submissionId === submissionId
          ? { ...g, status: 'APPROVED', approvedAt: now, approvedBy: currentUser.name }
          : g
      )
    );

    // Notify Teacher
    const newNotif: InAppNotification = {
      id: `notif-${Date.now()}`,
      userId: targetSub.teacherId,
      title: `Results Approved: ${targetSub.subjectName} (${targetSub.className})`,
      body: `Assalamu Alaikum. Your submitted result batch for ${targetSub.subjectName} in ${targetSub.className} has been reviewed and APPROVED by ${currentUser.name}. Scores are now available for official report card generation.`,
      priority: 'IMPORTANT',
      category: 'EXAMINATION_NOTICE',
      channels: ['IN_APP', 'DASHBOARD'],
      senderName: currentUser.name,
      read: false,
      pinned: true,
      isArchived: false,
      createdAt: now,
    };
    setInAppNotifications((prev) => [newNotif, ...prev]);

    addAuditLog({
      action: 'RESULT_APPROVED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Approved result batch for ${targetSub.subjectName} (${targetSub.className})`,
      affectedRecord: `ResultApprovalSubmission/${submissionId}`,
      ipAddress: '197.210.227.14',
      status: 'SUCCESS',
    });
  };

  const rejectResultSubmission = (submissionId: string, reason: string) => {
    const targetSub = resultSubmissions.find((s) => s.id === submissionId);
    if (!targetSub) return;

    const now = new Date().toISOString();
    setResultSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              status: 'REJECTED',
              adminComments: reason,
              reviewedAt: now,
              reviewedBy: currentUser.name,
            }
          : s
      )
    );

    setGrades((prev) =>
      prev.map((g) =>
        g.submissionId === submissionId
          ? { ...g, status: 'REJECTED', rejectionReason: reason }
          : g
      )
    );

    // Notify Teacher
    const newNotif: InAppNotification = {
      id: `notif-${Date.now()}`,
      userId: targetSub.teacherId,
      title: `Results Rejected: ${targetSub.subjectName} (${targetSub.className})`,
      body: `Assalamu Alaikum. Your submitted result batch for ${targetSub.subjectName} in ${targetSub.className} was REJECTED by ${currentUser.name}. Reason: "${reason}".`,
      priority: 'URGENT',
      category: 'EXAMINATION_NOTICE',
      channels: ['IN_APP'],
      senderName: currentUser.name,
      read: false,
      pinned: true,
      isArchived: false,
      createdAt: now,
    };
    setInAppNotifications((prev) => [newNotif, ...prev]);

    addAuditLog({
      action: 'RESULT_REJECTED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Rejected result batch for ${targetSub.subjectName} (${targetSub.className}). Reason: ${reason}`,
      affectedRecord: `ResultApprovalSubmission/${submissionId}`,
      ipAddress: '197.210.227.14',
      status: 'WARNING',
    });
  };

  const returnResultSubmission = (submissionId: string, comments: string) => {
    const targetSub = resultSubmissions.find((s) => s.id === submissionId);
    if (!targetSub) return;

    const now = new Date().toISOString();
    setResultSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              status: 'RETURNED',
              adminComments: comments,
              reviewedAt: now,
              reviewedBy: currentUser.name,
            }
          : s
      )
    );

    setGrades((prev) =>
      prev.map((g) =>
        g.submissionId === submissionId
          ? { ...g, status: 'RETURNED', rejectionReason: comments }
          : g
      )
    );

    // Notify Teacher
    const newNotif: InAppNotification = {
      id: `notif-${Date.now()}`,
      userId: targetSub.teacherId,
      title: `Action Required: Results Returned for Correction (${targetSub.subjectName})`,
      body: `Assalamu Alaikum. Your submitted result batch for ${targetSub.subjectName} (${targetSub.className}) has been RETURNED for correction by ${currentUser.name}. Comments: "${comments}". Please update the scores and resubmit.`,
      priority: 'URGENT',
      category: 'EXAMINATION_NOTICE',
      channels: ['IN_APP', 'DASHBOARD'],
      senderName: currentUser.name,
      read: false,
      pinned: true,
      isArchived: false,
      createdAt: now,
    };
    setInAppNotifications((prev) => [newNotif, ...prev]);

    addAuditLog({
      action: 'RESULT_RETURNED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Returned result batch for ${targetSub.subjectName} (${targetSub.className}) with comments: ${comments}`,
      affectedRecord: `ResultApprovalSubmission/${submissionId}`,
      ipAddress: '197.210.227.14',
      status: 'WARNING',
    });
  };
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentSession, setCurrentSession] = useState<SchoolSession>(CURRENT_SESSION);

  // Enterprise Communication Center States
  const [communications, setCommunications] = useState<CommunicationMessage[]>([]);
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);
  const [deliveryQueue, setDeliveryQueue] = useState<QueueItem[]>([]);
  const [inAppNotifications, setInAppNotifications] = useState<InAppNotification[]>([]);
  const [communicationSettings, setCommunicationSettings] = useState<CommunicationSettings>(DEFAULT_COMMUNICATION_SETTINGS);

  const addAuditLog = (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    const newEntry: AuditEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toLocaleString(),
    };
    setAuditLogs((prev) => [newEntry, ...prev]);

    // Asynchronously persist to PostgreSQL audit log table
    if (typeof window !== 'undefined') {
      fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      }).catch((err) => console.warn('[auditLog API sync warning]:', err));
    }
  };

  const switchRole = (role: UserRole) => {
    const targetUser = users.find((u) => u.role === role) || users[0];
    setCurrentUser(targetUser);
    addAuditLog({
      action: 'ROLE_SWITCH',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Switched view context to ${role}`,
      ipAddress: '197.210.227.14',
      status: 'SUCCESS',
    });
  };

  const createUserAccount = async (userData: {
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    assignedProgrammeId?: string;
    assignedProgrammeName?: string;
  }): Promise<User> => {
    const cleanEmail = userData.email.trim().toLowerCase();

    try {
      const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('markazu_session_token') || '' : '';
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
          'x-session-token': sessionToken,
        },
        body: JSON.stringify(userData),
      });
      const data = await res.json();

      if (res.ok && data.user) {
        const created = data.user;
        const newUser: User = {
          id: created.id,
          name: created.name,
          email: created.email,
          role: created.role,
          username: created.username,
          phone: userData.phone,
          assignedProgrammeId: created.assignedProgrammeId,
          assignedProgrammeName: created.assignedProgrammeName,
          status: 'ACTIVE',
          passwordHash: hashPassword(created.tempPassword || 'admin123'),
          isFirstLogin: true,
          mustChangePassword: true,
          isLocked: false,
          failedLoginAttempts: 0,
          createdAt: new Date().toISOString(),
        };

        const updatedUsers = [newUser, ...users];
        setUsers(updatedUsers);
        safeLocalStorageSet('markazu_users', updatedUsers);

        if (created.role === 'TEACHER') {
          syncTeachersFromBackend();
        } else if (created.role === 'STUDENT') {
          syncStudentsFromBackend();
        }

        // Also ensure client-side email dispatch if needed
        sendSystemEmail({
          to: cleanEmail,
          recipientName: userData.name,
          subject: `Welcome to Markazu Umar Portal - Your Account Credentials (${created.username})`,
          template: 'WELCOME_NEW_ACCOUNT',
          metadata: {
            username: created.username,
            tempPassword: created.tempPassword || 'admin123',
            role: created.role,
            email: cleanEmail,
          },
        }).catch((e) => console.warn('[EMAIL DISPATCH]', e));

        notify({
          type: 'success',
          title: 'User Account Created',
          message: `Account created for ${userData.name}. Username: ${created.username}, Temp Password: ${created.tempPassword}. Welcome email dispatched to ${cleanEmail}.`,
        });

        return newUser;
      } else if (data && data.error) {
        notify({
          type: 'error',
          title: 'User Creation Failed',
          message: data.error,
        });
        throw new Error(data.error);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('already exists')) {
        throw err;
      }
      console.warn('[createUserAccount] API call fallback:', err);
    }

    const rolePrefixMap: Record<UserRole, string> = {
      SUPER_ADMIN: 'MUBK-SAD',
      ADMIN: 'MUBK-ADM',
      HEADMASTER: 'MUBK-HM',
      TEACHER: 'MUBK-TEA',
      STUDENT: 'MUBK-STU',
      PARENT: 'MUBK-PAR',
    };
    const prefix = rolePrefixMap[userData.role] || 'MUBK-USR';
    const generatedUsername = `${prefix}-000${users.length + 1}`;
    const tempPassword = `Markazu@${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: userData.name,
      email: cleanEmail,
      role: userData.role,
      username: generatedUsername,
      phone: userData.phone,
      assignedProgrammeId: userData.assignedProgrammeId,
      assignedProgrammeName: userData.assignedProgrammeName,
      status: 'ACTIVE',
      passwordHash: hashPassword(tempPassword),
      isFirstLogin: true,
      mustChangePassword: true,
      isLocked: false,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = [newUser, ...users];
    setUsers(updatedUsers);
    safeLocalStorageSet('markazu_users', updatedUsers);

    // Dispatch real welcome email with temporary password & username
    sendSystemEmail({
      to: cleanEmail,
      recipientName: userData.name,
      subject: `Welcome to Markazu Umar Portal - Your Account Credentials (${generatedUsername})`,
      template: 'WELCOME_NEW_ACCOUNT',
      metadata: {
        username: generatedUsername,
        tempPassword: tempPassword,
        role: userData.role,
        email: cleanEmail,
      },
    }).catch((e) => console.warn('[EMAIL DISPATCH]', e));

    notify({
      type: 'success',
      title: 'User Account Created',
      message: `Account created for ${userData.name} (${userData.role}). Login credentials emailed to ${cleanEmail}. Username: ${generatedUsername}, Temp Password: ${tempPassword}`,
    });

    return newUser;
  };

  const deleteUserAccount = async (userId: string) => {
    const userToDelete = users.find(
      (u) =>
        u.id === userId ||
        u.email.toLowerCase() === userId.toLowerCase() ||
        (u.username && u.username.toLowerCase() === userId.toLowerCase())
    );
    if (!userToDelete) return;
    if (userToDelete.role === 'SUPER_ADMIN') {
      notify({
        type: 'error',
        title: 'Action Prohibited',
        message: 'Super Admin primary account cannot be deleted.',
      });
      return;
    }

    const targetId = userToDelete.id;
    const targetEmail = userToDelete.email.toLowerCase().trim();
    const targetUsername = userToDelete.username?.toLowerCase().trim();

    recordDeletedUserIdentifier(targetId, targetEmail, targetUsername);

    // Call backend API to delete from database
    try {
      await fetch(`/api/users/${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('[deleteUserAccount] API delete warning:', e);
    }

    if (typeof window !== 'undefined') {
      try {
        const savedPass = localStorage.getItem('markazu_user_passwords');
        if (savedPass) {
          const pMap = JSON.parse(savedPass);
          delete pMap[targetEmail];
          delete pMap[targetId];
          if (targetUsername) delete pMap[targetUsername];
          localStorage.setItem('markazu_user_passwords', JSON.stringify(pMap));
        }
        localStorage.removeItem(`markazu_user_profile_${targetId}`);
        localStorage.removeItem(`markazu_user_profile_${targetEmail}`);
        localStorage.removeItem(`markazu_user_avatar_${targetId}`);
        localStorage.removeItem(`markazu_user_avatar_${targetEmail}`);
      } catch {}
    }

    // 1. Remove from users state & LocalStorage
    const updatedUsers = users.filter(
      (u) =>
        u.id !== targetId &&
        u.email.toLowerCase().trim() !== targetEmail &&
        (!targetUsername || u.username?.toLowerCase().trim() !== targetUsername)
    );
    setUsers(updatedUsers);
    safeLocalStorageSet('markazu_users', updatedUsers);

    // 2. Remove permanently from teachers/headmasters state & LocalStorage
    setTeachers((prev) => {
      const updated = prev.filter(
        (t) => t.id !== targetId && t.userId !== targetId && t.email?.toLowerCase().trim() !== targetEmail
      );
      safeLocalStorageSet('markazu_teachers', updated);
      return updated;
    });

    // 3. Remove permanently from students state & LocalStorage
    setStudents((prev) => {
      const updated = prev.filter(
        (s) => s.id !== targetId && s.userId !== targetId && s.email?.toLowerCase().trim() !== targetEmail
      );
      safeLocalStorageSet('markazu_students', updated);
      return updated;
    });

    // 4. Remove permanently from parents state & LocalStorage
    setParents((prev) => {
      const updated = prev.filter(
        (p) => p.id !== targetId && p.userId !== targetId && p.email?.toLowerCase().trim() !== targetEmail
      );
      safeLocalStorageSet('markazu_parents', updated);
      return updated;
    });

    notify({
      type: 'warning',
      title: 'User Account Deactivated',
      message: `User account for ${userToDelete.name} (${userToDelete.role}) has been deactivated.`,
    });

    fetchDeactivatedUsers();

    addAuditLog({
      action: 'USER_ACCOUNT_DEACTIVATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Deactivated ${userToDelete.role} user account: ${userToDelete.name} (${userToDelete.email})`,
      ipAddress: '197.210.227.14',
      affectedRecord: `User/${targetId}`,
      status: 'WARNING',
    });
  };

  const updateUserAccount = async (userId: string, updates: Partial<User>) => {
    const targetUser = users.find(
      (u) =>
        u.id === userId ||
        u.email.toLowerCase() === userId.toLowerCase() ||
        (u.username && u.username.toLowerCase() === userId.toLowerCase())
    );
    const realTargetId = targetUser ? targetUser.id : userId;
    const realTargetEmail = targetUser ? targetUser.email.toLowerCase() : userId.toLowerCase();

    // Optimistic update in state
    const updated = users.map((u) =>
      u.id === realTargetId || u.email.toLowerCase() === realTargetEmail ? { ...u, ...updates } : u
    );
    setUsers(updated);

    // Call shared backend API to persist in PostgreSQL database
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(realTargetId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data && data.user) {
        const savedUser: User = data.user;
        setUsers((prev) =>
          prev.map((u) =>
            u.id === savedUser.id || (savedUser.email && u.email.toLowerCase() === savedUser.email.toLowerCase())
              ? { ...u, ...savedUser }
              : u
          )
        );
        if (
          currentUser &&
          (currentUser.id === savedUser.id ||
            currentUser.email.toLowerCase() === savedUser.email.toLowerCase() ||
            (currentUser.username && savedUser.username && currentUser.username.toLowerCase() === savedUser.username.toLowerCase()))
        ) {
          const merged = { ...currentUser, ...savedUser };
          setCurrentUser(merged);
          safeLocalStorageSet('markazu_current_user', merged);
        }
      }
    } catch (e) {
      console.warn('[updateUserAccount] API update warning:', e);
    }

    // Also update corresponding Teacher / Student / Parent if applicable
    if (updates.name || updates.email || updates.avatar || updates.phone) {
      setTeachers((prev) => {
        const next = prev.map((t) => {
          if (t.id === realTargetId || t.userId === realTargetId || (t.email && t.email.toLowerCase() === realTargetEmail)) {
            return {
              ...t,
              fullName: updates.name || t.fullName,
              full_name_english: updates.name || t.full_name_english,
              email: updates.email || t.email,
              phone: updates.phone || t.phone,
              avatar: updates.avatar !== undefined ? updates.avatar : t.avatar,
            };
          }
          return t;
        });
        safeLocalStorageSet('markazu_teachers', next);
        return next;
      });
      setStudents((prev) => {
        const next = prev.map((s) => {
          if (s.id === realTargetId || s.userId === realTargetId || (s.email && s.email.toLowerCase() === realTargetEmail)) {
            return {
              ...s,
              fullName: updates.name || s.fullName,
              email: updates.email || s.email,
              avatar: updates.avatar !== undefined ? updates.avatar : s.avatar,
            };
          }
          return s;
        });
        safeLocalStorageSet('markazu_students', next);
        return next;
      });
      setParents((prev) => {
        const next = prev.map((p) => {
          if (p.id === realTargetId || p.userId === realTargetId || (p.email && p.email.toLowerCase() === realTargetEmail)) {
            return {
              ...p,
              fullName: updates.name || p.fullName,
              email: updates.email || p.email,
              phone: updates.phone || p.phone,
              avatar: updates.avatar !== undefined ? updates.avatar : p.avatar,
            };
          }
          return p;
        });
        safeLocalStorageSet('markazu_parents', next);
        return next;
      });
    }

    notify({
      type: 'success',
      title: 'Account Profile Updated',
      message: `User account details updated successfully. Changes are saved permanently.`,
    });
  };

  const unlockAccount = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    const tempPass = generateTemporaryPassword();
    const tempHash = hashPassword(tempPass);

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              isLocked: false,
              status: 'ACTIVE',
              failedLoginAttempts: 0,
              lockoutUntil: undefined,
              passwordHash: tempHash,
              isFirstLogin: true,
              mustChangePassword: true,
            }
          : u
      )
    );

    if (targetUser) {
      sendSystemEmail({
        to: targetUser.email,
        recipientName: targetUser.name,
        subject: 'MARKAZU UMARU BNIL KHATTAB DANEJI - Account Unlocked & Temporary Credentials',
        template: 'WELCOME_NEW_ACCOUNT',
        metadata: {
          username: targetUser.username || targetUser.email,
          tempPassword: tempPass,
        },
      });

      notify({
        type: 'success',
        title: 'Account Unlocked Successfully',
        message: `Account for ${targetUser.name} unlocked. New temporary password dispatched to ${targetUser.email}.`,
      });
    }

    addAuditLog({
      action: 'ACCOUNT_UNLOCKED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Unlocked user account ID: ${userId} & dispatched temporary credentials`,
      ipAddress: '197.210.227.14',
      affectedRecord: `User/${userId}`,
      status: 'SUCCESS',
    });
  };

  const resetUserPassword = async (userId: string, newPass: string) => {
    const targetUser = users.find((u) => u.id === userId);
    const newHash = hashPassword(newPass);
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, passwordHash: newHash, isFirstLogin: true, mustChangePassword: true } : u));
      safeLocalStorageSet('markazu_users', updated);
      return updated;
    });

    // Persist directly to PostgreSQL database so login with temp password works immediately
    try {
      await fetch(`/api/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetPassword: true,
          newTempPassword: newPass,
        }),
      });
    } catch (apiErr) {
      console.warn('[RESET_PASSWORD] Backend update error:', apiErr);
    }

    if (targetUser) {
      sendSystemEmail({
        to: targetUser.email,
        recipientName: targetUser.name,
        subject: 'Password Reset - Markazu Umar School Management Portal',
        template: 'WELCOME_NEW_ACCOUNT',
        metadata: {
          username: targetUser.username || targetUser.email,
          tempPassword: newPass,
        },
      }).catch(() => {});
    }
    addAuditLog({
      action: 'PASSWORD_RESET_BY_ADMIN',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Reset password for user ID: ${userId} & set mandatory first-login flag`,
      ipAddress: '197.210.227.14',
      affectedRecord: `User/${userId}`,
      status: 'SUCCESS',
    });
  };

  const updateUserPasswordByEmail = (email: string, newPass: string) => {
    const newHash = hashPassword(newPass);
    const cleanEmail = email.toLowerCase().trim();

    const updated = users.map((u) => {
      if (
        u.email.toLowerCase() === cleanEmail ||
        u.username?.toLowerCase() === cleanEmail ||
        (cleanEmail.includes('superadmin') && u.role === 'SUPER_ADMIN') ||
        (cleanEmail.includes('markazu') && u.role === 'SUPER_ADMIN')
      ) {
        return {
          ...u,
          passwordHash: newHash,
          isFirstLogin: false,
          mustChangePassword: false,
          failedLoginAttempts: 0,
          isLocked: false,
        };
      }
      return u;
    });

    setUsers(updated);
    safeLocalStorageSet('markazu_users', updated);

    if (
      currentUser &&
      (currentUser.email.toLowerCase() === cleanEmail ||
        currentUser.username?.toLowerCase() === cleanEmail ||
        (cleanEmail.includes('markazu') && currentUser.role === 'SUPER_ADMIN'))
    ) {
      const updatedCurr = {
        ...currentUser,
        passwordHash: newHash,
        isFirstLogin: false,
        mustChangePassword: false,
        failedLoginAttempts: 0,
        isLocked: false,
      };
      setCurrentUser(updatedCurr);
      safeLocalStorageSet('markazu_current_user', updatedCurr);
    }

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('markazu_user_passwords');
        const pMap: Record<string, string> = saved ? JSON.parse(saved) : {};
        pMap[cleanEmail] = newHash;
        localStorage.setItem('markazu_user_passwords', JSON.stringify(pMap));
      } catch {}
    }
  };

  const terminateSession = (sessionId: string) => {
    revokeSession(sessionId);
    setSessions([...ACTIVE_SESSIONS]);
    addAuditLog({
      action: 'SESSION_TERMINATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Terminated active session ID: ${sessionId}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Session/${sessionId}`,
      status: 'SUCCESS',
    });
  };

  const terminateAllSessions = (userId: string) => {
    revokeAllUserSessions(userId);
    setSessions([...ACTIVE_SESSIONS]);
    addAuditLog({
      action: 'ALL_SESSIONS_TERMINATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Terminated all active device sessions for User ID: ${userId}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `User/${userId}`,
      status: 'SUCCESS',
    });
  };
  const addStudent = async (studentData: Omit<Student, 'id'>, customPassword?: string) => {
    const studentId = `usr-student-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const rawEmail = studentData.email ? studentData.email.trim().toLowerCase() : '';
    const hasEmail = rawEmail.length > 0;

    const newStudent: Student = {
      ...studentData,
      id: studentId,
      email: hasEmail ? rawEmail : undefined,
    };

    setStudents((prev) => {
      const next = [newStudent, ...prev];
      safeLocalStorageSet('markazu_students', next);
      return next;
    });

    const tempPass = customPassword || generateTemporaryPassword();

    // Create User account credentials ONLY if student email was provided
    if (hasEmail) {
      const tempHash = hashPassword(tempPass);
      const newUser: User = {
        id: studentId,
        name: studentData.fullName,
        email: rawEmail,
        role: 'STUDENT',
        passwordHash: tempHash,
        isFirstLogin: true,
        mustChangePassword: true,
        status: 'ACTIVE',
        failedLoginAttempts: 0,
        isLocked: false,
        createdAt: new Date().toISOString(),
      };

      setUsers((prev) => {
        const next = [newUser, ...prev];
        safeLocalStorageSet('markazu_users', next);
        return next;
      });
    }

    // Sync to backend database
    try {
      // 1. Create Student record in DB
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admissionNo: studentData.admissionNo,
          name: studentData.fullName,
          gender: studentData.gender,
          dob: studentData.dob,
          classId: studentData.classId,
          guardianId: studentData.guardianId,
          programmeId: studentData.programmeId,
          email: hasEmail ? rawEmail : undefined,
          tempPassword: hasEmail ? tempPass : undefined,
        }),
      });

      await syncStudentsFromBackend();
    } catch (e) {
      console.warn('[addStudent] backend sync error:', e);
    }

    // Send Welcome Email ONLY if student email was provided
    if (hasEmail) {
      sendSystemEmail({
        to: rawEmail,
        recipientName: studentData.fullName,
        subject: `Welcome to Markazu Umar Portal - Student Account Created (${studentData.admissionNo})`,
        template: 'WELCOME_NEW_ACCOUNT',
        metadata: {
          username: studentData.admissionNo,
          tempPassword: tempPass,
        },
      }).catch((err) => console.warn('[SEND_STUDENT_WELCOME_WARN]', err));
    }

    // Send Welcome Email to Parent if parentEmail was provided
    if (studentData.parentEmail) {
      const cleanParentEmail = studentData.parentEmail.trim().toLowerCase();
      const parentName = studentData.parentName || studentData.guardianName || 'Parent / Guardian';
      const parentTempPass = generateTemporaryPassword();
      const parentTempHash = hashPassword(parentTempPass);

      setUsers((prev) => {
        const existing = prev.find((u) => u.email.toLowerCase() === cleanParentEmail);
        if (!existing) {
          const newParentUser: User = {
            id: studentData.guardianId || `usr-parent-${Date.now()}`,
            name: parentName,
            email: cleanParentEmail,
            role: 'PARENT',
            passwordHash: parentTempHash,
            isFirstLogin: true,
            mustChangePassword: true,
            status: 'ACTIVE',
            failedLoginAttempts: 0,
            isLocked: false,
            createdAt: new Date().toISOString(),
          };
          const next = [newParentUser, ...prev];
          safeLocalStorageSet('markazu_users', next);
          return next;
        }
        return prev;
      });

      sendSystemEmail({
        to: cleanParentEmail,
        recipientName: parentName,
        subject: `Welcome to Markazu Umar Portal - Parent Account Created`,
        template: 'WELCOME_NEW_ACCOUNT',
        metadata: {
          username: cleanParentEmail,
          tempPassword: parentTempPass,
        },
      }).catch((err) => console.warn('[SEND_PARENT_WELCOME_WARN]', err));
    }

    addAuditLog({
      action: 'STUDENT_CREATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Enrolled new student ${studentData.fullName} (${studentData.admissionNo})`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Student/${newStudent.id}`,
      status: 'SUCCESS',
    });
  };

  const updateStudent = async (id: string, updated: Partial<Student>) => {
    // 1. Send authenticated PUT request to backend PostgreSQL API first
    let apiSuccess = false;
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          fullName: updated.fullName,
          admissionNo: updated.admissionNo,
          gender: updated.gender,
          dob: updated.dob,
          classId: updated.classId,
          guardianId: updated.guardianId,
          guardianName: updated.guardianName,
          guardianPhone: updated.guardianPhone,
          email: updated.email !== undefined ? updated.email : undefined,
          status: updated.status,
          // Sync Hifz Progress if updated
          currentJuz: updated.hifzProgress?.currentJuz,
          juzCompleted: updated.hifzProgress?.juzCompleted,
          currentSurah: updated.hifzProgress?.currentSurah,
          currentAyah: updated.hifzProgress?.currentAyah,
          completedSurahsCount: updated.hifzProgress?.completedSurahsCount,
          tajweedRating: updated.hifzProgress?.tajweedRating,
          sabkiRating: updated.hifzProgress?.sabkiRating,
          manzilRating: updated.hifzProgress?.manzilRating,
          akhlaqRating: updated.akhlaqRating,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: Failed to update student`);
      }
      apiSuccess = true;

      // If a student portal account was activated during update, dispatch login credentials
      if (data.userCreated && data.credentials?.email) {
        sendSystemEmail({
          to: data.credentials.email,
          recipientName: updated.fullName || 'Student',
          subject: `Welcome to Markazu Umar Portal - Student Account Activated (${data.credentials.username})`,
          template: 'WELCOME_NEW_ACCOUNT',
          metadata: {
            username: data.credentials.username,
            tempPassword: data.credentials.tempPassword || 'student123',
          },
        });
      }
    } catch (e: any) {
      console.error('[updateStudent] backend sync error:', e);
      throw e;
    }

    if (apiSuccess) {
      setStudents((prev) => {
        const next = prev.map((s) => {
          if (s.id === id) {
            const newName = updated.fullName || s.fullName;
            const newEmail = updated.email || s.email;
            const newAvatar = updated.avatar !== undefined ? updated.avatar : s.avatar;

            setUsers((uPrev) => {
              const uNext = uPrev.map((u) => {
                if (u.id === id || u.id === s.userId || (s.admissionNo && u.username === s.admissionNo)) {
                  return {
                    ...u,
                    name: newName,
                    email: newEmail || u.email,
                    avatar: newAvatar,
                  };
                }
                return u;
              });
              safeLocalStorageSet('markazu_users', uNext);
              return uNext;
            });

            if (currentUser && (currentUser.id === id || currentUser.id === s.userId || (s.admissionNo && currentUser.username === s.admissionNo))) {
              const updatedCurr = {
                ...currentUser,
                name: newName,
                email: newEmail || currentUser.email,
                avatar: newAvatar,
              };
              setCurrentUser(updatedCurr);
              safeLocalStorageSet('markazu_current_user', updatedCurr);
            }

            return { ...s, ...updated, avatar: newAvatar };
          }
          return s;
        });
        safeLocalStorageSet('markazu_students', next);
        return next;
      });

      // Synchronize parent state in context if guardian details changed
      if (updated.guardianPhone || updated.guardianName) {
        setParents((pPrev) => {
          const pNext = pPrev.map((p) => {
            const targetStudent = students.find((st) => st.id === id);
            if ((targetStudent && p.id === targetStudent.guardianId) || (updated.guardianId && p.id === updated.guardianId)) {
              return {
                ...p,
                phone: updated.guardianPhone || p.phone,
                fullName: updated.guardianName || p.fullName,
              };
            }
            return p;
          });
          safeLocalStorageSet('markazu_parents', pNext);
          return pNext;
        });
      }

      addAuditLog({
        action: 'STUDENT_UPDATED',
        performedBy: currentUser.name,
        userRole: currentUser.role,
        details: `Updated details for student ID: ${id}`,
        ipAddress: '197.210.227.14',
        affectedRecord: `Student/${id}`,
        status: 'SUCCESS',
      });
    }
  };
  const deleteStudent = async (id: string) => {
    const targetStudent = students.find((s) => s.id === id);
    const updatedStudents = students.filter((s) => s.id !== id);
    setStudents(updatedStudents);
    safeLocalStorageSet('markazu_students', updatedStudents);

    if (targetStudent) {
      const targetUserId = targetStudent.userId || targetStudent.id;
      const targetEmail = targetStudent.email?.toLowerCase().trim();
      const targetAdmNo = targetStudent.admissionNo?.toLowerCase().trim();

      recordDeletedUserIdentifier(id, targetEmail, targetAdmNo);
      recordDeletedUserIdentifier(targetUserId, targetEmail, targetAdmNo);

      const updatedUsers = users.filter(
        (u) => u.id !== targetUserId && u.id !== id && (targetEmail ? u.email.toLowerCase().trim() !== targetEmail : true) && (targetAdmNo ? u.username?.toLowerCase().trim() !== targetAdmNo : true)
      );
      setUsers(updatedUsers);
      safeLocalStorageSet('markazu_users', updatedUsers);
    }

    // Sync to backend database
    try {
      await fetch(`/api/students/${id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('[deleteStudent] backend sync error:', e);
    }

    notify({
      type: 'warning',
      title: 'Student Account Deleted',
      message: `Student record and user login credentials for ${targetStudent?.fullName || id} have been deleted.`,
    });
    addAuditLog({
      action: 'STUDENT_DELETED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Deleted student record & login account ID: ${id}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Student/${id}`,
      status: 'WARNING',
    });
  };

  const addTeacher = async (teacherData: Omit<Teacher, 'id'>, customPassword?: string) => {
    const englishName = teacherData.full_name_english || teacherData.fullName;
    const arabicName = teacherData.full_name_arabic || '';
    const teacherId = `usr-teacher-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const newTeacher: Teacher = {
      ...teacherData,
      id: teacherId,
      full_name_english: englishName,
      full_name_arabic: arabicName,
      fullName: englishName,
    };

    setTeachers((prev) => {
      const next = [newTeacher, ...prev];
      safeLocalStorageSet('markazu_teachers', next);
      return next;
    });

    // Create User account credentials with Staff ID as username
    const tempPass = customPassword || generateTemporaryPassword();
    const tempHash = hashPassword(tempPass);
    const newUser: User = {
      id: teacherId,
      name: englishName,
      email: teacherData.email,
      username: teacherData.staffNo,
      role: 'TEACHER',
      passwordHash: tempHash,
      isFirstLogin: true,
      mustChangePassword: true,
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      isLocked: false,
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => {
      const next = [newUser, ...prev];
      safeLocalStorageSet('markazu_users', next);
      return next;
    });

    // Auto-create TeacherAssignment records for relational dashboard queries
    if (newTeacher.programmeIds && newTeacher.classesAssigned) {
      const createdAssignments: TeacherAssignment[] = [];
      newTeacher.programmeIds.forEach((pId) => {
        newTeacher.classesAssigned.forEach((cId) => {
          createdAssignments.push({
            id: `ta-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            teacherId: teacherId,
            programmeId: pId,
            classId: cId,
            subjectIds: newTeacher.subjectsAssigned || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        });
      });
      if (createdAssignments.length > 0) {
        setTeacherAssignments((prev) => {
          const next = [...createdAssignments, ...prev];
          safeLocalStorageSet('markazu_teacher_assignments', next);
          return next;
        });
      }
    }

    // Sync to backend database
    try {
      // 1. Create Teacher record in DB
      await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffNo: teacherData.staffNo,
          fullName: englishName,
          email: teacherData.email,
          phone: teacherData.phone,
          qualification: teacherData.qualification,
          specialization: teacherData.specialization,
          status: teacherData.status,
          dateJoined: teacherData.dateJoined,
          userId: teacherId,
          classesAssigned: teacherData.classesAssigned,
          programmeIds: teacherData.programmeIds,
        }),
      });

      // 2. Create corresponding User Credentials in DB
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: teacherData.staffNo,
          name: englishName,
          email: teacherData.email,
          role: 'TEACHER',
          tempPassword: tempPass,
        }),
      });
      await syncTeachersFromBackend();
    } catch (e) {
      console.warn('[addTeacher] backend sync error:', e);
    }

    // Send Welcome Email
    sendSystemEmail({
      to: teacherData.email,
      recipientName: englishName,
      subject: 'Welcome to Markazu Umar Portal - Teacher Account Created',
      template: 'WELCOME_NEW_ACCOUNT',
      metadata: {
        username: teacherData.staffNo,
        tempPassword: tempPass,
      },
    });

    addAuditLog({
      action: 'TEACHER_CREATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Added new faculty member ${newTeacher.full_name_english} (Username: ${newTeacher.staffNo})`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Teacher/${newTeacher.id}`,
      status: 'SUCCESS',
    });
  };

  const updateTeacher = async (id: string, updated: Partial<Teacher>) => {
    setTeachers((prev) => {
      const next = prev.map((t) => {
        if (t.id === id) {
          const englishName = updated.full_name_english || updated.fullName || t.full_name_english || t.fullName;
          const arabicName = updated.full_name_arabic !== undefined ? updated.full_name_arabic : t.full_name_arabic;
          const newAvatar = updated.avatar !== undefined ? updated.avatar : t.avatar;
          const newEmail = updated.email !== undefined ? updated.email : t.email;

          setUsers((uPrev) => {
            const uNext = uPrev.map((u) => {
              if (u.id === id || (t.email && u.email.toLowerCase() === t.email.toLowerCase()) || (t.staffNo && u.username === t.staffNo)) {
                return {
                  ...u,
                  name: englishName,
                  email: newEmail,
                  avatar: newAvatar,
                };
              }
              return u;
            });
            safeLocalStorageSet('markazu_users', uNext);
            return uNext;
          });

          if (currentUser && (currentUser.id === id || (t.email && currentUser.email.toLowerCase() === t.email.toLowerCase()) || (t.staffNo && currentUser.username === t.staffNo))) {
            const updatedCurr = {
              ...currentUser,
              name: englishName,
              email: newEmail,
              avatar: newAvatar,
            };
            setCurrentUser(updatedCurr);
            safeLocalStorageSet('markazu_current_user', updatedCurr);
          }

          return {
            ...t,
            ...updated,
            full_name_english: englishName,
            full_name_arabic: arabicName,
            fullName: englishName,
            avatar: newAvatar,
          };
        }
        return t;
      });
      safeLocalStorageSet('markazu_teachers', next);
      return next;
    });

    // Sync to backend database
    try {
      await fetch(`/api/teachers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: updated.fullName || updated.full_name_english,
          staffNo: updated.staffNo,
          email: updated.email,
          phone: updated.phone,
          qualification: updated.qualification,
          specialization: updated.specialization,
          status: updated.status,
          dateJoined: updated.dateJoined,
          classesAssigned: updated.classesAssigned,
          programmeIds: updated.programmeIds,
        }),
      });
      await syncTeachersFromBackend();
    } catch (e) {
      console.warn('[updateTeacher] backend sync error:', e);
    }

    addAuditLog({
      action: 'TEACHER_UPDATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Updated faculty member details for ID: ${id}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Teacher/${id}`,
      status: 'SUCCESS',
    });
  };

  const deleteTeacher = async (id: string) => {
    const targetTeacher = teachers.find((t) => t.id === id);
    const updatedTeachers = teachers.filter((t) => t.id !== id);
    setTeachers(updatedTeachers);
    safeLocalStorageSet('markazu_teachers', updatedTeachers);

    if (targetTeacher) {
      const targetUserId = targetTeacher.userId || targetTeacher.id;
      const targetEmail = targetTeacher.email?.toLowerCase().trim();
      const targetStaffNo = targetTeacher.staffNo?.toLowerCase().trim();

      recordDeletedUserIdentifier(id, targetEmail, targetStaffNo);
      recordDeletedUserIdentifier(targetUserId, targetEmail, targetStaffNo);

      const updatedUsers = users.filter(
        (u) => u.id !== targetUserId && u.id !== id && (targetEmail ? u.email.toLowerCase().trim() !== targetEmail : true) && (targetStaffNo ? u.username?.toLowerCase().trim() !== targetStaffNo : true)
      );
      setUsers(updatedUsers);
      safeLocalStorageSet('markazu_users', updatedUsers);
    }

    // Sync to backend database
    try {
      await fetch(`/api/teachers/${id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('[deleteTeacher] backend sync error:', e);
    }

    notify({
      type: 'warning',
      title: 'Teacher Profile Deleted Permanently',
      message: `Teacher profile and login credentials for ${targetTeacher?.fullName || id} have been permanently deleted.`,
    });
    addAuditLog({
      action: 'TEACHER_DELETED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Permanently deleted teacher record & login account ID: ${id}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Teacher/${id}`,
      status: 'WARNING',
    });
  };

  const addSubject = async (subjectData: Omit<Subject, 'id'>) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: subjectData.name,
          arabicName: subjectData.arabicName,
          code: subjectData.code,
          category: subjectData.category,
          description: subjectData.description,
          programmeId: subjectData.programmeId,
          classId: subjectData.classId,
          status: subjectData.status,
          displayOrder: subjectData.displayOrder,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to save subject to database.');
      }

      const createdSubject: Subject = {
        id: data.subject?.id || `subj-${Date.now()}`,
        name: data.subject?.name || subjectData.name,
        nameEnglish: data.subject?.name || subjectData.name,
        arabicName: data.subject?.arabicName || subjectData.arabicName,
        code: data.subject?.code || subjectData.code,
        category: data.subject?.category || subjectData.category,
        description: data.subject?.description || subjectData.description,
        programmeId: data.subject?.programmeId || subjectData.programmeId,
        classId: data.subject?.classId || subjectData.classId,
        status: data.subject?.status || subjectData.status,
        displayOrder: data.subject?.displayOrder || subjectData.displayOrder,
      };

      setSubjects((prev) => {
        const next = [...prev, createdSubject];
        safeLocalStorageSet('markazu_subjects', next);
        return next;
      });

      notify({
        type: 'success',
        title: 'Subject Saved',
        message: `Subject "${createdSubject.name}" (${createdSubject.code}) saved successfully to database.`,
      });

      addAuditLog({
        action: 'SUBJECT_ADDED',
        performedBy: currentUser.name,
        userRole: currentUser.role,
        details: `Added new subject ${createdSubject.name} (${createdSubject.code})`,
        ipAddress: '197.210.227.14',
        affectedRecord: `Subject/${createdSubject.id}`,
        status: 'SUCCESS',
      });
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Subject Persistence Failed',
        message: err.message || 'Could not save subject to database.',
      });
      throw err;
    }
  };

  const updateSubject = async (id: string, updated: Partial<Subject>) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/subjects/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to update subject in database.');
      }

      setSubjects((prev) => {
        const next = prev.map((s) => (s.id === id ? { ...s, ...updated } : s));
        safeLocalStorageSet('markazu_subjects', next);
        return next;
      });

      notify({
        type: 'success',
        title: 'Subject Updated',
        message: `Subject "${updated.name || id}" updated successfully.`,
      });

      addAuditLog({
        action: 'SUBJECT_ADDED',
        performedBy: currentUser.name,
        userRole: currentUser.role,
        details: `Updated subject details ID: ${id}`,
        ipAddress: '197.210.227.14',
        affectedRecord: `Subject/${id}`,
        status: 'SUCCESS',
      });
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Subject Update Failed',
        message: err.message || 'Could not update subject in database.',
      });
      throw err;
    }
  };

  const deleteSubject = async (id: string) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/subjects/${id}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to delete subject from database.');
      }

      setSubjects((prev) => {
        const next = prev.filter((s) => s.id !== id);
        safeLocalStorageSet('markazu_subjects', next);
        return next;
      });

      notify({
        type: 'info',
        title: 'Subject Deleted',
        message: `Subject ID ${id} removed successfully from database.`,
      });

      addAuditLog({
        action: 'SUBJECT_REMOVED',
        performedBy: currentUser.name,
        userRole: currentUser.role,
        details: `Removed subject ID: ${id}`,
        ipAddress: '197.210.227.14',
        affectedRecord: `Subject/${id}`,
        status: 'WARNING',
      });
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Subject Deletion Failed',
        message: err.message || 'Could not delete subject from database.',
      });
      throw err;
    }
  };

  const assignTeacher = (assignmentData: Omit<TeacherAssignment, 'id'>) => {
    const newAssignment: TeacherAssignment = {
      ...assignmentData,
      id: `ta-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTeacherAssignments((prev) => [...prev, newAssignment]);
    addAuditLog({
      action: 'TEACHER_ASSIGNED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Assigned teacher ${assignmentData.teacherId} to programme ${assignmentData.programmeId} & class ${assignmentData.classId} (${assignmentData.subjectIds.length} subjects)`,
      ipAddress: '197.210.227.14',
      affectedRecord: `TeacherAssignment/${newAssignment.id}`,
      status: 'SUCCESS',
    });
  };

  const removeTeacherAssignment = (id: string) => {
    setTeacherAssignments((prev) => prev.filter((ta) => ta.id !== id));
    addAuditLog({
      action: 'TEACHER_REMOVED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Removed teacher assignment ID: ${id}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `TeacherAssignment/${id}`,
      status: 'WARNING',
    });
  };

  const addParent = async (parentData: Omit<Parent, 'id'> & { id?: string }, customPassword?: string) => {
    const parentId = parentData.id || `usr-parent-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const newParent: Parent = {
      ...parentData,
      id: parentId,
    };

    setParents((prev) => [newParent, ...prev]);

    // Create User account credentials
    const tempPass = customPassword || generateTemporaryPassword();
    const tempHash = hashPassword(tempPass);
    const newUser: User = {
      id: parentId,
      name: parentData.fullName,
      email: parentData.email,
      role: 'PARENT',
      passwordHash: tempHash,
      isFirstLogin: true,
      mustChangePassword: true,
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      isLocked: false,
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => {
      const next = [newUser, ...prev];
      safeLocalStorageSet('markazu_users', next);
      return next;
    });

    // Sync to backend database
    try {
      const headers = getAuthHeaders();
      await fetch('/api/parents', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: parentId,
          fullName: parentData.fullName,
          email: parentData.email,
          phone: parentData.phone,
          occupation: parentData.occupation,
          address: parentData.address,
          tempPassword: tempPass,
          passwordHash: tempHash,
        }),
      });
      syncParentsFromBackend();
    } catch (e) {
      console.warn('[addParent] backend sync error:', e);
    }

    // Send Welcome Email
    sendSystemEmail({
      to: parentData.email,
      recipientName: parentData.fullName,
      subject: 'Welcome to Markazu Umar Portal - Parent Account Created',
      template: 'WELCOME_NEW_ACCOUNT',
      metadata: {
        username: parentData.email,
        tempPassword: tempPass,
      },
    });

    addAuditLog({
      action: 'PARENT_CREATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Registered parent/guardian profile for ${parentData.fullName} (${parentData.email})`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Parent/${newParent.id}`,
      status: 'SUCCESS',
    });
  };

  const updateParent = (id: string, updated: Partial<Parent>) => {
    setParents((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newName = updated.fullName || p.fullName;
          const newEmail = updated.email || p.email;
          const newAvatar = updated.avatar !== undefined ? updated.avatar : p.avatar;

          setUsers((uPrev) =>
            uPrev.map((u) => {
              if (u.id === id || u.id === p.userId || (p.email && u.email.toLowerCase() === p.email.toLowerCase())) {
                return {
                  ...u,
                  name: newName,
                  email: newEmail,
                  avatar: newAvatar,
                };
              }
              return u;
            })
          );

          if (currentUser && (currentUser.id === id || currentUser.id === p.userId || (p.email && currentUser.email.toLowerCase() === p.email.toLowerCase()))) {
            setCurrentUser((cPrev) => ({
              ...cPrev,
              name: newName,
              email: newEmail,
              avatar: newAvatar,
            }));
          }

          return { ...p, ...updated, avatar: newAvatar };
        }
        return p;
      })
    );
    addAuditLog({
      action: 'PARENT_UPDATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Updated parent/guardian profile ID: ${id}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Parent/${id}`,
      status: 'SUCCESS',
    });
  };

  const deleteParent = (id: string) => {
    const targetParent = parents.find((p) => p.id === id);
    const updatedParents = parents.filter((p) => p.id !== id);
    setParents(updatedParents);
    safeLocalStorageSet('markazu_parents', updatedParents);

    if (targetParent) {
      const targetUserId = targetParent.userId || targetParent.id;
      const targetEmail = targetParent.email.toLowerCase().trim();

      recordDeletedUserIdentifier(id, targetEmail);
      recordDeletedUserIdentifier(targetUserId, targetEmail);

      const updatedUsers = users.filter((u) => u.id !== targetUserId && u.id !== id && u.email.toLowerCase().trim() !== targetEmail);
      setUsers(updatedUsers);
      safeLocalStorageSet('markazu_users', updatedUsers);
    }

    notify({
      type: 'warning',
      title: 'Parent/Guardian Profile Deleted Permanently',
      message: `Parent profile and login credentials for ${targetParent?.fullName || id} have been permanently deleted.`,
    });
    addAuditLog({
      action: 'PARENT_DELETED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Permanently deleted parent profile & login account ID: ${id}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Parent/${id}`,
      status: 'WARNING',
    });
  };

  const bulkImportTeachers = (teachersData: Omit<Teacher, 'id'>[]): { successCount: number } => {
    let count = 0;
    teachersData.forEach((tData) => {
      addTeacher(tData);
      count++;
    });
    return { successCount: count };
  };

  const bulkImportStudents = (
    studentsData: (Omit<Student, 'id'> & { parentName?: string; parentPhone?: string; parentEmail?: string })[]
  ): { successCount: number; linkedParentsCount: number; duplicatesPreventedCount: number } => {
    let successCount = 0;
    let linkedParentsCount = 0;
    let duplicatesPreventedCount = 0;

    const parentMap = new Map<string, string>(); // email/phone -> parentId

    studentsData.forEach((sData) => {
      let resolvedGuardianId = sData.guardianId;
      const pEmail = sData.parentEmail ? sData.parentEmail.toLowerCase().trim() : null;
      const pPhone = sData.parentPhone ? sData.parentPhone.trim() : null;
      const key = pEmail || pPhone;

      if (key && parentMap.has(key)) {
        resolvedGuardianId = parentMap.get(key)!;
        duplicatesPreventedCount++;
      } else {
        const existingP = parents.find(
          (p) => (pEmail && p.email.toLowerCase() === pEmail) || (pPhone && p.phone === pPhone)
        );
        if (existingP) {
          resolvedGuardianId = existingP.id;
          if (key) parentMap.set(key, existingP.id);
          duplicatesPreventedCount++;
        } else if (sData.parentName && (pEmail || pPhone)) {
          const newParentId = `usr-parent-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
          addParent({
            id: newParentId,
            fullName: sData.parentName,
            email: pEmail || `parent.${Date.now()}@markazuumar.edu.ng`,
            phone: pPhone || '08000000000',
            occupation: 'Parent',
            address: 'Kano, Nigeria',
          });
          resolvedGuardianId = newParentId;
          if (key) parentMap.set(key, newParentId);
          linkedParentsCount++;
        }
      }

      addStudent({
        ...sData,
        guardianId: resolvedGuardianId || sData.guardianId,
      });
      successCount++;
    });

    return { successCount, linkedParentsCount, duplicatesPreventedCount };
  };

  const bulkImportParents = (
    parentsData: (Omit<Parent, 'id'> & { id?: string; linkedChildrenStr?: string })[]
  ): { successCount: number } => {
    let count = 0;
    parentsData.forEach((pData) => {
      let activeParentId = pData.id;
      const existingParent = parents.find(
        (p) => (activeParentId && p.id === activeParentId) || p.email.toLowerCase() === pData.email.toLowerCase()
      );

      if (existingParent) {
        activeParentId = existingParent.id;
        updateParent(existingParent.id, {
          fullName: pData.fullName,
          phone: pData.phone,
          email: pData.email,
          occupation: pData.occupation || existingParent.occupation,
          address: pData.address || existingParent.address,
        });
      } else {
        const generatedId = activeParentId || `usr-parent-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
        activeParentId = generatedId;
        addParent({
          ...pData,
          id: generatedId,
        });
      }

      // Automatically Link Children if specified
      if (pData.linkedChildrenStr) {
        const childItems = pData.linkedChildrenStr
          .split(/;|\|/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        const newlyLinkedWardIds: string[] = [];

        childItems.forEach((item) => {
          const matchedStudent = students.find(
            (s) =>
              s.admissionNo.toLowerCase() === item.toLowerCase() ||
              s.id.toLowerCase() === item.toLowerCase() ||
              s.fullName.toLowerCase() === item.toLowerCase()
          );
          if (matchedStudent) {
            newlyLinkedWardIds.push(matchedStudent.id);
            updateStudent(matchedStudent.id, {
              guardianId: activeParentId,
              guardianName: pData.fullName,
              guardianPhone: pData.phone,
            });
          }
        });

        if (newlyLinkedWardIds.length > 0) {
          setParents((prev) =>
            prev.map((p) => {
              if (p.id === activeParentId) {
                const combinedWards = Array.from(new Set([...(p.wardIds || []), ...newlyLinkedWardIds]));
                return {
                  ...p,
                  wardIds: combinedWards,
                  wardsCount: combinedWards.length,
                };
              }
              return p;
            })
          );
        }
      }

      count++;
    });
    return { successCount: count };
  };

  const addTahfizRecord = (recordData: Omit<TahfizRecord, 'id'>) => {
    const newRecord: TahfizRecord = {
      ...recordData,
      id: `tahfiz-log-${Date.now()}`,
    };
    setTahfizRecords((prev) => [newRecord, ...prev]);

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === recordData.studentId) {
          return {
            ...s,
            hifzProgress: {
              ...s.hifzProgress,
              currentSurah: recordData.hifzSurah,
              currentAyah: recordData.hifzToAyah,
              sabkiRating: recordData.sabkiRating,
              manzilRating: recordData.manzilRating,
              tajweedRating: Math.max(1, 5 - Math.floor((recordData.tajweedErrorsCount ?? 0) / 2)),
            },
          };
        }
        return s;
      })
    );

    addAuditLog({
      action: 'TAHFIZ_ENTRY_ADDED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Added Tahfiz log for ${recordData.studentName}: Surah ${recordData.hifzSurah}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `TahfizRecord/${newRecord.id}`,
      status: 'SUCCESS',
    });
  };

  const markAttendance = (newRecords: Omit<AttendanceRecord, 'id'>[]) => {
    const formattedRecords: AttendanceRecord[] = newRecords.map((r, i) => ({
      ...r,
      id: `att-${Date.now()}-${i}`,
    }));

    setAttendance((prev) => {
      const datesToReplace = new Set(formattedRecords.map((r) => `${r.date}-${r.studentId}`));
      const filtered = prev.filter((r) => !datesToReplace.has(`${r.date}-${r.studentId}`));
      return [...formattedRecords, ...filtered];
    });

    addAuditLog({
      action: 'ATTENDANCE_RECORDED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Recorded attendance batch for ${newRecords.length} students`,
      ipAddress: '197.210.227.14',
      status: 'SUCCESS',
    });
  };

  const addGradeRecord = (gradeData: Omit<GradeRecord, 'id'>) => {
    const newGrade: GradeRecord = {
      ...gradeData,
      id: `grd-${Date.now()}`,
    };

    setGrades((prev) => {
      const existingIdx = prev.findIndex(
        (g) =>
          g.studentId === gradeData.studentId &&
          g.subjectId === gradeData.subjectId &&
          g.term === gradeData.term
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = newGrade;
        return copy;
      }
      return [newGrade, ...prev];
    });

    addAuditLog({
      action: 'GRADE_RECORDED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Recorded grade for ${gradeData.studentName}: Score ${gradeData.totalScore}% (${gradeData.grade})`,
      ipAddress: '197.210.227.14',
      affectedRecord: `GradeRecord/${newGrade.id}`,
      status: 'SUCCESS',
    });
  };

  const addAnnouncement = (annData: Omit<Announcement, 'id'>) => {
    const newAnn: Announcement = {
      ...annData,
      id: `ann-${Date.now()}`,
    };
    setAnnouncements((prev) => [newAnn, ...prev]);

    // Sync to backend database
    try {
      fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnn),
      }).catch((err) => console.warn('[addAnnouncement] API sync warning:', err));
    } catch (e) {
      console.warn('[addAnnouncement] API error:', e);
    }

    addAuditLog({
      action: 'ANNOUNCEMENT_PUBLISHED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Published announcement: "${annData.title}" for target ${annData.targetRole}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Announcement/${newAnn.id}`,
      status: 'SUCCESS',
    });
  };

  // ENTERPRISE COMMUNICATION CENTER HANDLERS
  const createCommunication = async (
    commData: Omit<CommunicationMessage, 'id' | 'createdAt' | 'stats' | 'status'>,
    scheduleTime?: string
  ): Promise<CommunicationMessage> => {
    const isScheduled = !!scheduleTime;
    const commId = `comm-${Date.now()}`;

    // Determine Recipients Count & Contacts
    let targetRecipients: { id: string; name: string; contact: string; role: string; email: string; phone: string }[] = [];

    if (commData.recipientType === 'ENTIRE_SCHOOL') {
      users.forEach((u) => {
        targetRecipients.push({ id: u.id, name: u.name, contact: u.email, role: u.role, email: u.email, phone: u.phone || '+234 803 000 0000' });
      });
    } else if (commData.recipientType === 'TEACHERS') {
      teachers.forEach((t) => {
        targetRecipients.push({ id: t.id, name: t.full_name_english || t.fullName, contact: t.email, role: 'TEACHER', email: t.email, phone: t.phone });
      });
    } else if (commData.recipientType === 'PARENTS') {
      parents.forEach((p) => {
        targetRecipients.push({ id: p.id, name: p.fullName, contact: p.email, role: 'PARENT', email: p.email, phone: p.phone });
      });
    } else if (commData.recipientType === 'STUDENTS') {
      students.forEach((s) => {
        targetRecipients.push({ id: s.id, name: s.fullName, contact: `${s.admissionNo.toLowerCase()}@student.markazu.edu.ng`, role: 'STUDENT', email: `${s.admissionNo.toLowerCase()}@student.markazu.edu.ng`, phone: s.guardianPhone });
      });
    } else if (commData.recipientType === 'PROGRAMME' && commData.programmeId) {
      const progStudents = students.filter((s) => s.programmeId === commData.programmeId);
      progStudents.forEach((s) => {
        targetRecipients.push({ id: s.id, name: s.fullName, contact: `${s.admissionNo.toLowerCase()}@student.markazu.edu.ng`, role: 'STUDENT', email: `${s.admissionNo.toLowerCase()}@student.markazu.edu.ng`, phone: s.guardianPhone });
      });
    } else if (commData.recipientType === 'CLASS' && commData.classId) {
      const clsStudents = students.filter((s) => s.classId === commData.classId);
      clsStudents.forEach((s) => {
        targetRecipients.push({ id: s.id, name: s.fullName, contact: `${s.admissionNo.toLowerCase()}@student.markazu.edu.ng`, role: 'STUDENT', email: `${s.admissionNo.toLowerCase()}@student.markazu.edu.ng`, phone: s.guardianPhone });
      });
    } else {
      users.slice(0, 10).forEach((u) => {
        targetRecipients.push({ id: u.id, name: u.name, contact: u.email, role: u.role, email: u.email, phone: u.phone || '+234 803 000 0000' });
      });
    }

    const emailCount = commData.channels.includes('EMAIL') ? targetRecipients.length : 0;
    const whatsappCount = commData.channels.includes('WHATSAPP') ? targetRecipients.length : 0;
    const notificationCount = commData.channels.includes('IN_APP') ? targetRecipients.length : 0;
    const dashboardCount = commData.channels.includes('DASHBOARD') ? targetRecipients.length : 0;

    const newComm: CommunicationMessage = {
      ...commData,
      id: commId,
      status: isScheduled ? 'SCHEDULED' : 'SENT',
      scheduledFor: scheduleTime,
      sentAt: isScheduled ? undefined : new Date().toISOString(),
      createdAt: new Date().toISOString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      stats: {
        totalRecipients: targetRecipients.length,
        emailCount,
        whatsappCount,
        notificationCount,
        dashboardCount,
        deliveredCount: targetRecipients.length,
        failedCount: 0,
        readCount: Math.floor(targetRecipients.length * 0.8),
      },
    };

    setCommunications((prev) => [newComm, ...prev]);

    // Build Queue Items
    const newQueueItems: QueueItem[] = [];
    commData.channels.forEach((ch) => {
      targetRecipients.forEach((rec, idx) => {
        newQueueItems.push({
          id: `q-${Date.now()}-${ch}-${idx}`,
          messageId: commId,
          messageTitle: commData.title,
          channel: ch,
          recipientId: rec.id,
          recipientName: rec.name,
          recipientContact: ch === 'WHATSAPP' ? rec.phone : rec.contact,
          recipientRole: rec.role,
          status: isScheduled ? 'QUEUED' : 'COMPLETED',
          attempts: 1,
          maxAttempts: 3,
          queuedAt: new Date().toISOString(),
          processedAt: isScheduled ? undefined : new Date().toISOString(),
        });
      });
    });
    setDeliveryQueue((prev) => [...newQueueItems, ...prev]);

    // Generate Personal In-App Notifications
    if (commData.channels.includes('IN_APP') && !isScheduled) {
      const newNotifications: InAppNotification[] = targetRecipients.map((rec) => ({
        id: `notif-${Date.now()}-${rec.id}`,
        userId: rec.id,
        messageId: commId,
        title: commData.title,
        body: commData.subject,
        priority: commData.priority,
        category: commData.type,
        channels: commData.channels,
        senderName: currentUser.name,
        read: false,
        pinned: commData.priority === 'URGENT',
        isArchived: false,
        createdAt: new Date().toISOString(),
        attachments: commData.attachments,
      }));
      setInAppNotifications((prev) => [...newNotifications, ...prev]);
    }

    addAuditLog({
      action: isScheduled ? 'COMMUNICATION_SCHEDULED' : 'COMMUNICATION_SENT',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `${isScheduled ? 'Scheduled' : 'Sent'} Communication: "${commData.title}" via ${commData.channels.join(', ')} to ${targetRecipients.length} recipients`,
      ipAddress: '197.210.227.14',
      affectedRecord: `CommunicationMessage/${commId}`,
      status: 'SUCCESS',
    });

    return newComm;
  };

  const testSendCommunication = async (comm: Partial<CommunicationMessage>, channel: string): Promise<void> => {
    addAuditLog({
      action: 'COMMUNICATION_TEST_SENT',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Dispatched test message for "${comm.title || 'Untitled'}" via ${channel} to Administrator ${currentUser.email}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `TestSend/${channel}`,
      status: 'SUCCESS',
    });
  };

  const retryFailedDelivery = (queueItemId: string) => {
    setDeliveryQueue((prev) =>
      prev.map((q) => (q.id === queueItemId ? { ...q, status: 'COMPLETED', errorTrace: undefined, processedAt: new Date().toISOString() } : q))
    );
    addAuditLog({
      action: 'DELIVERY_RETRIED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Retried delivery task ID: ${queueItemId}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `QueueItem/${queueItemId}`,
      status: 'SUCCESS',
    });
  };

  const retryAllFailedDeliveries = (messageId?: string) => {
    setDeliveryQueue((prev) =>
      prev.map((q) => {
        if (q.status === 'FAILED' && (!messageId || q.messageId === messageId)) {
          return { ...q, status: 'COMPLETED', errorTrace: undefined, processedAt: new Date().toISOString() };
        }
        return q;
      })
    );
    addAuditLog({
      action: 'BULK_DELIVERY_RETRIED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Retried all failed delivery queue tasks${messageId ? ` for message ${messageId}` : ''}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `QueueBulkRetry`,
      status: 'SUCCESS',
    });
  };

  // Message Template CRUD
  const createTemplate = (tmplData: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTmpl: MessageTemplate = {
      ...tmplData,
      id: `tmpl-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMessageTemplates((prev) => [newTmpl, ...prev]);
    addAuditLog({
      action: 'TEMPLATE_CREATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Created message template: "${tmplData.title}"`,
      ipAddress: '197.210.227.14',
      affectedRecord: `MessageTemplate/${newTmpl.id}`,
      status: 'SUCCESS',
    });
  };

  const updateTemplate = (id: string, updated: Partial<MessageTemplate>) => {
    setMessageTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updated, updatedAt: new Date().toISOString() } : t))
    );
    addAuditLog({
      action: 'TEMPLATE_UPDATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Updated message template ID: ${id}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `MessageTemplate/${id}`,
      status: 'SUCCESS',
    });
  };

  const deleteTemplate = (id: string) => {
    setMessageTemplates((prev) => prev.filter((t) => t.id !== id));
    addAuditLog({
      action: 'TEMPLATE_DELETED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Deleted message template ID: ${id}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `MessageTemplate/${id}`,
      status: 'SUCCESS',
    });
  };

  const duplicateTemplate = (id: string) => {
    const target = messageTemplates.find((t) => t.id === id);
    if (!target) return;
    const dup: MessageTemplate = {
      ...target,
      id: `tmpl-${Date.now()}`,
      title: `${target.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMessageTemplates((prev) => [dup, ...prev]);
    addAuditLog({
      action: 'TEMPLATE_DUPLICATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Duplicated template: "${target.title}"`,
      ipAddress: '197.210.227.14',
      affectedRecord: `MessageTemplate/${dup.id}`,
      status: 'SUCCESS',
    });
  };

  // In-App Personal Notification Handlers
  const markNotificationAsRead = (id: string) => {
    setInAppNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setInAppNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() }))
    );
  };

  const pinNotification = (id: string) => {
    setInAppNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
    );
  };

  const archiveNotification = (id: string) => {
    setInAppNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isArchived: !n.isArchived } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setInAppNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // SMART PARENT GROUPING REPORT SHEET PUBLICATION
  const publishReportSheetsBatch = async (
    sessionId: string,
    term: string,
    programmeId: string,
    classId: string,
    channels: string[]
  ): Promise<{ successCount: number; parentGroupsCount: number }> => {
    const classStudents = students.filter(
      (s) => (!programmeId || s.programmeId === programmeId) && (!classId || s.classId === classId)
    );

    // Apply Smart Parent Grouping Engine
    const parentGroups = NotificationService.groupParentsWithMultipleWards(classStudents, parents);

    const commId = `comm-reports-${Date.now()}`;
    const newComm: CommunicationMessage = {
      id: commId,
      title: `Official Report Sheet Delivery - ${term} (${sessionId})`,
      type: 'REPORT_SHEET',
      priority: 'URGENT',
      channels: channels as any,
      recipientType: 'PARENTS',
      programmeId,
      classId,
      subject: `Official Progress Report Cards Dispatch - ${term}`,
      content: `Assalamu Alaikum. Official Terminal Report Cards for ${classStudents.length} students have been compiled, verified, and delivered to ${parentGroups.length} parent contact accounts.`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      status: 'SENT',
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      attachments: [
        {
          id: `att-reports-batch`,
          name: `Batch_Report_Cards_${classId || 'All'}_${term}.pdf`,
          size: '4.2 MB',
          type: 'PDF',
          url: '#',
        },
      ],
      stats: {
        totalRecipients: parentGroups.length,
        emailCount: channels.includes('EMAIL') ? parentGroups.length : 0,
        whatsappCount: channels.includes('WHATSAPP') ? parentGroups.length : 0,
        notificationCount: channels.includes('IN_APP') ? parentGroups.length : 0,
        dashboardCount: 0,
        deliveredCount: parentGroups.length,
        failedCount: 0,
        readCount: Math.floor(parentGroups.length * 0.9),
      },
    };

    setCommunications((prev) => [newComm, ...prev]);

    // Dispatch 1 Notification & Queue per Smart Parent Group
    const newNotifs: InAppNotification[] = [];
    const newQueue: QueueItem[] = [];

    parentGroups.forEach((pg) => {
      const wardsList = pg.wardNames.join(', ');
      newNotifs.push({
        id: `notif-report-${Date.now()}-${pg.parentId}`,
        userId: pg.parentId,
        messageId: commId,
        title: `Report Sheet Published: ${wardsList}`,
        body: `Official Terminal Progress Report for ${wardsList} (${pg.reportCardsCount} card${pg.reportCardsCount > 1 ? 's' : ''}) has been published.`,
        priority: 'URGENT',
        category: 'REPORT_SHEET',
        channels: channels as any,
        senderName: 'Management Office',
        read: false,
        pinned: true,
        isArchived: false,
        createdAt: new Date().toISOString(),
        attachments: [
          {
            id: `att-${pg.parentId}`,
            name: `Terminal_Report_${wardsList.replace(/\s+/g, '_')}.pdf`,
            size: '1.8 MB',
            type: 'PDF',
            url: '#',
          },
        ],
      });

      channels.forEach((ch) => {
        newQueue.push({
          id: `q-report-${Date.now()}-${pg.parentId}-${ch}`,
          messageId: commId,
          messageTitle: `Report Sheet: ${wardsList}`,
          channel: ch as any,
          recipientId: pg.parentId,
          recipientName: pg.parentName,
          recipientContact: ch === 'WHATSAPP' ? pg.parentPhone : pg.parentEmail,
          recipientRole: 'PARENT',
          status: 'COMPLETED',
          attempts: 1,
          maxAttempts: 3,
          queuedAt: new Date().toISOString(),
          processedAt: new Date().toISOString(),
        });
      });
    });

    setInAppNotifications((prev) => [...newNotifs, ...prev]);
    setDeliveryQueue((prev) => [...newQueue, ...prev]);

    addAuditLog({
      action: 'REPORT_SHEETS_PUBLISHED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Published & dispatched Report Sheet batch for ${classStudents.length} students grouped into ${parentGroups.length} smart parent dispatches`,
      ipAddress: '197.210.227.14',
      affectedRecord: `CommunicationMessage/${commId}`,
      status: 'SUCCESS',
    });

    return { successCount: classStudents.length, parentGroupsCount: parentGroups.length };
  };

  const updateCommunicationSettings = (newSettings: Partial<CommunicationSettings>) => {
    setCommunicationSettings((prev) => ({ ...prev, ...newSettings }));
    addAuditLog({
      action: 'COMMUNICATION_SETTINGS_UPDATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Updated Enterprise Communication Center settings and provider configurations`,
      ipAddress: '197.210.227.14',
      affectedRecord: `CommunicationSettings`,
      status: 'SUCCESS',
    });
  };

  const addProgramme = async (progData: Omit<Programme, 'id' | 'created_at' | 'updated_at'>) => {
    const englishName = (progData.programme_name_english || progData.programme_name || '').trim();
    const arabicName = (progData.programme_name_arabic || '').trim();

    const isDuplicateName = programmes.some(
      (p) => (p.programme_name_english || p.programme_name).trim().toLowerCase() === englishName.toLowerCase()
    );
    if (isDuplicateName) {
      throw new Error(`A Programme with the name "${englishName}" already exists.`);
    }

    const isDuplicateCode = programmes.some(
      (p) => p.programme_code.trim().toLowerCase() === progData.programme_code.trim().toLowerCase()
    );
    if (isDuplicateCode) {
      throw new Error(`A Programme with the code "${progData.programme_code}" already exists.`);
    }

    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/programmes', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...progData,
          code: progData.programme_code,
          nameEnglish: englishName,
          nameArabic: arabicName,
          name: englishName,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to save programme to database.');
      }

      const createdProg: Programme = {
        ...progData,
        id: data.programme?.id || `prog-${Date.now()}`,
        programme_name_english: englishName,
        programme_name_arabic: arabicName,
        programme_name: englishName,
        created_at: data.programme?.createdAt || new Date().toISOString(),
        updated_at: data.programme?.updatedAt || new Date().toISOString(),
      };

      setProgrammes((prev) => {
        const next = [createdProg, ...prev];
        safeLocalStorageSet('markazu_programmes', next);
        return next;
      });

      notify({
        type: 'success',
        title: 'Programme Created',
        message: `Programme "${createdProg.programme_name_english}" saved successfully to database.`,
      });

      addAuditLog({
        action: 'PROGRAMME_CREATED',
        performedBy: currentUser.name,
        userRole: currentUser.role,
        details: `Created Programme: "${createdProg.programme_name_english}" (${createdProg.programme_code})`,
        ipAddress: '197.210.227.14',
        affectedRecord: `Programme/${createdProg.id}`,
        status: 'SUCCESS',
      });
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Programme Creation Failed',
        message: err.message || 'Could not save programme to database.',
      });
      throw err;
    }
  };

  const updateProgramme = async (id: string, updated: Partial<Programme>) => {
    if (updated.programme_name_english) {
      const isDuplicateName = programmes.some(
        (p) =>
          p.id !== id &&
          (p.programme_name_english || p.programme_name).trim().toLowerCase() === updated.programme_name_english!.trim().toLowerCase()
      );
      if (isDuplicateName) {
        throw new Error(`A Programme with the name "${updated.programme_name_english}" already exists.`);
      }
    }
    if (updated.programme_code) {
      const isDuplicateCode = programmes.some(
        (p) => p.id !== id && p.programme_code.trim().toLowerCase() === updated.programme_code!.trim().toLowerCase()
      );
      if (isDuplicateCode) {
        throw new Error(`A Programme with the code "${updated.programme_code}" already exists.`);
      }
    }

    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/programmes/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          ...updated,
          code: updated.programme_code,
          nameEnglish: updated.programme_name_english,
          nameArabic: updated.programme_name_arabic,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to update programme in database.');
      }

      setProgrammes((prev) => {
        const next = prev.map((p) => (p.id === id ? { 
          ...p, 
          ...updated, 
          programme_name_english: updated.programme_name_english || p.programme_name_english,
          programme_name_arabic: updated.programme_name_arabic !== undefined ? updated.programme_name_arabic : p.programme_name_arabic,
          programme_name: updated.programme_name_english || p.programme_name_english,
          updated_at: new Date().toISOString() 
        } : p));
        safeLocalStorageSet('markazu_programmes', next);
        return next;
      });

      notify({
        type: 'success',
        title: 'Programme Updated',
        message: `Programme "${updated.programme_name_english || id}" updated successfully.`,
      });

      addAuditLog({
        action: 'PROGRAMME_UPDATED',
        performedBy: currentUser.name,
        userRole: currentUser.role,
        details: `Updated Programme ID: ${id}`,
        ipAddress: '197.210.227.14',
        affectedRecord: `Programme/${id}`,
        status: 'SUCCESS',
      });
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Programme Update Failed',
        message: err.message || 'Could not update programme in database.',
      });
      throw err;
    }
  };

  const toggleProgrammeStatus = (id: string) => {
    setProgrammes((prev) => {
      const next: Programme[] = prev.map((p) =>
        p.id === id
          ? { ...p, status: (p.status === 'Active' ? 'Inactive' : 'Active') as 'Active' | 'Inactive', updated_at: new Date().toISOString() }
          : p
      );
      safeLocalStorageSet('markazu_programmes', next);
      return next;
    });

    addAuditLog({
      action: 'PROGRAMME_STATUS_TOGGLED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Toggled status for Programme ID: ${id}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Programme/${id}`,
      status: 'SUCCESS',
    });
  };

  const deleteProgramme = async (id: string) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/programmes/${id}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to delete programme from database.');
      }

      setProgrammes((prev) => {
        const next = prev.filter((p) => p.id !== id);
        safeLocalStorageSet('markazu_programmes', next);
        return next;
      });

      setClasses((prev) => {
        const next = prev.filter((c) => c.programmeId !== id);
        safeLocalStorageSet('markazu_classes', next);
        return next;
      });

      notify({
        type: 'info',
        title: 'Programme Deleted',
        message: `Programme ID ${id} deleted successfully from database.`,
      });

      addAuditLog({
        action: 'PROGRAMME_DELETED',
        performedBy: currentUser.name,
        userRole: currentUser.role,
        details: `Deleted Programme ID: ${id}`,
        ipAddress: '197.210.227.14',
        affectedRecord: `Programme/${id}`,
        status: 'SUCCESS',
      });
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Programme Deletion Failed',
        message: err.message || 'Could not delete programme from database.',
      });
      throw err;
    }
  };

  const addSubcategory = async (programmeId: string, subcategoryName: string) => {
    const trimmed = subcategoryName.trim();
    if (!trimmed) throw new Error('Subcategory name cannot be empty.');

    const prog = programmes.find((p) => p.id === programmeId);
    if (!prog) throw new Error('Programme not found.');

    const currentSubcategories = prog.subcategories || [];
    if (currentSubcategories.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`Subcategory "${trimmed}" already exists under ${prog.programme_name_english || prog.programme_name}.`);
    }

    const updatedSubcategories = [...currentSubcategories, trimmed];

    const headers = getAuthHeaders();
    const res = await fetch(`/api/programmes/${programmeId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        hasSubcategories: true,
        subcategories: updatedSubcategories,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}: Failed to save subcategory in database`);
    }

    setProgrammes((prev) => {
      const next = prev.map((p) =>
        p.id === programmeId
          ? {
              ...p,
              hasSubcategories: true,
              subcategories: updatedSubcategories,
              updated_at: new Date().toISOString(),
            }
          : p
      );
      safeLocalStorageSet('markazu_programmes', next);
      return next;
    });

    addAuditLog({
      action: 'SUBCATEGORY_ADDED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Added subcategory "${trimmed}" to Programme "${prog.programme_name}"`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Programme/${programmeId}`,
      status: 'SUCCESS',
    });
  };

  const updateSubcategory = async (programmeId: string, oldName: string, newName: string) => {
    const trimmedNew = newName.trim();
    if (!trimmedNew) throw new Error('Subcategory name cannot be empty.');

    const prog = programmes.find((p) => p.id === programmeId);
    if (!prog) throw new Error('Programme not found.');

    const currentSubcategories = prog.subcategories || [];
    if (
      trimmedNew.toLowerCase() !== oldName.toLowerCase() &&
      currentSubcategories.some((s) => s.toLowerCase() === trimmedNew.toLowerCase())
    ) {
      throw new Error(`Subcategory "${trimmedNew}" already exists under ${prog.programme_name_english || prog.programme_name}.`);
    }

    const updatedSubcategories = currentSubcategories.map((s) => (s === oldName ? trimmedNew : s));

    const headers = getAuthHeaders();
    const res = await fetch(`/api/programmes/${programmeId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        hasSubcategories: updatedSubcategories.length > 0,
        subcategories: updatedSubcategories,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}: Failed to update subcategory in database`);
    }

    setProgrammes((prev) => {
      const next = prev.map((p) =>
        p.id === programmeId
          ? {
              ...p,
              subcategories: updatedSubcategories,
              updated_at: new Date().toISOString(),
            }
          : p
      );
      safeLocalStorageSet('markazu_programmes', next);
      return next;
    });

    setClasses((prev) => {
      const next = prev.map((c) =>
        c.programmeId === programmeId && c.subcategory === oldName
          ? { ...c, subcategory: trimmedNew }
          : c
      );
      safeLocalStorageSet('markazu_classes', next);
      return next;
    });

    addAuditLog({
      action: 'SUBCATEGORY_UPDATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Updated subcategory "${oldName}" to "${trimmedNew}" in Programme "${prog.programme_name}"`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Programme/${programmeId}`,
      status: 'SUCCESS',
    });
  };

  const deleteSubcategory = async (programmeId: string, subcategoryName: string) => {
    const prog = programmes.find((p) => p.id === programmeId);
    if (!prog) throw new Error('Programme not found.');

    // DEPENDENCY CHECK: Prevent deletion if any class is assigned to this subcategory
    const dependentClasses = classes.filter(
      (c) => c.programmeId === programmeId && (c.subcategory === subcategoryName || c.subcategory?.toLowerCase() === subcategoryName.toLowerCase())
    );

    if (dependentClasses.length > 0) {
      const classNames = dependentClasses.map((c) => c.name).join(', ');
      throw new Error(
        `Cannot delete subcategory "${subcategoryName}" because ${dependentClasses.length} active class(es) [${classNames}] depend on it. Please reassign or remove these classes first.`
      );
    }

    const updatedSubcategories = (prog.subcategories || []).filter((s) => s !== subcategoryName);
    const hasSubcats = updatedSubcategories.length > 0;

    const headers = getAuthHeaders();
    const res = await fetch(`/api/programmes/${programmeId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        hasSubcategories: hasSubcats,
        subcategories: updatedSubcategories,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}: Failed to delete subcategory from database`);
    }

    setProgrammes((prev) => {
      const next = prev.map((p) =>
        p.id === programmeId
          ? {
              ...p,
              hasSubcategories: hasSubcats,
              subcategories: updatedSubcategories,
              updated_at: new Date().toISOString(),
            }
          : p
      );
      safeLocalStorageSet('markazu_programmes', next);
      return next;
    });

    setClasses((prev) => {
      const next = prev.map((c) =>
        c.programmeId === programmeId && c.subcategory === subcategoryName
          ? { ...c, subcategory: undefined }
          : c
      );
      safeLocalStorageSet('markazu_classes', next);
      return next;
    });

    addAuditLog({
      action: 'SUBCATEGORY_DELETED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Deleted subcategory "${subcategoryName}" from Programme "${prog.programme_name}"`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Programme/${programmeId}`,
      status: 'SUCCESS',
    });
  };

  const assignHeadmasterProgramme = async (headmasterUserId: string, programmeId: string, programmeName: string) => {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/users/${encodeURIComponent(headmasterUserId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        assignedProgrammeId: programmeId || null,
        assignedProgrammeName: programmeName || null,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}: Failed to assign Headmaster in database`);
    }

    setUsers((prev) => {
      const next = prev.map((u) =>
        u.id === headmasterUserId
          ? {
              ...u,
              assignedProgrammeId: programmeId || undefined,
              assignedProgrammeName: programmeName || undefined,
            }
          : u
      );
      safeLocalStorageSet('markazu_users', next);
      return next;
    });

    if (currentUser && currentUser.id === headmasterUserId) {
      const updatedCurr = {
        ...currentUser,
        assignedProgrammeId: programmeId || undefined,
        assignedProgrammeName: programmeName || undefined,
      };
      setCurrentUser(updatedCurr);
      safeLocalStorageSet('markazu_current_user', updatedCurr);
    }

    addAuditLog({
      action: 'HEADMASTER_PROGRAMME_ASSIGNED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Assigned Headmaster user ID ${headmasterUserId} to Programme "${programmeName}"`,
      ipAddress: '197.210.227.14',
      affectedRecord: `User/${headmasterUserId}`,
      status: 'SUCCESS',
    });
  };

  const addClass = async (newClassData: Omit<SchoolClass, 'id'>) => {
    const englishName = (newClassData.class_name_english || newClassData.name || '').trim();
    const arabicName = (newClassData.class_name_arabic || '').trim();

    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: englishName,
          category: newClassData.category || 'TAHFIZ',
          section: newClassData.section || newClassData.subcategory || 'Section A',
          subcategory: newClassData.subcategory,
          capacity: Number(newClassData.capacity || 30),
          programmeId: newClassData.programmeId,
          classTeacherId: newClassData.classTeacherId,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to save class to database.');
      }

      const createdClass: SchoolClass = {
        ...newClassData,
        id: data.class?.id || `cls-${Date.now()}`,
        class_name_english: data.class?.name || englishName,
        class_name_arabic: arabicName,
        name: data.class?.name || englishName,
        programmeId: data.class?.programmeId || newClassData.programmeId,
        programmeName: data.class?.programmeName || newClassData.programmeName,
        studentCount: data.class?.studentCount || 0,
      };

      setClasses((prev) => {
        const next = [...prev, createdClass];
        safeLocalStorageSet('markazu_classes', next);
        return next;
      });

      notify({
        type: 'success',
        title: 'Class Created',
        message: `Class "${createdClass.name}" saved successfully to database.`,
      });

      addAuditLog({
        action: 'CLASS_CREATED',
        performedBy: currentUser.name,
        userRole: currentUser.role,
        details: `Created Class: ${createdClass.class_name_english} under Programme ${createdClass.programmeName || createdClass.programmeId}`,
        ipAddress: '197.210.227.14',
        affectedRecord: `SchoolClass/${createdClass.id}`,
        status: 'SUCCESS',
      });
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Class Creation Failed',
        message: err.message || 'Could not save class to database.',
      });
      throw err;
    }
  };

  const updateClass = async (id: string, updated: Partial<SchoolClass>) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/classes/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: updated.name || updated.class_name_english,
          category: updated.category,
          section: updated.section,
          subcategory: updated.subcategory,
          capacity: updated.capacity,
          programmeId: updated.programmeId,
          classTeacherId: updated.classTeacherId,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to update class in database.');
      }

      setClasses((prev) => {
        const next = prev.map((c) => {
          if (c.id === id) {
            const englishName = updated.class_name_english || updated.name || c.class_name_english || c.name;
            const arabicName = updated.class_name_arabic !== undefined ? updated.class_name_arabic : c.class_name_arabic;
            return {
              ...c,
              ...updated,
              class_name_english: englishName,
              class_name_arabic: arabicName,
              name: englishName,
            };
          }
          return c;
        });
        safeLocalStorageSet('markazu_classes', next);
        return next;
      });

      notify({
        type: 'success',
        title: 'Class Updated',
        message: `Class "${updated.name || id}" updated successfully.`,
      });

      addAuditLog({
        action: 'CLASS_UPDATED',
        performedBy: currentUser.name,
        userRole: currentUser.role,
        details: `Updated Class ID: ${id}`,
        ipAddress: '197.210.227.14',
        affectedRecord: `SchoolClass/${id}`,
        status: 'SUCCESS',
      });
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Class Update Failed',
        message: err.message || 'Could not update class in database.',
      });
      throw err;
    }
  };

  const deleteClass = async (id: string) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/classes/${id}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to delete class from database.');
      }

      setClasses((prev) => {
        const next = prev.filter((c) => c.id !== id);
        safeLocalStorageSet('markazu_classes', next);
        return next;
      });

      setTeacherAssignments((prev) => {
        const next = prev.filter((ta) => ta.classId !== id);
        safeLocalStorageSet('markazu_teacher_assignments', next);
        return next;
      });

      notify({
        type: 'info',
        title: 'Class Deleted',
        message: `Class ID ${id} removed successfully from database.`,
      });

      addAuditLog({
        action: 'CLASS_DELETED',
        performedBy: currentUser.name,
        userRole: currentUser.role,
        details: `Deleted Class ID: ${id}`,
        ipAddress: '197.210.227.14',
        affectedRecord: `SchoolClass/${id}`,
        status: 'WARNING',
      });
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Class Deletion Failed',
        message: err.message || 'Could not delete class from database.',
      });
      throw err;
    }
  };

  const [academicEvents, setAcademicEvents] = useState<AcademicEvent[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('markazu_academic_events');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('markazu_academic_events', JSON.stringify(academicEvents));
    }
  }, [academicEvents]);

  const addAcademicEvent = (eventData: Omit<AcademicEvent, 'id'>) => {
    const newEvent: AcademicEvent = {
      ...eventData,
      id: `evt-${Date.now()}`,
      isPublished: true,
    };
    setAcademicEvents((prev) => [newEvent, ...prev]);
    notify({
      type: 'success',
      title: 'Academic Event Published',
      message: `${newEvent.title} has been added to the Academic Calendar.`,
    });
    addAuditLog({
      action: 'ACADEMIC_CALENDAR_EVENT_ADDED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Added academic event: ${newEvent.title}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `AcademicEvent/${newEvent.id}`,
      status: 'SUCCESS',
    });
  };

  const updateAcademicEvent = (id: string, updated: Partial<AcademicEvent>) => {
    setAcademicEvents((prev) =>
      prev.map((evt) => (evt.id === id ? { ...evt, ...updated } : evt))
    );
    notify({
      type: 'success',
      title: 'Academic Event Updated',
      message: `Academic event has been updated.`,
    });
  };

  const deleteAcademicEvent = (id: string) => {
    setAcademicEvents((prev) => prev.filter((evt) => evt.id !== id));
    notify({
      type: 'info',
      title: 'Academic Event Removed',
      message: `Event removed from Academic Calendar.`,
    });
  };

  const importSchoolStructureBatch = async (
    validatedRows: ValidatedImportRow[]
  ): Promise<ImportSchoolStructureSummary> => {
    let programmesVerified = 0;
    let subcategoriesCount = 0;
    let classesImported = 0;
    let teacherAssignmentsCreated = 0;
    let subjectsCreated = 0;
    let emptyRowsSkipped = 0;
    let errorsCount = 0;

    const rowsToImport = validatedRows.filter((r) => !r.isEmptyRow && r.className);
    emptyRowsSkipped = validatedRows.length - rowsToImport.length;

    let nextClasses = [...classes];
    let nextProgrammes = [...programmes];
    let nextTeachers = [...teachers];
    let nextSubjects = [...subjects];
    let nextAssignments = [...teacherAssignments];

    rowsToImport.forEach((row) => {
      // 1. Match or Create Programme
      let targetProg = nextProgrammes.find((p) => {
        const pName = (p.programme_name_english || p.programme_name).toLowerCase();
        const rName = row.programmeName.toLowerCase();
        return pName.includes(rName) || rName.includes(pName);
      });

      if (!targetProg) {
        const progCode = row.programmeName.substring(0, 3).toUpperCase();
        targetProg = {
          id: `prog-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          programme_name_english: row.programmeName,
          programme_name_arabic: row.programmeName,
          programme_name: row.programmeName,
          programme_code: progCode,
          description: `${row.programmeName} Stream`,
          status: 'Active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        nextProgrammes.push(targetProg);
        programmesVerified++;
      } else {
        programmesVerified++;
      }

      if (row.subcategory) {
        subcategoriesCount++;
        targetProg.hasSubcategories = true;
        const currentSubs = targetProg.subcategories || [];
        if (!currentSubs.some((s) => s.toLowerCase() === row.subcategory!.toLowerCase())) {
          targetProg.subcategories = [...currentSubs, row.subcategory];
        }
        // Update in nextProgrammes list
        nextProgrammes = nextProgrammes.map((p) => (p.id === targetProg!.id ? targetProg! : p));
      }

      // 2. Parse Teacher Assignments
      const matchedTeacherIds: string[] = [];
      const matchedTeacherNames: string[] = [];
      row.parsedTeachers.forEach((t) => {
        if (t.matchedTeacherId && t.matchedTeacherName) {
          matchedTeacherIds.push(t.matchedTeacherId);
          matchedTeacherNames.push(t.matchedTeacherName);
        }
      });

      // 3. Match or Create Class
      let targetClassIdx = nextClasses.findIndex(
        (c) =>
          c.name.toLowerCase() === row.className.toLowerCase() &&
          c.programmeId === targetProg!.id
      );

      if (targetClassIdx >= 0) {
        const existing = nextClasses[targetClassIdx];
        const updatedCls: SchoolClass = {
          ...existing,
          subcategory: row.subcategory || existing.subcategory,
          classTeacherId: matchedTeacherIds[0] || existing.classTeacherId,
          classTeacherName: matchedTeacherNames[0] || existing.classTeacherName,
          assignedTeacherIds: matchedTeacherIds.length > 0 ? matchedTeacherIds : existing.assignedTeacherIds,
          assignedTeacherNames: matchedTeacherNames.length > 0 ? matchedTeacherNames : existing.assignedTeacherNames,
          subjects: row.parsedSubjects.length > 0 ? row.parsedSubjects : existing.subjects,
        };
        nextClasses[targetClassIdx] = updatedCls;
        classesImported++;
      } else {
        const newClassId = `cls-imp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const newClass: SchoolClass = {
          id: newClassId,
          class_name_english: row.className,
          class_name_arabic: row.className,
          name: row.className,
          category: 'TAHFIZ',
          section: row.subcategory || 'General',
          subcategory: row.subcategory,
          capacity: 30,
          studentCount: 0,
          classTeacherId: matchedTeacherIds[0] || '',
          classTeacherName: matchedTeacherNames[0] || 'Unassigned',
          assignedTeacherIds: matchedTeacherIds,
          assignedTeacherNames: matchedTeacherNames,
          subjects: row.parsedSubjects,
          programmeId: targetProg.id,
          programmeName: targetProg.programme_name_english || targetProg.programme_name,
        };
        nextClasses.push(newClass);
        classesImported++;
      }

      // 4. Update Teacher Assignments and Teacher Models
      const currentClassObj = nextClasses.find(
        (c) => c.name.toLowerCase() === row.className.toLowerCase() && c.programmeId === targetProg!.id
      );

      if (currentClassObj) {
        matchedTeacherIds.forEach((tId) => {
          const existsTa = nextAssignments.some(
            (ta) => ta.teacherId === tId && ta.classId === currentClassObj.id
          );
          if (!existsTa) {
            nextAssignments.push({
              id: `ta-imp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              teacherId: tId,
              programmeId: targetProg!.id,
              classId: currentClassObj.id,
              subjectIds: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            teacherAssignmentsCreated++;
          }

          nextTeachers = nextTeachers.map((t) => {
            if (t.id === tId) {
              const assignedCls = t.classesAssigned || [];
              const assignedProgs = t.programmeIds || [];
              return {
                ...t,
                classesAssigned: assignedCls.includes(currentClassObj.id) ? assignedCls : [...assignedCls, currentClassObj.id],
                programmeIds: assignedProgs.includes(targetProg!.id) ? assignedProgs : [...assignedProgs, targetProg!.id],
              };
            }
            return t;
          });
        });

        // 5. Subjects Linking & Creation
        row.parsedSubjects.forEach((subName) => {
          const subCode = subName.substring(0, 4).toUpperCase();
          const existsSub = nextSubjects.some(
            (s) => s.name.toLowerCase() === subName.toLowerCase() && s.classId === currentClassObj.id
          );
          if (!existsSub) {
            nextSubjects.push({
              id: `sub-imp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              name: subName,
              nameEnglish: subName,
              code: subCode,
              category: 'ISLAMIC',
              description: `${subName} Curriculum`,
              programmeId: targetProg!.id,
              programmeName: targetProg!.programme_name,
              classId: currentClassObj.id,
              className: currentClassObj.name,
              status: 'ACTIVE',
            });
            subjectsCreated++;
          }
        });
      }
    });

    setClasses(nextClasses);
    setProgrammes(nextProgrammes);
    setTeachers(nextTeachers);
    setSubjects(nextSubjects);
    setTeacherAssignments(nextAssignments);

    safeLocalStorageSet('markazu_classes', nextClasses);
    safeLocalStorageSet('markazu_programmes', nextProgrammes);
    safeLocalStorageSet('markazu_teachers', nextTeachers);
    safeLocalStorageSet('markazu_subjects', nextSubjects);
    safeLocalStorageSet('markazu_teacher_assignments', nextAssignments);

    addAuditLog({
      action: 'SCHOOL_STRUCTURE_IMPORTED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Imported school structure via Excel: ${classesImported} classes, ${subcategoriesCount} subcategories, ${teacherAssignmentsCreated} teacher assignments.`,
      ipAddress: '197.210.227.14',
      status: 'SUCCESS',
    });

    return {
      programmesVerified,
      subcategoriesCount,
      classesImported,
      teacherAssignmentsCreated,
      subjectsCreated,
      emptyRowsSkipped,
      errorsCount,
    };
  };

  return (
    <AppContext.Provider
      value={{
        toasts,
        notify,
        dismissToast,
        showConfirm,
        confirmOptions,
        dismissConfirm,
        showProgress,
        progressOptions,
        dismissProgress,
        isHydrated,
        currentUser,
        users,
        updateUserAvatar,
        auditLogs,
        activeSessions: sessions,
        schoolLogo,
        setSchoolLogo,
        schoolName,
        setSchoolName,
        admissionStatus,
        admissionApplications,
        toggleAdmissionStatus,
        submitAdmissionApplication,
        approveAdmissionApplication,
        rejectAdmissionApplication,
        academicEvents,
        addAcademicEvent,
        updateAcademicEvent,
        deleteAcademicEvent,
        switchRole,
        setCurrentUser,
        createUserAccount,
        deleteUserAccount,
        restoreUserAccount,
        permanentlyDeleteUserAccount,
        deactivatedUsers,
        fetchDeactivatedUsers,
        updateUserAccount,
        unlockAccount,
        resetUserPassword,
        updateUserPasswordByEmail,
        terminateSession,
        terminateAllSessions,
        addAuditLog,
        programmes,
        students,
        teachers,
        parents,
        classes,
        subjects,
        teacherAssignments,
        attendance,
        tahfizRecords,
        timetablePeriods,
        directMessages,
        grades,
        announcements,
        currentSession,
        assessmentConfig,
        resultSubmissions,
        reportCardTemplate,
        updateReportCardTemplate,
        saveAttendanceBatch,
        adminOverrideAttendance,
        saveTahfizRecord,
        sendTeacherDirectMessage,
        markDirectMessageRead,
        archiveDirectMessage,
        updateAssessmentConfig,
        saveGradeGridDraft,
        submitResultBatch,
        approveResultSubmission,
        rejectResultSubmission,
        returnResultSubmission,
        communications,
        messageTemplates,
        deliveryQueue,
        inAppNotifications,
        communicationSettings,
        createCommunication,
        testSendCommunication,
        retryFailedDelivery,
        retryAllFailedDeliveries,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        duplicateTemplate,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        pinNotification,
        archiveNotification,
        deleteNotification,
        publishReportSheetsBatch,
        updateCommunicationSettings,
        newsArticles,
        addNewsArticle,
        updateNewsArticle,
        deleteNewsArticle,
        galleryItems,
        addGalleryItem,
        updateGalleryItem,
        deleteGalleryItem,
        addProgramme,
        updateProgramme,
        toggleProgrammeStatus,
        deleteProgramme,
        addSubcategory,
        updateSubcategory,
        deleteSubcategory,
        assignHeadmasterProgramme,
        addClass,
        updateClass,
        deleteClass,
        addSubject,
        updateSubject,
        deleteSubject,
        assignTeacher,
        removeTeacherAssignment,
        importSchoolStructureBatch,
        addStudent,
        updateStudent,
        deleteStudent,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        addParent,
        updateParent,
        deleteParent,
        bulkImportTeachers,
        bulkImportStudents,
        bulkImportParents,
        syncUsersFromBackend,
        syncStudentsFromBackend,
        syncTeachersFromBackend,
        syncParentsFromBackend,
        syncAttendanceFromBackend,
        addTahfizRecord,
        markAttendance,
        addGradeRecord,
        addAnnouncement,
      }}
    >
      {children}
      <EnterpriseToastContainer toasts={toasts} onDismiss={dismissToast} />
      <EnterpriseConfirmModal options={confirmOptions} onClose={dismissConfirm} />
      <EnterpriseProgressModal options={progressOptions} onClose={dismissProgress} />
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

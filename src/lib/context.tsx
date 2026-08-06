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
} from '../types';
import {
  MOCK_USERS,
  MOCK_STUDENTS,
  MOCK_TEACHERS,
  MOCK_PARENTS,
  MOCK_CLASSES,
  MOCK_SUBJECTS,
  MOCK_TEACHER_ASSIGNMENTS,
  MOCK_ATTENDANCE,
  MOCK_TAHFIZ_RECORDS,
  MOCK_GRADES,
  DEFAULT_ASSESSMENT_CONFIG,
  MOCK_RESULT_SUBMISSIONS,
  MOCK_ANNOUNCEMENTS,
  CURRENT_SESSION,
  MOCK_PROGRAMMES,
  MOCK_COMMUNICATIONS,
  MOCK_MESSAGE_TEMPLATES,
  MOCK_QUEUE_ITEMS,
  MOCK_NOTIFICATIONS,
  MOCK_COMMUNICATION_SETTINGS,
  MOCK_TIMETABLE,
  MOCK_DIRECT_MESSAGES,
} from './mockData';
import { AuditEntry, INITIAL_AUDIT_LOGS, createAuditLogEntry } from './audit';
import { sendSystemEmail } from './emailService';
import { UserSession, ACTIVE_SESSIONS, revokeSession, revokeAllUserSessions, hashPassword, generateTemporaryPassword } from './security';
import { NotificationService } from '../services/notificationService';

const INITIAL_ADMISSION_APPLICATIONS: AdmissionApplication[] = [
  {
    id: 'app-001',
    applicationNo: 'APP-2026-001',
    studentFullName: 'Zayd Muhammad Daneji',
    studentGender: 'MALE',
    studentDob: '2016-04-12',
    state: 'Kano State',
    lga: 'Kano Municipal',
    studentAddress: 'No. 45 Daneji Quarters, Kano',
    previousSchool: 'Al-Iman Academy Kano',
    parentName: 'Alhaji Muhammad Daneji',
    parentRelationship: 'Father',
    parentPhone: '+2348037966581',
    parentWhatsapp: '+2348037966581',
    parentEmail: 'muhammad.daneji@gmail.com',
    parentOccupation: 'Merchant & Trader',
    parentAddress: 'No. 45 Daneji Quarters, Kano',
    emergencyName: 'Hajiya Fatima Daneji',
    emergencyRelationship: 'Mother',
    emergencyPhone: '+2348167109421',
    medicalInformation: 'No known allergies',
    remarks: 'Applicant has memorized 5 Juz in previous Madrasa.',
    status: 'PENDING_REVIEW',
    submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'app-002',
    applicationNo: 'APP-2026-002',
    studentFullName: 'Aisha Ibrahim Sheka',
    studentGender: 'FEMALE',
    studentDob: '2017-09-20',
    state: 'Kano State',
    lga: 'Kumbotso',
    studentAddress: 'Sheka Quarters, Kano',
    previousSchool: 'Nuru Islamic School',
    parentName: 'Mallam Ibrahim Sheka',
    parentRelationship: 'Father',
    parentPhone: '+2349042786093',
    parentWhatsapp: '+2349042786093',
    parentEmail: 'ibrahim.sheka@gmail.com',
    parentOccupation: 'Civil Servant',
    parentAddress: 'Sheka Quarters, Kano',
    emergencyName: 'Aisha Sheka',
    emergencyRelationship: 'Mother',
    emergencyPhone: '+2349042786093',
    status: 'APPROVED',
    submittedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    reviewedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    reviewedBy: 'Super Administrator',
    assignedProgrammeIds: ['prog-02'],
    assignedClassIds: ['cls-tahfiz-1'],
    generatedStudentId: 'MU-2026-STUD-088',
    generatedParentId: 'usr-parent-088',
  },
];

const INITIAL_ACADEMIC_EVENTS: AcademicEvent[] = [
  {
    id: 'evt-01',
    term: 'Term 1',
    title: 'First Term Session (1448 AH)',
    badge: 'Term 1 (Autumn)',
    badgeColor: 'emerald',
    dates: 'Resumption: Sept 15 • Mid-Term: Oct 28 • Exams: Dec 10 • Hifz Assessment',
    description: 'Systematic 30-Juz Halqa placement, initial diagnostic assessment, and first term examinations.',
    isPublished: true,
  },
  {
    id: 'evt-02',
    term: 'Term 2',
    title: 'Second Term Session (1448 AH)',
    badge: 'Term 2 (Current)',
    badgeColor: 'amber',
    dates: 'Resumption: Jan 10 • Ramadan Break: Mar 15 • Term Exams: April 20',
    description: 'Mid-year Quranic competition, Ramadan intensive Hifz program, and parent progress reviews.',
    isPublished: true,
  },
  {
    id: 'evt-03',
    term: 'Term 3',
    title: 'Third Term & Graduation (1448 AH)',
    badge: 'Term 3 (Summer)',
    badgeColor: 'sky',
    dates: 'Resumption: May 5 • Annual Hifz Competition: July 12 • Graduation: August 20',
    description: 'Annual Huffaz graduation ceremony, Sanad distribution, and final academic promotion exams.',
    isPublished: true,
  },
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

  currentUser: User;
  users: User[];
  updateUserAvatar: (avatarUrl: string) => void;
  auditLogs: AuditEntry[];
  activeSessions: UserSession[];
  schoolLogo: string | null;
  setSchoolLogo: (logo: string | null) => void;
  schoolName: string;
  setSchoolName: (name: string) => void;
  
  switchRole: (role: UserRole) => void;
  setCurrentUser: (user: User) => void;
  
  // Security & Account Management
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

  addClass: (newClass: Omit<SchoolClass, 'id'>) => void;
  updateClass: (id: string, updated: Partial<SchoolClass>) => void;
  deleteClass: (id: string) => void;

  addSubject: (subject: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, updated: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;

  assignTeacher: (assignment: Omit<TeacherAssignment, 'id'>) => void;
  removeTeacherAssignment: (id: string) => void;

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
  bulkImportStudents: (studentsData: Omit<Student, 'id'>[]) => { successCount: number };
  bulkImportParents: (parentsData: (Omit<Parent, 'id'> & { id?: string; linkedChildrenStr?: string })[]) => { successCount: number };

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

  const [users, setUsers] = useState<User[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedUsers = localStorage.getItem('markazu_users');
        if (savedUsers) return JSON.parse(savedUsers);

        const savedPass = localStorage.getItem('markazu_user_passwords');
        if (savedPass) {
          const pMap: Record<string, string> = JSON.parse(savedPass);
          return MOCK_USERS.map((u) => {
            const h = pMap[u.email.toLowerCase()] || pMap[u.id];
            if (h) {
              return { ...u, passwordHash: h, failedLoginAttempts: 0, isLocked: false };
            }
            return u;
          });
        }
      } catch {}
    }
    return MOCK_USERS;
  });
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]); // Default to Super Admin
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('markazu_audit_logs');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_AUDIT_LOGS;
  });
  const [sessions, setSessions] = useState<UserSession[]>(ACTIVE_SESSIONS);

  const DEFAULT_SCHOOL_NAME = "MARKAZU UMAR BN AL-KHATTAB CENTRE FOR QUR'AN MEMORIZATION & ISLAMIC STUDIES - DANEJI";
  const [schoolLogo, setSchoolLogoState] = useState<string | null>('/logo.jpg');
  const [schoolName, setSchoolNameState] = useState<string>(DEFAULT_SCHOOL_NAME);

  useEffect(() => {
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
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && currentUser?.id) {
      const savedAvatar = localStorage.getItem(`markazu_user_avatar_${currentUser.id}`);
      if (savedAvatar && savedAvatar !== currentUser.avatar) {
        setCurrentUser((prev) => ({ ...prev, avatar: savedAvatar }));
      }
    }
  }, [currentUser?.id]);

  const updateUserAvatar = (avatarUrl: string) => {
    setCurrentUser((prev) => ({ ...prev, avatar: avatarUrl }));
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? { ...u, avatar: avatarUrl } : u)));
    if (typeof window !== 'undefined' && currentUser?.id) {
      try {
        localStorage.setItem(`markazu_user_avatar_${currentUser.id}`, avatarUrl);
      } catch {}
    }
    notify({
      type: 'success',
      title: 'Profile Photo Updated',
      message: `Profile image updated successfully for ${currentUser.name}.`,
    });
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

  const [programmes, setProgrammes] = useState<Programme[]>(MOCK_PROGRAMMES);
  const [students, setStudents] = useState<Student[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('markazu_students');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return MOCK_STUDENTS;
  });
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('markazu_teachers');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return MOCK_TEACHERS;
  });
  const [parents, setParents] = useState<Parent[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('markazu_parents');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return MOCK_PARENTS;
  });
  const [classes, setClasses] = useState<SchoolClass[]>(MOCK_CLASSES);
  const [subjects, setSubjects] = useState<Subject[]>(MOCK_SUBJECTS);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('markazu_teacher_assignments');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return MOCK_TEACHER_ASSIGNMENTS;
  });
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('markazu_attendance');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return MOCK_ATTENDANCE;
  });
  const [tahfizRecords, setTahfizRecords] = useState<TahfizRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('markazu_tahfiz_records');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return MOCK_TAHFIZ_RECORDS;
  });
  const [timetablePeriods, setTimetablePeriods] = useState<TimetablePeriod[]>(MOCK_TIMETABLE);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>(MOCK_DIRECT_MESSAGES);
  const [grades, setGrades] = useState<GradeRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('markazu_grades');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return MOCK_GRADES;
  });
  const [assessmentConfig, setAssessmentConfig] = useState<AssessmentConfig>(DEFAULT_ASSESSMENT_CONFIG);
  const [resultSubmissions, setResultSubmissions] = useState<ResultApprovalSubmission[]>(MOCK_RESULT_SUBMISSIONS);

  // Safe LocalStorage Persistence Helper to prevent QuotaExceededError & Sensitive Data Leakage
  const safeLocalStorageSet = (key: string, data: any) => {
    if (typeof window === 'undefined') return;
    try {
      // Strip sensitive passwordHash field from client-side localStorage data
      let targetData = data;
      if (key === 'markazu_users' && Array.isArray(data)) {
        targetData = data.map((u: any) => {
          if (u && typeof u === 'object') {
            const copy = { ...u };
            delete copy.passwordHash;
            return copy;
          }
          return u;
        });
      }
      const serialized = JSON.stringify(targetData);
      localStorage.setItem(key, serialized);
    } catch (err: any) {
      console.warn(`[localStorage QUOTA EXCEEDED] Storage quota limit reached for key '${key}'. Cleaning up legacy cache...`);
      try {
        // Clear redundant legacy avatar keys
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith('markazu_user_avatar_')) {
            localStorage.removeItem(k);
          }
        }
        // Strip heavy inline base64 string duplicates over 50KB if any exist
        if (Array.isArray(data)) {
          const sanitized = data.map((item: any) => {
            if (item && typeof item === 'object') {
              const copy = { ...item };
              delete copy.passwordHash;
              if (typeof copy.avatar === 'string' && copy.avatar.length > 50000) delete copy.avatar;
              if (typeof copy.photoUrl === 'string' && copy.photoUrl.length > 50000) delete copy.photoUrl;
              return copy;
            }
            return item;
          });
          localStorage.setItem(key, JSON.stringify(sanitized));
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
  const [admissionStatus, setAdmissionStatusState] = useState<'OPEN' | 'CLOSED'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('markazu_admission_status');
      if (saved === 'CLOSED') return 'CLOSED';
    }
    return 'OPEN';
  });

  const [admissionApplications, setAdmissionApplications] = useState<AdmissionApplication[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('markazu_admission_apps');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_ADMISSION_APPLICATIONS;
  });

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
    MOCK_USERS.unshift(newStudentUser, newParentUser);

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
    setAttendance((prev) => {
      const updated = [...prev];
      newRecords.forEach((rec) => {
        const idx = updated.findIndex((r) => r.studentId === rec.studentId && r.date === rec.date);
        const recordToAdd = { ...rec, isDraft };
        if (idx >= 0) {
          updated[idx] = recordToAdd;
        } else {
          updated.push(recordToAdd);
        }
      });
      return updated;
    });

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
          const parent = parents.find((p) => p.wardIds.includes(targetStudent.id));
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
      const parent = parents.find((p) => p.wardIds.includes(targetStudent.id));
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
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [currentSession] = useState<SchoolSession>(CURRENT_SESSION);

  // Enterprise Communication Center States
  const [communications, setCommunications] = useState<CommunicationMessage[]>(MOCK_COMMUNICATIONS);
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>(MOCK_MESSAGE_TEMPLATES);
  const [deliveryQueue, setDeliveryQueue] = useState<QueueItem[]>(MOCK_QUEUE_ITEMS);
  const [inAppNotifications, setInAppNotifications] = useState<InAppNotification[]>(MOCK_NOTIFICATIONS);
  const [communicationSettings, setCommunicationSettings] = useState<CommunicationSettings>(MOCK_COMMUNICATION_SETTINGS);

  const addAuditLog = (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    const newEntry: AuditEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toLocaleString(),
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
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

    MOCK_USERS.forEach((u) => {
      if (u.id === userId) {
        u.isLocked = false;
        u.status = 'ACTIVE';
        u.failedLoginAttempts = 0;
        u.passwordHash = tempHash;
        u.isFirstLogin = true;
        u.mustChangePassword = true;
      }
    });

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

  const resetUserPassword = (userId: string, newPass: string) => {
    const targetUser = users.find((u) => u.id === userId);
    const newHash = hashPassword(newPass);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, passwordHash: newHash, isFirstLogin: true, mustChangePassword: true } : u))
    );
    if (targetUser) {
      sendSystemEmail({
        to: targetUser.email,
        recipientName: targetUser.name,
        subject: 'Password Reset - Markazu Umar School Management Portal',
        template: 'WELCOME_NEW_ACCOUNT',
        metadata: {
          username: targetUser.email,
          tempPassword: newPass,
        },
      });
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

    setUsers((prev) =>
      prev.map((u) => {
        if (u.email.toLowerCase() === cleanEmail || u.username?.toLowerCase() === cleanEmail) {
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
      })
    );

    MOCK_USERS.forEach((u) => {
      if (u.email.toLowerCase() === cleanEmail || u.username?.toLowerCase() === cleanEmail) {
        u.passwordHash = newHash;
        u.isFirstLogin = false;
        u.mustChangePassword = false;
        u.failedLoginAttempts = 0;
        u.isLocked = false;
      }
    });

    if (currentUser && (currentUser.email.toLowerCase() === cleanEmail || currentUser.username?.toLowerCase() === cleanEmail)) {
      const updatedCurr = {
        ...currentUser,
        passwordHash: newHash,
        isFirstLogin: false,
        mustChangePassword: false,
        failedLoginAttempts: 0,
        isLocked: false,
      };
      setCurrentUser(updatedCurr);
      if (typeof window !== 'undefined') {
        try {
          const sanitizedCurr = { ...updatedCurr };
          delete (sanitizedCurr as any).passwordHash;
          if (typeof sanitizedCurr.avatar === 'string' && sanitizedCurr.avatar.length > 50000) {
            delete (sanitizedCurr as any).avatar;
          }
          localStorage.setItem('markazu_current_user', JSON.stringify(sanitizedCurr));
        } catch {
          console.warn('[localStorage QUOTA EXCEEDED] Current user session maintained safely in memory state.');
        }
      }
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
  const addStudent = (studentData: Omit<Student, 'id'>, customPassword?: string) => {
    const studentId = `usr-student-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const newStudent: Student = {
      ...studentData,
      id: studentId,
    };

    setStudents((prev) => [newStudent, ...prev]);

    // Create User account credentials with mandatory first login flag
    const tempPass = customPassword || generateTemporaryPassword();
    const tempHash = hashPassword(tempPass);
    const newUser: User = {
      id: studentId,
      name: studentData.fullName,
      email: (studentData.email || `${studentData.admissionNo.toLowerCase()}@markazuumar.edu.ng`),
      role: 'STUDENT',
      passwordHash: tempHash,
      isFirstLogin: true,
      mustChangePassword: true,
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      isLocked: false,
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [newUser, ...prev]);
    MOCK_USERS.unshift(newUser);

    // Send Welcome Email
    sendSystemEmail({
      to: newUser.email,
      recipientName: newUser.name,
      subject: 'Welcome to Markazu Umar Portal - Student Account Created',
      template: 'WELCOME_NEW_ACCOUNT',
      metadata: {
        username: newUser.email,
        tempPassword: tempPass,
      },
    });

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

  const updateStudent = (id: string, updated: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
    );
    addAuditLog({
      action: 'STUDENT_UPDATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Updated details for student ID: ${id}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Student/${id}`,
      status: 'SUCCESS',
    });
  };

  const deleteStudent = (id: string) => {
    const targetStudent = students.find((s) => s.id === id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
    if (targetStudent) {
      setUsers((prev) => prev.filter((u) => u.id !== targetStudent.userId && u.username !== targetStudent.admissionNo));
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

  const addTeacher = (teacherData: Omit<Teacher, 'id'>, customPassword?: string) => {
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

    setTeachers((prev) => [newTeacher, ...prev]);

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

    setUsers((prev) => [newUser, ...prev]);
    MOCK_USERS.unshift(newUser);

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
        setTeacherAssignments((prev) => [...createdAssignments, ...prev]);
      }
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

  const updateTeacher = (id: string, updated: Partial<Teacher>) => {
    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const englishName = updated.full_name_english || updated.fullName || t.full_name_english || t.fullName;
          const arabicName = updated.full_name_arabic !== undefined ? updated.full_name_arabic : t.full_name_arabic;
          return {
            ...t,
            ...updated,
            full_name_english: englishName,
            full_name_arabic: arabicName,
            fullName: englishName,
          };
        }
        return t;
      })
    );
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

  const deleteTeacher = (id: string) => {
    const targetTeacher = teachers.find((t) => t.id === id);
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    if (targetTeacher) {
      setUsers((prev) => prev.filter((u) => u.id !== targetTeacher.userId && u.email !== targetTeacher.email));
    }
    notify({
      type: 'warning',
      title: 'Teacher Profile Deleted',
      message: `Teacher profile and login credentials for ${targetTeacher?.fullName || id} have been deleted.`,
    });
    addAuditLog({
      action: 'TEACHER_DELETED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Removed teacher record & login account ID: ${id}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Teacher/${id}`,
      status: 'WARNING',
    });
  };

  const addSubject = (subjectData: Omit<Subject, 'id'>) => {
    const newSubject: Subject = {
      ...subjectData,
      id: `subj-${Date.now()}`,
    };
    setSubjects((prev) => [...prev, newSubject]);
    addAuditLog({
      action: 'SUBJECT_ADDED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Added new subject ${subjectData.name} (${subjectData.code})`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Subject/${newSubject.id}`,
      status: 'SUCCESS',
    });
  };

  const updateSubject = (id: string, updated: Partial<Subject>) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    addAuditLog({
      action: 'SUBJECT_ADDED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Updated subject details ID: ${id}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Subject/${id}`,
      status: 'SUCCESS',
    });
  };

  const deleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    addAuditLog({
      action: 'SUBJECT_REMOVED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Removed subject ID: ${id}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Subject/${id}`,
      status: 'WARNING',
    });
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

  const addParent = (parentData: Omit<Parent, 'id'> & { id?: string }, customPassword?: string) => {
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

    setUsers((prev) => [newUser, ...prev]);
    MOCK_USERS.unshift(newUser);

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
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
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
    setParents((prev) => prev.filter((p) => p.id !== id));
    if (targetParent) {
      setUsers((prev) => prev.filter((u) => u.id !== targetParent.userId && u.email !== targetParent.email));
    }
    notify({
      type: 'warning',
      title: 'Parent/Guardian Profile Deleted',
      message: `Parent profile and login credentials for ${targetParent?.fatherName || targetParent?.motherName || id} have been deleted.`,
    });
    addAuditLog({
      action: 'PARENT_DELETED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Deleted parent/guardian profile & login account ID: ${id}`,
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

  const bulkImportStudents = (studentsData: Omit<Student, 'id'>[]): { successCount: number } => {
    let count = 0;
    studentsData.forEach((sData) => {
      addStudent(sData);
      count++;
    });
    return { successCount: count };
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

  const addProgramme = (progData: Omit<Programme, 'id' | 'created_at' | 'updated_at'>) => {
    const englishName = progData.programme_name_english || progData.programme_name;
    const arabicName = progData.programme_name_arabic || '';

    const isDuplicateName = programmes.some(
      (p) => (p.programme_name_english || p.programme_name).trim().toLowerCase() === englishName.trim().toLowerCase()
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

    const newProg: Programme = {
      ...progData,
      id: `prog-${Date.now()}`,
      programme_name_english: englishName,
      programme_name_arabic: arabicName,
      programme_name: englishName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setProgrammes((prev) => [newProg, ...prev]);
    addAuditLog({
      action: 'PROGRAMME_CREATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Created Programme: "${newProg.programme_name_english}" (${newProg.programme_code})`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Programme/${newProg.id}`,
      status: 'SUCCESS',
    });
  };

  const updateProgramme = (id: string, updated: Partial<Programme>) => {
    const englishName = updated.programme_name_english || updated.programme_name;
    if (englishName) {
      const isDuplicateName = programmes.some(
        (p) => p.id !== id && p.programme_name_english.trim().toLowerCase() === englishName.trim().toLowerCase()
      );
      if (isDuplicateName) {
        throw new Error(`A Programme with the name "${englishName}" already exists.`);
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
    setProgrammes((prev) =>
      prev.map((p) => (p.id === id ? { 
        ...p, 
        ...updated, 
        programme_name_english: updated.programme_name_english || p.programme_name_english,
        programme_name_arabic: updated.programme_name_arabic !== undefined ? updated.programme_name_arabic : p.programme_name_arabic,
        programme_name: updated.programme_name_english || p.programme_name_english,
        updated_at: new Date().toISOString() 
      } : p))
    );
    addAuditLog({
      action: 'PROGRAMME_UPDATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Updated Programme ID: ${id}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Programme/${id}`,
      status: 'SUCCESS',
    });
  };

  const toggleProgrammeStatus = (id: string) => {
    setProgrammes((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === 'Active' ? 'Inactive' : 'Active', updated_at: new Date().toISOString() }
          : p
      )
    );
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

  const deleteProgramme = (id: string) => {
    setProgrammes((prev) => prev.filter((p) => p.id !== id));
    addAuditLog({
      action: 'PROGRAMME_DELETED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Deleted Programme ID: ${id}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Programme/${id}`,
      status: 'SUCCESS',
    });
  };

  const addClass = (newClassData: Omit<SchoolClass, 'id'>) => {
    const englishName = newClassData.class_name_english || newClassData.name;
    const arabicName = newClassData.class_name_arabic || '';

    const newClass: SchoolClass = {
      ...newClassData,
      id: `cls-${Date.now()}`,
      class_name_english: englishName,
      class_name_arabic: arabicName,
      name: englishName,
    };
    setClasses((prev) => [...prev, newClass]);
    addAuditLog({
      action: 'CLASS_CREATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Created Class: ${newClass.class_name_english} under Programme ${newClass.programmeName}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `SchoolClass/${newClass.id}`,
      status: 'SUCCESS',
    });
  };

  const updateClass = (id: string, updated: Partial<SchoolClass>) => {
    setClasses((prev) => prev.map((c) => {
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
    }));
    addAuditLog({
      action: 'CLASS_UPDATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Updated Class ID: ${id}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `SchoolClass/${id}`,
      status: 'SUCCESS',
    });
  };

  const deleteClass = (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    addAuditLog({
      action: 'CLASS_DELETED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Deleted Class ID: ${id}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `SchoolClass/${id}`,
      status: 'SUCCESS',
    });
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
    return INITIAL_ACADEMIC_EVENTS;
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
        addProgramme,
        updateProgramme,
        toggleProgrammeStatus,
        deleteProgramme,
        addClass,
        updateClass,
        deleteClass,
        addSubject,
        updateSubject,
        deleteSubject,
        assignTeacher,
        removeTeacherAssignment,
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

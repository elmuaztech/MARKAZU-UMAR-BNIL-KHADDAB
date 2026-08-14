import {
  User,
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
  TimetablePeriod,
  DirectMessage,
} from '../types';
import {
  CommunicationMessage,
  MessageTemplate,
  QueueItem,
  InAppNotification,
  CommunicationSettings,
} from '../types/communication';

export const CURRENT_SESSION: SchoolSession = {
  id: 'sess-default',
  sessionName: '1447/1448 AH (2025/2026 AD)',
  activeTerm: 'Term 1',
  isCurrent: true,
};

export const MOCK_PROGRAMMES: Programme[] = [];
export const MOCK_USERS: User[] = [];
export const MOCK_CLASSES: SchoolClass[] = [];
export const MOCK_STUDENTS: Student[] = [];
export const MOCK_TEACHERS: Teacher[] = [];
export const MOCK_SUBJECTS: Subject[] = [];
export const MOCK_TEACHER_ASSIGNMENTS: any[] = [];
export const MOCK_PARENTS: Parent[] = [];
export const MOCK_TAHFIZ_RECORDS: TahfizRecord[] = [];
export const MOCK_ATTENDANCE: AttendanceRecord[] = [];
export const MOCK_TIMETABLE: TimetablePeriod[] = [];
export const MOCK_DIRECT_MESSAGES: DirectMessage[] = [];
export const MOCK_RESULT_SUBMISSIONS: ResultApprovalSubmission[] = [];
export const MOCK_GRADES: GradeRecord[] = [];
export const MOCK_ANNOUNCEMENTS: Announcement[] = [];

export const DEFAULT_ASSESSMENT_CONFIG: AssessmentConfig = {
  id: 'cfg-01',
  session: '1447/1448 AH (2025/2026 AD)',
  term: 'Term 1',
  enableAssignment: true,
  maxAssignment: 10,
  enableCa1: true,
  maxCa1: 20,
  enableCa2: true,
  maxCa2: 20,
  enableTest: false,
  maxTest: 10,
  enableProject: false,
  maxProject: 10,
  enablePractical: false,
  maxPractical: 10,
  enableExam: true,
  maxExam: 50,
  passMark: 40,
  gradingScale: [
    { grade: 'A', minScore: 75, maxScore: 100, remark: 'Distinction' },
    { grade: 'B', minScore: 60, maxScore: 74.99, remark: 'Very Good' },
    { grade: 'C', minScore: 50, maxScore: 59.99, remark: 'Good' },
    { grade: 'D', minScore: 40, maxScore: 49.99, remark: 'Pass' },
    { grade: 'F', minScore: 0, maxScore: 39.99, remark: 'Fail' },
  ],
  calcPosition: true,
};

export const MOCK_MESSAGE_TEMPLATES: MessageTemplate[] = [];
export const MOCK_COMMUNICATIONS: CommunicationMessage[] = [];
export const MOCK_QUEUE_ITEMS: QueueItem[] = [];
export const MOCK_NOTIFICATIONS: InAppNotification[] = [];

export const DEFAULT_COMMUNICATION_SETTINGS: CommunicationSettings = {
  schoolEmail: 'markazuumarbnkhaddabdaneji@gmail.com',
  replyToEmail: 'markazuumarbnkhaddabdaneji@gmail.com',
  schoolWhatsApp: '+234 816 710 9421',
  defaultSignature: 'Management Office\nMarkazu Umar bn Al-Khattab Centre for Qur\'an Memorization and Islamic Studies - Daneji',
  footerText: 'Official Communication • Markazu Umar bn Al-Khattab Centre for Qur\'an Memorization and Islamic Studies - Daneji • Kano, Nigeria',
  schoolLogo: '/logo.jpg',
  enableEmailService: true,
  enableWhatsAppService: true,
  enableInAppService: true,
  enableDashboardService: true,
};

export const MOCK_COMMUNICATION_SETTINGS: CommunicationSettings = DEFAULT_COMMUNICATION_SETTINGS;

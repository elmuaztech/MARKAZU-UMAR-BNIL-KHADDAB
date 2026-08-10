export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'HEADMASTER' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'SUSPENDED';
  passwordHash?: string;
  isFirstLogin?: boolean;
  isLocked?: boolean;
  failedLoginAttempts?: number;
  lockoutUntil?: string;
  lastLoginAt?: string;
  mustChangePassword?: boolean;
  createdAt?: string;
  username?: string;
  assignedProgrammeId?: string;
  assignedProgrammeName?: string;
}

export interface Programme {
  id: string; // UUID
  programme_name_english: string; // "Asubah & Magrib"
  programme_name_arabic: string; // "الصباح والمغرب"
  programme_name: string; // Combined / fallback display
  programme_code: string; // e.g. "ASM", "SPM", "ISM", "MTA"
  description: string;
  hasSubcategories?: boolean; // Whether this programme has subcategories (e.g. Asuba, Maghrib, Tahfiz)
  subcategories?: string[]; // Dynamic list of subcategory names
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

export interface StudentHifzProgress {
  currentJuz: number;
  juzCompleted: number; // 0 to 30
  currentSurah: string;
  currentAyah: number;
  completedSurahsCount: number;
  tajweedRating: number; // 1 to 5 stars
  sabkiRating: number; // 1 to 5 stars
  manzilRating: number; // 1 to 5 stars
  completionPercentage?: number;
}

export interface Student {
  id: string;
  userId?: string;
  admissionNo: string;
  fullName: string;
  fullNameArabic?: string;
  gender: 'MALE' | 'FEMALE';
  dob: string;
  dateEnrolled: string;
  email?: string;
  programmeId?: string;
  programmeName?: string;
  programmeNameArabic?: string;
  classId: string;
  className: string;
  classNameArabic?: string;
  guardianId: string;
  guardianName: string;
  guardianPhone: string;
  stateOfOrigin?: string;
  localGovtArea?: string;
  residentialAddress?: string;
  status: 'ACTIVE' | 'GRADUATED' | 'SUSPENDED';
  hifzProgress: StudentHifzProgress;
  akhlaqRating: 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'NEEDS_IMPROVEMENT';
  avatar?: string;
}

export interface Teacher {
  id: string;
  userId?: string;
  staffNo: string;
  full_name_english: string;
  full_name_arabic: string;
  fullName: string; // Combined / fallback
  email: string;
  phone: string;
  qualification?: string;
  specialization?: string;
  programmeIds?: string[]; // Multiple Programmes assigned by Admin
  classesAssigned: string[]; // Multiple Classes assigned by Admin
  subjectsAssigned: string[];
  dateJoined: string;
  status: 'ACTIVE' | 'ON_LEAVE';
  avatar?: string;
}

export interface Parent {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  relationship?: string;
  avatar?: string;
  occupation: string;
  address: string;
  wardsCount: number;
  wardIds: string[];
  linkedStudentIds?: string[];
  dateRegistered?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface SchoolClass {
  id: string;
  class_name_english: string;
  class_name_arabic?: string;
  name: string; // Combined / fallback
  category: 'TAHFIZ' | 'ISLAMIYYA_PRIMARY' | 'ISLAMIYYA_SECONDARY';
  section: string; // e.g. "Section A", "Halqa 1"
  subcategory?: string; // e.g. "Asuba", "Maghrib", "Tahfiz"
  capacity: number;
  studentCount: number;
  classTeacherId?: string;
  classTeacherName?: string;
  classTeacherNameArabic?: string;
  assignedTeacherIds?: string[];
  assignedTeacherNames?: string[];
  subjects?: string[];
  programmeId: string; // Relationship: Programme -> Class
  programmeName: string;
  programmeNameArabic?: string;
}

export interface Subject {
  id: string;
  name: string;
  nameEnglish?: string;
  arabicName?: string;
  code: string;
  category: 'TAHFIZ' | 'ISLAMIC' | 'GENERAL';
  description: string;
  programmeId?: string;
  programmeName?: string;
  classId?: string;
  className?: string;
  status: 'ACTIVE' | 'INACTIVE';
  displayOrder?: number;
}

export interface TeacherAssignmentSubject {
  id: string;
  teacherAssignmentId: string;
  subjectId: string;
  createdAt?: string;
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  programmeId: string;
  classId: string;
  subjectIds: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type AttendanceStatusType =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'EXCUSED'
  | 'MEDICAL_LEAVE'
  | 'OFFICIAL_ASSIGNMENT'
  | 'HOLIDAY';

export interface AttendanceRecord {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  programmeId?: string;
  classId: string;
  className?: string;
  teacherId?: string;
  status: AttendanceStatusType;
  remarks?: string;
  isDraft?: boolean;
  editedBy?: string;
  editedAt?: string;
  editReason?: string;
}

export interface TahfizRecord {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  programmeId?: string;
  classId: string;
  className?: string;
  teacherId: string;
  teacherName?: string;
  hifzSurah: string;
  hifzFromAyah: number;
  hifzToAyah: number;
  hifzPages: number;
  currentJuz: number;
  sabkiSurah: string;
  sabkiRating: 1 | 2 | 3 | 4 | 5;
  manzilJuz: number;
  manzilRating: 1 | 2 | 3 | 4 | 5;
  revisionStatus?: string;
  memorizationStatus?: string;
  studentBehaviour?: 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'NEEDS_IMPROVEMENT';
  completionPercentage?: number;
  tajweedErrorsCount?: number;
  teacherNotes: string;
  teacherComment?: string;
}

export interface TimetablePeriod {
  id: string;
  programmeId?: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  startTime: string; // e.g. "08:00 AM"
  endTime: string;   // e.g. "09:00 AM"
  room?: string;
}

export interface AcademicEvent {
  id: string;
  term: 'Term 1' | 'Term 2' | 'Term 3';
  title: string;
  badge: string;
  badgeColor?: 'emerald' | 'amber' | 'sky' | 'purple';
  dates: string;
  description?: string;
  isPublished?: boolean;
}

export interface DirectMessageAttachment {
  id: string;
  name: string;
  size: string;
  type: 'PDF' | 'IMAGE' | 'WORD' | 'EXCEL' | 'DOC';
  url: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientStudentId: string;
  studentName: string;
  parentPhone?: string;
  programmeId?: string;
  classId?: string;
  className?: string;
  messageType:
  | 'GENERAL_NOTICE'
  | 'HOMEWORK'
  | 'ASSIGNMENT'
  | 'REMINDER'
  | 'BEHAVIOUR'
  | 'EXAMINATION'
  | 'TAHFIZ_REMINDER'
  | 'CUSTOM';
  subject: string;
  content: string;
  attachments?: DirectMessageAttachment[];
  isRead: boolean;
  isArchived?: boolean;
  createdAt: string;
}

export interface GradeRecord {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo?: string;
  programmeId?: string;
  programmeName?: string;
  classId: string;
  className?: string;
  subjectId: string;
  subjectName: string;
  teacherId?: string;
  term: string;
  session: string;
  assignmentScore?: number;
  ca1Score: number;
  ca2Score: number;
  testScore?: number;
  projectScore?: number;
  practicalScore?: number;
  examScore: number;
  totalScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  remarks: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  submissionId?: string;
  rejectionReason?: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface GradeScaleItem {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  minScore: number;
  maxScore: number;
  remark: string;
}

export interface AssessmentConfig {
  id: string;
  session: string;
  term: string;
  enableAssignment: boolean;
  maxAssignment: number;
  enableCa1: boolean;
  maxCa1: number;
  enableCa2: boolean;
  maxCa2: number;
  enableTest: boolean;
  maxTest: number;
  enableProject: boolean;
  maxProject: number;
  enablePractical: boolean;
  maxPractical: number;
  enableExam: boolean;
  maxExam: number;
  passMark: number;
  gradingScale: GradeScaleItem[];
  calcPosition: boolean;
  updatedAt?: string;
}

export interface ResultApprovalSubmission {
  id: string;
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
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  adminComments?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'ACADEMIC' | 'TAHFIZ' | 'GENERAL' | 'URGENT';
  targetRole: 'ALL' | 'TEACHERS' | 'PARENTS' | 'STUDENTS';
  targetAudienceType?: 'ALL_SCHOOL' | 'PROGRAMME' | 'CLASS';
  programmeId?: string;
  programmeName?: string;
  classId?: string;
  className?: string;
  author: string;
  pinned: boolean;
}

export interface SchoolSession {
  id: string;
  sessionName: string;
  activeTerm: 'Term 1' | 'Term 2' | 'Term 3';
  isCurrent: boolean;
}

export type ApplicationStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface AdmissionApplication {
  id: string;
  applicationNo: string;

  // Student Information
  studentFullName: string;
  studentGender: 'MALE' | 'FEMALE';
  studentDob: string;
  passportPhoto?: string;
  state: string;
  lga: string;
  studentAddress: string;
  previousSchool: string;

  // Parent Information
  parentName: string;
  parentRelationship: 'Father' | 'Mother' | 'Guardian';
  parentPhone: string;
  parentWhatsapp: string;
  parentEmail: string;
  parentOccupation: string;
  parentAddress: string;

  // Emergency Contact
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;

  // Optional Info
  medicalInformation?: string;
  remarks?: string;

  // Application Status & Metadata
  status: ApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;

  // Assigned Details upon Approval
  assignedProgrammeIds?: string[];
  assignedClassIds?: string[];
  generatedStudentId?: string;
  generatedParentId?: string;
}

export interface ReportCardTemplate {
  titleEnglish: string;
  titleArabic: string;
  subTitleEnglish: string;
  subTitleArabic: string;
  headerBgColor: string;
  headerTextColor: string;
  accentColor: string;
  tableHeaderBgColor: string;
  tableHeaderTextColor: string;
  showLogo: boolean;
  showTahfizSection: boolean;
  showAkhlaqSection: boolean;
  showSummarySection: boolean;
  showGradeLegend: boolean;
  teacherRemarkDefault: string;
  principalRemarkDefault: string;
  principalName: string;
  principalTitle: string;
  defaultSignatureUrl?: string; // Base64 Canvas data URL or image path
  signatureType: 'CANVAS' | 'IMAGE' | 'TEXT_STAMP';
  signatureText?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_REPORT_CARD_TEMPLATE: ReportCardTemplate = {
  titleEnglish: "MARKAZU UMAR BN AL-KHATTAB CENTRE FOR QUR'AN MEMORIZATION & ISLAMIC STUDIES - DANEJI",
  titleArabic: "مركز عمر بن الخطاب لتحفيظ القرآن والدراسات الإسلامية - دنيج",
  subTitleEnglish: "OFFICIAL TERMINAL ACADEMIC & TAHFIZ PROGRESS REPORT",
  subTitleArabic: "تقرير التقدم الأكاديمي والتحفيظ الرسمي",
  headerBgColor: "#042f1e",
  headerTextColor: "#ffffff",
  accentColor: "#f59e0b",
  tableHeaderBgColor: "#064e3b",
  tableHeaderTextColor: "#ffffff",
  showLogo: true,
  showTahfizSection: true,
  showAkhlaqSection: true,
  showSummarySection: true,
  showGradeLegend: true,
  teacherRemarkDefault: "Very good progress in memorization and academic performance.",
  principalRemarkDefault: "Approved for promotion. Keep up the brilliant performance in Tahfiz and Adab.",
  principalName: "Malam Umar Faruq",
  principalTitle: "School Principal & Director of Studies",
  defaultSignatureUrl: "",
  signatureType: "CANVAS",
  signatureText: "SIGNATURE",
};

export interface NewsArticle {
  id: string;
  title: string;
  category: string;
  date: string;
  summary: string;
  image?: string;
  published: boolean;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'Teachers' | 'Students' | 'Classes' | 'School Officials' | 'Islamic Events' | 'General';
  image: string;
  createdAt?: string;
}

export interface RawExcelSchoolStructureRow {
  programme: string;
  subcategory?: string;
  className: string;
  rawTeachers: string;
  rawSubjects?: string;
  notes?: string;
  rowIndex: number;
}

export interface ParsedImportTeacherItem {
  rawName: string;
  matchedTeacherId?: string;
  matchedTeacherName?: string;
  isNotFound: boolean;
}

export interface ValidatedImportRow {
  rowIndex: number;
  programmeName: string;
  programmeId?: string;
  subcategory?: string;
  className: string;
  rawTeachers: string;
  parsedTeachers: ParsedImportTeacherItem[];
  rawSubjects?: string;
  parsedSubjects: string[];
  status: 'VALID' | 'WARNING' | 'ERROR';
  statusMessage: string;
  isEmptyRow: boolean;
}

export interface ImportSchoolStructureSummary {
  programmesVerified: number;
  subcategoriesCount: number;
  classesImported: number;
  teacherAssignmentsCreated: number;
  subjectsCreated: number;
  emptyRowsSkipped: number;
  errorsCount: number;
}

export * from './communication';


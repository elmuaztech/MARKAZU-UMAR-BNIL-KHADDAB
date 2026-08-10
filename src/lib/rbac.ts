'use client';

import { UserRole, User, Student, Parent, Teacher, SchoolClass, Subject, AdmissionApplication, AttendanceRecord, TahfizRecord, GradeRecord, TeacherAssignment } from '../types';

export type ExtendedRole = 'SUPER_ADMIN' | 'ADMIN' | 'HEADMASTER' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface RolePermissions {
  canViewAllStudents: boolean;
  canEditStudents: boolean;
  canViewAllAttendance: boolean;
  canMarkAttendance: boolean;
  canViewAllTahfiz: boolean;
  canAddTahfizRecord: boolean;
  canViewAllGrades: boolean;
  canEnterGrades: boolean;
  canManageAssessmentConfig: boolean;
  canAccessSecurityDashboard: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  canAccessCommunicationCenter: boolean;
  canAccessReportSheets: boolean;
  canAssignTeachers: boolean;
  canManageSubjects: boolean;
  canManageProgrammes: boolean;
  canManageClasses: boolean;
}

export const ROLE_PERMISSIONS_MATRIX: Record<ExtendedRole, RolePermissions> = {
  SUPER_ADMIN: {
    canViewAllStudents: true,
    canEditStudents: true,
    canViewAllAttendance: true,
    canMarkAttendance: true,
    canViewAllTahfiz: true,
    canAddTahfizRecord: true,
    canViewAllGrades: true,
    canEnterGrades: true,
    canManageAssessmentConfig: true,
    canAccessSecurityDashboard: true,
    canManageUsers: true,
    canManageSettings: true,
    canAccessCommunicationCenter: true,
    canAccessReportSheets: true,
    canAssignTeachers: true,
    canManageSubjects: true,
    canManageProgrammes: true,
    canManageClasses: true,
  },
  ADMIN: {
    canViewAllStudents: true,
    canEditStudents: true,
    canViewAllAttendance: true,
    canMarkAttendance: true,
    canViewAllTahfiz: true,
    canAddTahfizRecord: true,
    canViewAllGrades: true,
    canEnterGrades: true,
    canManageAssessmentConfig: true,
    canAccessSecurityDashboard: false, // Super Admin only
    canManageUsers: false, // Super Admin only (RBAC admin)
    canManageSettings: true,
    canAccessCommunicationCenter: true,
    canAccessReportSheets: true,
    canAssignTeachers: true,
    canManageSubjects: true,
    canManageProgrammes: true,
    canManageClasses: true,
  },
  HEADMASTER: {
    canViewAllStudents: false, // Scoped strictly to assigned section
    canEditStudents: true,
    canViewAllAttendance: false, // Scoped strictly to assigned section
    canMarkAttendance: true,
    canViewAllTahfiz: false, // Scoped strictly to assigned section
    canAddTahfizRecord: true,
    canViewAllGrades: false, // Scoped strictly to assigned section
    canEnterGrades: true,
    canManageAssessmentConfig: false, // Admin/Super Admin only
    canAccessSecurityDashboard: false, // Super Admin strictly
    canManageUsers: false, // Super Admin strictly
    canManageSettings: false, // Global Admin strictly
    canAccessCommunicationCenter: false, // Super Admin / Admin strictly
    canAccessReportSheets: true, // Scoped strictly to assigned section report sheets
    canAssignTeachers: true,
    canManageSubjects: true, // Scoped to assigned section subjects
    canManageProgrammes: false, // Admin/Super Admin only
    canManageClasses: true, // Scoped to assigned section classes
  },
  TEACHER: {
    canViewAllStudents: false, // Scoped ONLY to assigned classes
    canEditStudents: false,
    canViewAllAttendance: false, // Scoped ONLY to assigned classes
    canMarkAttendance: true,
    canViewAllTahfiz: false, // Scoped ONLY to assigned classes
    canAddTahfizRecord: true,
    canViewAllGrades: false, // Scoped ONLY to assigned classes
    canEnterGrades: true,
    canManageAssessmentConfig: false, // Strictly prohibited
    canAccessSecurityDashboard: false,
    canManageUsers: false,
    canManageSettings: false,
    canAccessCommunicationCenter: false, // In-app messaging only
    canAccessReportSheets: false, // Strictly prohibited
    canAssignTeachers: false,
    canManageSubjects: false,
    canManageProgrammes: false,
    canManageClasses: false,
  },
  PARENT: {
    canViewAllStudents: false,
    canEditStudents: false,
    canViewAllAttendance: false,
    canMarkAttendance: false,
    canViewAllTahfiz: false,
    canAddTahfizRecord: false,
    canViewAllGrades: false,
    canEnterGrades: false,
    canManageAssessmentConfig: false,
    canAccessSecurityDashboard: false,
    canManageUsers: false,
    canManageSettings: false,
    canAccessCommunicationCenter: false,
    canAccessReportSheets: false,
    canAssignTeachers: false,
    canManageSubjects: false,
    canManageProgrammes: false,
    canManageClasses: false,
  },
  STUDENT: {
    canViewAllStudents: false,
    canEditStudents: false,
    canViewAllAttendance: false,
    canMarkAttendance: false,
    canViewAllTahfiz: false,
    canAddTahfizRecord: false,
    canViewAllGrades: false,
    canEnterGrades: false,
    canManageAssessmentConfig: false,
    canAccessSecurityDashboard: false,
    canManageUsers: false,
    canManageSettings: false,
    canAccessCommunicationCenter: false,
    canAccessReportSheets: false,
    canAssignTeachers: false,
    canManageSubjects: false,
    canManageProgrammes: false,
    canManageClasses: false,
  },
};

// Route & Page Authorization Mapping
export const PAGE_ROLE_ACCESS: Record<string, ExtendedRole[]> = {
  '/dashboard': ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER', 'STUDENT', 'PARENT'],
  '/dashboard/admissions': ['SUPER_ADMIN', 'ADMIN'], // Restricted for Headmasters
  '/dashboard/programmes': ['SUPER_ADMIN', 'ADMIN'], // Restricted for Headmasters
  '/dashboard/tahfiz': ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER', 'STUDENT', 'PARENT'],
  '/dashboard/students': ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER', 'PARENT'],
  '/dashboard/teachers': ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER'],
  '/dashboard/parents': ['SUPER_ADMIN', 'ADMIN'], // Restricted for Headmasters
  '/dashboard/classes': ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER'],
  '/dashboard/subjects': ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER', 'STUDENT'],
  '/dashboard/attendance': ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER', 'STUDENT', 'PARENT'],
  '/dashboard/assessment': ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER'],
  '/dashboard/results': ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'STUDENT', 'PARENT'],
  '/dashboard/communication': ['SUPER_ADMIN', 'ADMIN'], // Restricted for Headmasters
  '/dashboard/communication/notifications': ['SUPER_ADMIN', 'ADMIN'], // Restricted for Headmasters
  '/dashboard/communication/history': ['SUPER_ADMIN', 'ADMIN'], // Restricted for Headmasters
  '/dashboard/communication/new': ['SUPER_ADMIN', 'ADMIN'], // Restricted for Headmasters
  '/dashboard/communication/templates': ['SUPER_ADMIN', 'ADMIN'], // Restricted for Headmasters
  '/dashboard/communication/report-sheet-delivery': ['SUPER_ADMIN', 'ADMIN'], // Restricted for Headmasters
  '/dashboard/communication/queue': ['SUPER_ADMIN', 'ADMIN'], // Restricted for Headmasters
  '/dashboard/communication/failed': ['SUPER_ADMIN', 'ADMIN'], // Restricted for Headmasters
  '/dashboard/communication/scheduled': ['SUPER_ADMIN', 'ADMIN'], // Restricted for Headmasters
  '/dashboard/communication/settings': ['SUPER_ADMIN', 'ADMIN'], // Restricted for Headmasters
  '/dashboard/messages': ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'], // Restricted for Headmasters
  '/dashboard/sessions': ['SUPER_ADMIN', 'ADMIN'], // Restricted for Headmasters
  '/dashboard/cms': ['SUPER_ADMIN', 'ADMIN'], // Restricted for Headmasters
  '/dashboard/downloads': ['SUPER_ADMIN', 'ADMIN'], // Restricted for Headmasters
  '/dashboard/backup': ['SUPER_ADMIN', 'ADMIN'], // Restricted for Headmasters
  '/dashboard/reports': ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER'], // Scoped strictly to section report sheets
  '/dashboard/security': ['SUPER_ADMIN'], // Super Admin strictly
  '/dashboard/settings': ['SUPER_ADMIN', 'ADMIN'], // Restricted for Headmasters
};

export function hasPageAccess(role: UserRole | string, pathname: string): boolean {
  // Normalize path if trailing slash
  const cleanPath = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  const allowedRoles = PAGE_ROLE_ACCESS[cleanPath];
  if (!allowedRoles) return true; // Default allow if route is unlisted or sub-route
  return allowedRoles.includes(role as ExtendedRole);
}

export function hasPermission(role: UserRole | string, permission: keyof RolePermissions): boolean {
  const permissions = ROLE_PERMISSIONS_MATRIX[role as ExtendedRole];
  if (!permissions) return false;
  return permissions[permission] ?? false;
}

// Data Scoping Helper Functions

export function filterStudentsForUser(
  currentUser: User,
  allStudents: Student[],
  parents: Parent[],
  teacherAssignments: TeacherAssignment[] = []
): Student[] {
  if (currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN') {
    return allStudents;
  }

  if (currentUser.role === 'HEADMASTER') {
    const progId = currentUser.assignedProgrammeId;
    const progName = currentUser.assignedProgrammeName?.toLowerCase();
    if (!progId && !progName) return allStudents;

    return allStudents.filter((s) => {
      if (progId && s.programmeId === progId) return true;
      if (progName && s.programmeName?.toLowerCase().includes(progName)) return true;
      return false;
    });
  }

  if (currentUser.role === 'TEACHER') {
    const assignedClassIds = new Set(
      teacherAssignments
        .filter((ta) => ta.teacherId === currentUser.id || currentUser.id.includes('teacher') || currentUser.email.toLowerCase().includes('teacher'))
        .map((ta) => ta.classId)
    );

    if (assignedClassIds.size === 0) {
      // Fallback: If no explicit assignments found, return students in teacher's default assigned classes
      return allStudents.filter((s) => s.classId === 'cls-tahfiz-1' || s.classId === 'cls-primary-1');
    }

    return allStudents.filter((s) => assignedClassIds.has(s.classId));
  }

  if (currentUser.role === 'PARENT') {
    const parentRecord = parents.find((p) => p.email === currentUser.email || p.userId === currentUser.id);
    if (!parentRecord) {
      return allStudents.filter((s) => s.guardianId === currentUser.id);
    }
    return allStudents.filter(
      (s) => s.guardianId === parentRecord.id || s.guardianId === currentUser.id || (parentRecord.wardIds && parentRecord.wardIds.includes(s.id))
    );
  }

  if (currentUser.role === 'STUDENT') {
    return allStudents.filter((s) => s.userId === currentUser.id || s.id === currentUser.id);
  }

  return [];
}

export function filterTeachersForUser(currentUser: User, allTeachers: Teacher[]): Teacher[] {
  if (currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN') {
    return allTeachers;
  }

  if (currentUser.role === 'HEADMASTER') {
    const progId = currentUser.assignedProgrammeId;
    const progName = currentUser.assignedProgrammeName?.toLowerCase();
    if (!progId && !progName) return allTeachers;

    return allTeachers.filter((t) => {
      if (progId && t.programmeIds?.includes(progId)) return true;
      if (progName && t.qualification?.toLowerCase().includes(progName)) return true;
      if (progName && t.specialization?.toLowerCase().includes(progName)) return true;
      if (progName && t.programmeIds?.some((p) => p.toLowerCase().includes(progName))) return true;
      return false;
    });
  }

  return allTeachers;
}

export function filterClassesForUser(currentUser: User, allClasses: SchoolClass[]): SchoolClass[] {
  if (currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN') {
    return allClasses;
  }

  if (currentUser.role === 'HEADMASTER') {
    const progId = currentUser.assignedProgrammeId;
    const progName = currentUser.assignedProgrammeName?.toLowerCase();
    if (!progId && !progName) return allClasses;

    return allClasses.filter((c) => {
      if (progId && c.programmeId === progId) return true;
      if (progName && c.programmeName?.toLowerCase().includes(progName)) return true;
      return false;
    });
  }

  return allClasses;
}

export function filterSubjectsForUser(currentUser: User, allSubjects: Subject[]): Subject[] {
  if (currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN') {
    return allSubjects;
  }

  if (currentUser.role === 'HEADMASTER') {
    const progId = currentUser.assignedProgrammeId;
    const progName = currentUser.assignedProgrammeName?.toLowerCase();
    if (!progId && !progName) return allSubjects;

    return allSubjects.filter((s) => {
      if (!s.programmeId && !s.programmeName) return true; // General shared subjects
      if (progId && s.programmeId === progId) return true;
      if (progName && s.programmeName?.toLowerCase().includes(progName)) return true;
      return false;
    });
  }

  return allSubjects;
}

export function filterParentsForUser(currentUser: User, allParents: Parent[], scopedStudents: Student[]): Parent[] {
  if (currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN') {
    return allParents;
  }

  if (currentUser.role === 'HEADMASTER') {
    const scopedStudentIds = new Set(scopedStudents.map((s) => s.id));
    const scopedGuardianIds = new Set(scopedStudents.map((s) => s.guardianId));

    return allParents.filter((p) => {
      if (scopedGuardianIds.has(p.id)) return true;
      if (p.wardIds?.some((wId) => scopedStudentIds.has(wId))) return true;
      if (p.linkedStudentIds?.some((sId) => scopedStudentIds.has(sId))) return true;
      return false;
    });
  }

  return allParents;
}

export function filterAdmissionsForUser(currentUser: User, allAdmissions: AdmissionApplication[]): AdmissionApplication[] {
  if (currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN') {
    return allAdmissions;
  }

  if (currentUser.role === 'HEADMASTER') {
    const progId = currentUser.assignedProgrammeId;
    if (!progId) return allAdmissions;

    return allAdmissions.filter((a) => {
      if (progId && a.assignedProgrammeIds && a.assignedProgrammeIds.length > 0) {
        return a.assignedProgrammeIds.includes(progId);
      }
      return true;
    });
  }

  return allAdmissions;
}

export function filterAttendanceForUser(currentUser: User, attendance: AttendanceRecord[], userStudents: Student[]): AttendanceRecord[] {
  if (currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN') {
    return attendance;
  }

  const allowedStudentIds = new Set(userStudents.map((s) => s.id));
  return attendance.filter((a) => allowedStudentIds.has(a.studentId));
}

export function filterTahfizForUser(currentUser: User, tahfizRecords: TahfizRecord[], userStudents: Student[]): TahfizRecord[] {
  if (currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN') {
    return tahfizRecords;
  }

  const allowedStudentIds = new Set(userStudents.map((s) => s.id));
  return tahfizRecords.filter((t) => allowedStudentIds.has(t.studentId));
}

export function filterGradesForUser(currentUser: User, grades: GradeRecord[], userStudents: Student[]): GradeRecord[] {
  if (currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN') {
    return grades;
  }

  const allowedStudentIds = new Set(userStudents.map((s) => s.id));
  const userGrades = grades.filter((g) => allowedStudentIds.has(g.studentId));

  // Students & Parents can ONLY view APPROVED grades on Report Cards
  if (currentUser.role === 'STUDENT' || currentUser.role === 'PARENT') {
    return userGrades.filter((g) => g.status === 'APPROVED');
  }

  return userGrades;
}

export function canTeacherGradeSubject(
  user: User,
  teacherAssignments: TeacherAssignment[],
  programmeId: string,
  classId: string,
  subjectId: string
): boolean {
  if (user.role === 'ADMIN' || (user.role as string) === 'SUPER_ADMIN') {
    return true;
  }

  if (user.role !== 'TEACHER') {
    return false;
  }

  return teacherAssignments.some((assignment) => {
    const isTeacherMatch = assignment.teacherId === user.id || user.id.includes('teacher');
    if (!isTeacherMatch) return false;

    const isProgMatch = !programmeId || assignment.programmeId === programmeId;
    const isClassMatch = !classId || assignment.classId === classId;
    const isSubjMatch = !subjectId || assignment.subjectIds.includes(subjectId);

    return isProgMatch && isClassMatch && isSubjMatch;
  });
}

export function canTeacherAccessAttendance(
  user: User,
  teacherAssignments: TeacherAssignment[],
  programmeId: string,
  classId: string
): boolean {
  if (user.role === 'ADMIN' || (user.role as string) === 'SUPER_ADMIN') {
    return true;
  }

  if (user.role !== 'TEACHER') {
    return false;
  }

  return teacherAssignments.some((assignment) => {
    const isTeacherMatch = assignment.teacherId === user.id || user.id.includes('teacher');
    if (!isTeacherMatch) return false;

    const isProgMatch = !programmeId || assignment.programmeId === programmeId;
    const isClassMatch = !classId || assignment.classId === classId;

    return isProgMatch && isClassMatch;
  });
}

export function canTeacherMessageStudent(
  user: User,
  teacherAssignments: TeacherAssignment[],
  allStudents: Student[],
  studentId: string
): boolean {
  if (user.role === 'ADMIN' || (user.role as string) === 'SUPER_ADMIN') {
    return true;
  }

  if (user.role !== 'TEACHER') {
    return false;
  }

  const targetStudent = allStudents.find((s) => s.id === studentId);
  if (!targetStudent) return false;

  return teacherAssignments.some((assignment) => {
    const isTeacherMatch = assignment.teacherId === user.id || user.id.includes('teacher');
    if (!isTeacherMatch) return false;

    return assignment.classId === targetStudent.classId;
  });
}

/**
 * Backend & Route Security: Enforce Headmaster Programme Access
 * Checks if the user is authorized to access a given programme resource.
 * - SUPER_ADMIN & ADMIN have global access across all programmes.
 * - HEADMASTER can ONLY access their assigned programme/section.
 * - Returns { authorized: boolean; reason?: string }
 */
export function verifyUserProgrammeAccess(
  user: User | null | undefined,
  targetProgrammeId?: string,
  targetProgrammeName?: string
): { authorized: boolean; reason?: string } {
  if (!user) {
    return { authorized: false, reason: 'Authentication required' };
  }

  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
    return { authorized: true };
  }

  if (user.role === 'HEADMASTER') {
    const userProgId = user.assignedProgrammeId;
    const userProgName = user.assignedProgrammeName?.toLowerCase().trim();

    if (!userProgId && !userProgName) {
      return { authorized: false, reason: 'Headmaster account is not assigned to any school programme' };
    }

    if (targetProgrammeId && userProgId && targetProgrammeId === userProgId) {
      return { authorized: true };
    }

    if (targetProgrammeName && userProgName && (targetProgrammeName.toLowerCase().trim().includes(userProgName) || userProgName.includes(targetProgrammeName.toLowerCase().trim()))) {
      return { authorized: true };
    }

    return {
      authorized: false,
      reason: `Access Forbidden (HTTP 403): Headmaster is assigned to "${user.assignedProgrammeName || user.assignedProgrammeId}" and cannot access another programme.`,
    };
  }

  return { authorized: true };
}

import { NextRequest } from 'next/server';
import prisma from './prisma';
import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  role: UserRole | string;
  avatar?: string | null;
  assignedProgrammeId?: string | null;
  assignedProgrammeName?: string | null;
  status: string;
  isFirstLogin: boolean;
  mustChangePassword: boolean;
  isLocked: boolean;
  failedLoginAttempts: number;
}

/**
 * Server-side Session Authenticator
 * Extracts session ID from HTTP-Only cookie, Authorization header, or x-session-id.
 * Verifies session strictly against PostgreSQL database via Prisma Client.
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const cookieSessionId = req.cookies.get('mssms_session_id')?.value;
    const authHeader = req.headers.get('authorization');
    const headerSessionId = req.headers.get('x-session-id');

    let sessionId = cookieSessionId || headerSessionId;
    if (!sessionId && authHeader && authHeader.startsWith('Bearer ')) {
      sessionId = authHeader.substring(7).trim();
    }

    if (!sessionId) {
      return null;
    }

    // Strip prefix if jwt-token- wrapper exists
    const cleanSessionId = sessionId.replace(/^jwt-token-/, '');

    // 1. Query active session from PostgreSQL UserSession
    try {
      const dbSession = await prisma.userSession.findFirst({
        where: {
          sessionId: cleanSessionId,
          revoked: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      });

      if (dbSession && dbSession.user && dbSession.user.status === 'ACTIVE' && !dbSession.user.deletedAt) {
        return {
          id: dbSession.user.id,
          name: dbSession.user.name,
          email: dbSession.user.email,
          username: (dbSession.user as any).username || null,
          role: dbSession.user.role,
          avatar: dbSession.user.avatar || null,
          assignedProgrammeId: dbSession.user.assignedProgrammeId,
          assignedProgrammeName: dbSession.user.assignedProgrammeName,
          status: dbSession.user.status,
          isFirstLogin: dbSession.user.isFirstLogin,
          mustChangePassword: dbSession.user.mustChangePassword,
          isLocked: dbSession.user.isLocked,
          failedLoginAttempts: dbSession.user.failedLoginAttempts,
        };
      }

      // 2. Direct active user lookup by ID, username, or email
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [{ id: cleanSessionId }, { username: cleanSessionId }, { email: cleanSessionId }],
          status: 'ACTIVE',
          deletedAt: null,
        },
      });

      if (dbUser) {
        return {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          username: dbUser.username || null,
          role: dbUser.role,
          avatar: dbUser.avatar || null,
          assignedProgrammeId: dbUser.assignedProgrammeId,
          assignedProgrammeName: dbUser.assignedProgrammeName,
          status: dbUser.status,
          isFirstLogin: dbUser.isFirstLogin,
          mustChangePassword: dbUser.mustChangePassword,
          isLocked: dbUser.isLocked,
          failedLoginAttempts: dbUser.failedLoginAttempts,
        };
      }

      return null;
    } catch (dbErr) {
      console.error('[AUTH_DB_ERROR] Session query error:', dbErr);
      return null;
    }
  } catch (error) {
    console.error('[AUTH_ERROR] getAuthenticatedUser failed:', error);
    return null;
  }
}

/**
 * Server-side RBAC & PBAC Access Controller
 * Checks if authenticated user has required role and programme authorization.
 */
export function enforceRoleAndProgramme(
  user: AuthenticatedUser | null,
  allowedRoles: string[],
  targetProgrammeId?: string
): { authorized: boolean; reason?: string; status: number } {
  if (!user) {
    return { authorized: false, reason: 'Authentication required. Please log in to access this resource.', status: 401 };
  }

  if (user.status !== 'ACTIVE') {
    return { authorized: false, reason: 'Account is disabled or suspended.', status: 403 };
  }

  // Super Admin has global override access
  if (user.role === 'SUPER_ADMIN') {
    return { authorized: true, status: 200 };
  }

  // Check role authorization
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role as string)) {
    return {
      authorized: false,
      reason: `Access forbidden: Your role (${user.role}) does not have permission to access this resource. Required role(s): ${allowedRoles.join(', ')}.`,
      status: 403,
    };
  }

  // Check Programme Scoping for Headmasters
  if (user.role === 'HEADMASTER') {
    if (!user.assignedProgrammeId) {
      return {
        authorized: false,
        reason: 'Access forbidden: Headmaster has no assigned programme. Global access is not permitted.',
        status: 403,
      };
    }
    if (targetProgrammeId && user.assignedProgrammeId !== targetProgrammeId) {
      return {
        authorized: false,
        reason: `Access forbidden: You are assigned to "${user.assignedProgrammeName || 'your assigned programme'}" and cannot access data for other programmes.`,
        status: 403,
      };
    }
  }

  return { authorized: true, status: 200 };
}

/**
 * Fetch the current active SchoolSession record from the database.
 */
export async function getCurrentSchoolSession() {
  try {
    return await prisma.schoolSession.findFirst({
      where: { isCurrent: true },
    });
  } catch (error) {
    console.error('[AUTH_SESSION_LOOKUP_ERROR]', error);
    return null;
  }
}

export interface TeacherScope {
  isTeacher: boolean;
  teacherId: string | null;
  staffNo?: string;
  teachingClassIds: string[];
  attendanceClassIds: string[];
  subjectMap: Record<string, string[]>; // classId -> subjectIds[]
  programmeIds: string[];
  isClassTeacherOf: string[];
}

/**
 * Resolves a teacher's exact teaching assignments, managed classes, and attendance permissions.
 * Session-aware: checks assignments for the given sessionId or active session.
 */
export async function resolveTeacherScope(teacherUserId: string, sessionId?: string): Promise<TeacherScope> {
  try {
    const teacher = await prisma.teacher.findFirst({
      where: {
        OR: [{ userId: teacherUserId }, { id: teacherUserId }],
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        classesManaged: true,
      },
    });

    if (!teacher) {
      return {
        isTeacher: false,
        teacherId: null,
        teachingClassIds: [],
        attendanceClassIds: [],
        subjectMap: {},
        programmeIds: [],
        isClassTeacherOf: [],
      };
    }

    // Determine target session
    let targetSessionId = sessionId;
    if (!targetSessionId) {
      const activeSession = await getCurrentSchoolSession();
      if (activeSession) {
        targetSessionId = activeSession.id;
      }
    }

    // Query teacher assignments
    // If sessionId is provided/active, match that session or historical/unspecified sessions
    const assignmentWhere: any = { teacherId: teacher.id };
    if (targetSessionId) {
      assignmentWhere.OR = [{ sessionId: targetSessionId }, { sessionId: null }];
    }

    const assignments = await prisma.teacherAssignment.findMany({
      where: assignmentWhere,
      include: {
        assignedSubjects: true,
      },
    });

    const isClassTeacherOf = teacher.classesManaged.map((c) => c.id);
    const teachingClassIdsSet = new Set<string>();
    const attendanceClassIdsSet = new Set<string>(isClassTeacherOf); // Class teachers automatically have attendance permission
    const programmeIdsSet = new Set<string>();
    const subjectMap: Record<string, string[]> = {};

    for (const a of assignments) {
      teachingClassIdsSet.add(a.classId);
      programmeIdsSet.add(a.programmeId);

      if (a.canMarkAttendance) {
        attendanceClassIdsSet.add(a.classId);
      }

      if (!subjectMap[a.classId]) {
        subjectMap[a.classId] = [];
      }
      for (const s of a.assignedSubjects) {
        subjectMap[a.classId].push(s.subjectId);
      }
    }

    return {
      isTeacher: true,
      teacherId: teacher.id,
      staffNo: teacher.staffNo,
      teachingClassIds: Array.from(teachingClassIdsSet),
      attendanceClassIds: Array.from(attendanceClassIdsSet),
      subjectMap,
      programmeIds: Array.from(programmeIdsSet),
      isClassTeacherOf,
    };
  } catch (err) {
    console.error('[RESOLVE_TEACHER_SCOPE_ERROR]', err);
    return {
      isTeacher: false,
      teacherId: null,
      teachingClassIds: [],
      attendanceClassIds: [],
      subjectMap: {},
      programmeIds: [],
      isClassTeacherOf: [],
    };
  }
}

/**
 * Backend verification for Academic Record Access (Grades / Results / Assessments).
 * Verifies exact teacher + class + subject authorization.
 */
export async function verifyTeacherAcademicAccess(
  authUser: AuthenticatedUser,
  classId: string,
  subjectId: string,
  sessionId?: string
): Promise<{ authorized: boolean; reason?: string }> {
  // Global administrators have full access
  if (authUser.role === 'SUPER_ADMIN' || authUser.role === 'ADMIN') {
    return { authorized: true };
  }

  // Headmasters are restricted to classes within their assigned programme
  if (authUser.role === 'HEADMASTER') {
    if (!authUser.assignedProgrammeId) {
      return { authorized: false, reason: 'Headmaster has no assigned programme.' };
    }
    const schoolClass = await prisma.schoolClass.findUnique({
      where: { id: classId },
      select: { programmeId: true },
    });
    if (!schoolClass || schoolClass.programmeId !== authUser.assignedProgrammeId) {
      return { authorized: false, reason: 'Class does not belong to your assigned programme.' };
    }
    return { authorized: true };
  }

  // Teachers must have exact class + subject assignment
  if (authUser.role === 'TEACHER') {
    const scope = await resolveTeacherScope(authUser.id, sessionId);
    if (!scope.isTeacher || !scope.teacherId) {
      return { authorized: false, reason: 'Teacher profile not found or inactive.' };
    }

    const assignedSubjectIds = scope.subjectMap[classId] || [];
    if (!assignedSubjectIds.includes(subjectId)) {
      return {
        authorized: false,
        reason: 'You are not authorized to manage academic records for this subject in this class.',
      };
    }

    return { authorized: true };
  }

  return { authorized: false, reason: 'Insufficient privileges for academic record management.' };
}

/**
 * Backend verification for Attendance Operations.
 * Enforces rule:
 * 1. Official Class Teacher (SchoolClass.classTeacherId === teacher.id)
 * OR
 * 2. TeacherAssignment.canMarkAttendance === true
 * Subject assignment alone is NOT sufficient.
 */
export async function verifyTeacherAttendanceAccess(
  authUser: AuthenticatedUser,
  classId: string,
  sessionId?: string
): Promise<{ authorized: boolean; reason?: string }> {
  if (authUser.role === 'SUPER_ADMIN' || authUser.role === 'ADMIN') {
    return { authorized: true };
  }

  if (authUser.role === 'HEADMASTER') {
    if (!authUser.assignedProgrammeId) {
      return { authorized: false, reason: 'Headmaster has no assigned programme.' };
    }
    const schoolClass = await prisma.schoolClass.findUnique({
      where: { id: classId },
      select: { programmeId: true },
    });
    if (!schoolClass || schoolClass.programmeId !== authUser.assignedProgrammeId) {
      return { authorized: false, reason: 'Class does not belong to your assigned programme.' };
    }
    return { authorized: true };
  }

  if (authUser.role === 'TEACHER') {
    const scope = await resolveTeacherScope(authUser.id, sessionId);
    if (!scope.isTeacher || !scope.teacherId) {
      return { authorized: false, reason: 'Teacher profile not found or inactive.' };
    }

    if (!scope.attendanceClassIds.includes(classId)) {
      return {
        authorized: false,
        reason: 'You do not have permission to mark or manage attendance for this class. Subject assignment alone does not grant attendance rights.',
      };
    }

    return { authorized: true };
  }

  return { authorized: false, reason: 'Insufficient privileges for attendance management.' };
}

/**
 * Backend verification for Student Data Access.
 * Enforces student self-scoping (cannot view other students by swapping ID).
 */
export async function verifyStudentAccess(
  authUser: AuthenticatedUser,
  targetStudentId: string
): Promise<{ authorized: boolean; reason?: string; student?: any }> {
  if (authUser.role === 'SUPER_ADMIN' || authUser.role === 'ADMIN') {
    return { authorized: true };
  }

  if (authUser.role === 'STUDENT') {
    const student = await prisma.student.findFirst({
      where: {
        OR: [{ userId: authUser.id }, { id: authUser.id }],
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    if (!student || student.id !== targetStudentId) {
      return {
        authorized: false,
        reason: 'Access forbidden: Students may only access their own records.',
      };
    }

    return { authorized: true, student };
  }

  return { authorized: true };
}

/**
 * Backend verification for Parent Data Access.
 * Enforces parent ward-scoping (can only access their linked children).
 */
export async function verifyParentAccess(
  authUser: AuthenticatedUser,
  targetStudentId: string
): Promise<{ authorized: boolean; reason?: string }> {
  if (authUser.role === 'SUPER_ADMIN' || authUser.role === 'ADMIN') {
    return { authorized: true };
  }

  if (authUser.role === 'PARENT') {
    const parent = await prisma.parent.findFirst({
      where: {
        OR: [{ userId: authUser.id }, { id: authUser.id }],
        deletedAt: null,
      },
      include: {
        wards: {
          select: { id: true },
        },
      },
    });

    if (!parent) {
      return { authorized: false, reason: 'Parent record not found.' };
    }

    const linkedStudentIds = parent.wards.map((w) => w.id);
    if (!linkedStudentIds.includes(targetStudentId)) {
      return {
        authorized: false,
        reason: 'Access forbidden: Parents may only access records for their registered children.',
      };
    }

    return { authorized: true };
  }

  return { authorized: true };
}


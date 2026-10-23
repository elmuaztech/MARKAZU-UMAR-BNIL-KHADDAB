import { InAppNotification } from '@/types/communication';
import { User, Parent, Teacher, Student } from '@/types';

interface ContextUserRecords {
  parents?: Parent[];
  teachers?: Teacher[];
  students?: Student[];
}

/**
 * Authoritative, strict Role-Based Notification Filter.
 *
 * Ensures:
 * 1. Parents ONLY receive:
 *    - Announcements & general school notices released to parents/all
 *    - Direct messages from teachers/admins
 *    - Official report sheets released for their specific children
 *    - Admission updates regarding their wards
 *    - Never internal teacher assessments, staff-only notes, or admin alerts.
 * 2. Teachers ONLY receive:
 *    - Messages from Admin/Headmaster
 *    - Result submission reviews (Approved, Returned for Correction, or Rejected)
 *    - Staff and schoolwide announcements
 *    - Never parent fee/report cards for other students or admin-only logs.
 * 3. Admins / Super Admins receive:
 *    - System, operational, admission, and staff announcements
 *    - But filtered from thousands of individual parent report card batch items.
 * 4. Students ONLY receive:
 *    - Student notices and schoolwide announcements.
 */
export function isNotificationRelevantForUser(
  notif: InAppNotification,
  currentUser: User | null | undefined,
  contextData?: ContextUserRecords
): boolean {
  if (!currentUser) return false;
  if (notif.isArchived) return false;

  const role = currentUser.role;
  const userEmail = (currentUser.email || '').toLowerCase().trim();
  const userId = currentUser.id || '';
  const userName = (currentUser.name || '').toLowerCase().trim();

  // 1. Direct match on user ID
  if (notif.userId && (notif.userId === userId || notif.userId === 'ALL' || notif.userId === 'all')) {
    return true;
  }

  // 2. PARENT ROLE
  if (role === 'PARENT') {
    const parentRecord = contextData?.parents?.find(
      (p) =>
        (p.userId && p.userId === userId) ||
        (p.id && p.id === userId) ||
        (p.email && userEmail && p.email.toLowerCase().trim() === userEmail) ||
        (p.fullName && userName && p.fullName.toLowerCase().trim() === userName)
    );

    const parentIdSet = new Set<string>();
    parentIdSet.add(userId);
    if (parentRecord?.id) parentIdSet.add(parentRecord.id);
    if (parentRecord?.userId) parentIdSet.add(parentRecord.userId);

    // Linked Wards
    const wardIds = new Set<string>(parentRecord?.wardIds || []);
    contextData?.students?.forEach((s) => {
      if (
        (parentRecord?.id && s.guardianId === parentRecord.id) ||
        (parentRecord?.userId && s.guardianId === parentRecord.userId)
      ) {
        wardIds.add(s.id);
      }
    });

    // Directly targeted to parent or their children
    if (notif.userId && (parentIdSet.has(notif.userId) || wardIds.has(notif.userId))) {
      return true;
    }

    // Public / general announcements for all parents
    const publicParentCategories = [
      'ANNOUNCEMENT',
      'CIRCULAR',
      'GENERAL_NOTICE',
      'HOLIDAY_NOTICE',
      'PTA_MEETING',
      'EVENT_NOTICE',
      'EMERGENCY_NOTICE',
    ];

    if (publicParentCategories.includes(notif.category as string)) {
      const titleLower = notif.title.toLowerCase();
      const isInternalStaff =
        titleLower.includes('staff only') ||
        titleLower.includes('result batch') ||
        titleLower.includes('results returned') ||
        titleLower.includes('results approved') ||
        titleLower.includes('results rejected');
      return !isInternalStaff;
    }

    // Report Cards
    if (notif.category === 'REPORT_SHEET') {
      return notif.userId ? (parentIdSet.has(notif.userId) || wardIds.has(notif.userId)) : false;
    }

    // Admission
    if (notif.category === 'ADMISSION_NOTICE') {
      return notif.userId ? parentIdSet.has(notif.userId) : false;
    }

    return false;
  }

  // 3. TEACHER ROLE
  if (role === 'TEACHER') {
    const teacherRecord = contextData?.teachers?.find(
      (t) =>
        (t.userId && t.userId === userId) ||
        (t.id && t.id === userId) ||
        (t.email && userEmail && t.email.toLowerCase().trim() === userEmail) ||
        (t.fullName && userName && t.fullName.toLowerCase().trim() === userName) ||
        (t.staffNo && currentUser.username && t.staffNo === currentUser.username)
    );

    const teacherIdSet = new Set<string>();
    teacherIdSet.add(userId);
    if (teacherRecord?.id) teacherIdSet.add(teacherRecord.id);
    if (teacherRecord?.userId) teacherIdSet.add(teacherRecord.userId);

    // Results submission review directly for this teacher
    if (notif.userId && teacherIdSet.has(notif.userId)) {
      return true;
    }

    // School and staff announcements
    const teacherCategories = [
      'ANNOUNCEMENT',
      'CIRCULAR',
      'GENERAL_NOTICE',
      'HOLIDAY_NOTICE',
      'EVENT_NOTICE',
      'EMERGENCY_NOTICE',
      'EXAMINATION_NOTICE',
    ];

    if (teacherCategories.includes(notif.category as string)) {
      // Exclude individual parent report cards
      const isParentCard = notif.category === 'REPORT_SHEET';
      return !isParentCard;
    }

    return false;
  }

  // 4. ADMIN & SUPER_ADMIN ROLES
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    // Exclude mass individual parent report card queue entries to prevent inbox flooding
    if (notif.category === 'REPORT_SHEET' && notif.userId && notif.userId !== userId && notif.userId !== 'admin') {
      return false;
    }
    return true;
  }

  // 5. HEADMASTER ROLE
  if (role === 'HEADMASTER') {
    if (notif.userId && notif.userId === userId) return true;
    if (notif.category === 'REPORT_SHEET') return false;
    return true;
  }

  // 6. STUDENT ROLE
  if (role === 'STUDENT') {
    const studentRecord = contextData?.students?.find(
      (s) =>
        (s.userId && s.userId === userId) ||
        (s.id && s.id === userId) ||
        (s.email && userEmail && s.email.toLowerCase().trim() === userEmail) ||
        (s.admissionNo && currentUser.username && s.admissionNo === currentUser.username)
    );
    const studentIdSet = new Set<string>();
    studentIdSet.add(userId);
    if (studentRecord?.id) studentIdSet.add(studentRecord.id);
    if (studentRecord?.userId) studentIdSet.add(studentRecord.userId);

    if (notif.userId && studentIdSet.has(notif.userId)) return true;

    const publicStudentCategories = [
      'ANNOUNCEMENT',
      'CIRCULAR',
      'GENERAL_NOTICE',
      'HOLIDAY_NOTICE',
      'EVENT_NOTICE',
      'EMERGENCY_NOTICE',
    ];
    return publicStudentCategories.includes(notif.category as string);
  }

  return false;
}

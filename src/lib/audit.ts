export interface AuditEntry {
  id: string;
  action: string; // LOGIN, LOGOUT, FAILED_LOGIN, PASSWORD_CHANGE, ACCOUNT_LOCKOUT, USER_CREATED, ATTENDANCE_MARKED, RESULT_UPDATED, SECURITY_SETTING_CHANGED
  performedBy: string;
  userRole: string;
  details: string;
  ipAddress: string;
  browser?: string;
  os?: string;
  device?: string;
  affectedRecord?: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  timestamp: string;
}

export function createAuditLogEntry(
  action:
    | 'TEACHER_ASSIGNED'
    | 'TEACHER_REMOVED'
    | 'PROGRAMME_CHANGED'
    | 'CLASS_CHANGED'
    | 'SUBJECT_ADDED'
    | 'SUBJECT_REMOVED'
    | 'AUTHENTICATION_SUCCESS'
    | 'ACCOUNT_CREATED'
    | 'SECURITY_SETTING_CHANGED'
    | 'RESULT_CREATED'
    | 'RESULT_UPDATED'
    | 'RESULT_SUBMITTED'
    | 'RESULT_APPROVED'
    | 'RESULT_REJECTED'
    | 'RESULT_RETURNED'
    | 'ASSESSMENT_CONFIG_UPDATED'
    | 'ATTENDANCE_CREATED'
    | 'ATTENDANCE_EDITED'
    | 'ATTENDANCE_DELETED'
    | 'ATTENDANCE_ADMIN_OVERRIDE'
    | 'TAHFIZ_UPDATED'
    | 'TEACHER_MESSAGE_SENT'
    | 'TEACHER_MESSAGE_DELETED'
    | 'NOTIFICATION_READ',
  performedBy: string,
  userRole: string,
  details: string,
  affectedRecord?: string,
  status: 'SUCCESS' | 'FAILURE' | 'WARNING' = 'SUCCESS'
): AuditEntry {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    action,
    performedBy,
    userRole,
    details,
    ipAddress: '197.210.227.14',
    browser: typeof window !== 'undefined' ? window.navigator.userAgent : 'Chrome 128 (Windows)',
    os: 'Windows 11',
    device: 'Desktop',
    affectedRecord,
    status,
    timestamp: new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

export const INITIAL_AUDIT_LOGS: AuditEntry[] = [];


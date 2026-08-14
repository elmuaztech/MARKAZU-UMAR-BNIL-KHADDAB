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
  if (user.role === 'HEADMASTER' && targetProgrammeId) {
    if (user.assignedProgrammeId && user.assignedProgrammeId !== targetProgrammeId) {
      return {
        authorized: false,
        reason: `Access forbidden: You are assigned to "${user.assignedProgrammeName}" and cannot access data for other programmes.`,
        status: 403,
      };
    }
  }

  return { authorized: true, status: 200 };
}

import { NextRequest } from 'next/server';
import prisma from './prisma';
import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  role: UserRole | string;
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
 * Verifies session against PostgreSQL database via Prisma Client.
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

    // Query active session from Prisma DB
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
        assignedProgrammeId: dbSession.user.assignedProgrammeId,
        assignedProgrammeName: dbSession.user.assignedProgrammeName,
        status: dbSession.user.status,
        isFirstLogin: dbSession.user.isFirstLogin,
        mustChangePassword: dbSession.user.mustChangePassword,
        isLocked: dbSession.user.isLocked,
        failedLoginAttempts: dbSession.user.failedLoginAttempts,
      };
    }

    // Fallback lookup: Search directly by user ID if session ID matches user format
    if (cleanSessionId.startsWith('usr-') || cleanSessionId.startsWith('MUBK-')) {
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: cleanSessionId },
            { username: cleanSessionId },
          ],
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
          assignedProgrammeId: dbUser.assignedProgrammeId,
          assignedProgrammeName: dbUser.assignedProgrammeName,
          status: dbUser.status,
          isFirstLogin: dbUser.isFirstLogin,
          mustChangePassword: dbUser.mustChangePassword,
          isLocked: dbUser.isLocked,
          failedLoginAttempts: dbUser.failedLoginAttempts,
        };
      }
    }

    return null;
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

  if (!allowedRoles.includes(user.role)) {
    return { authorized: false, reason: `Access Forbidden (HTTP 403): Role "${user.role}" is not authorized for this resource.`, status: 403 };
  }

  // Headmaster Programme Scoping Rule
  if (user.role === 'HEADMASTER') {
    const assignedProg = user.assignedProgrammeId;
    if (!assignedProg) {
      return { authorized: false, reason: 'Headmaster account has no assigned programme in the system database.', status: 403 };
    }

    if (targetProgrammeId && targetProgrammeId !== assignedProg) {
      return {
        authorized: false,
        reason: `Access Forbidden (HTTP 403): Headmaster is restricted to programme "${user.assignedProgrammeName || assignedProg}" and cannot access another section.`,
        status: 403,
      };
    }
  }

  return { authorized: true, status: 200 };
}

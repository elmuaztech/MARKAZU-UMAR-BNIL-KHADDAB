import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from './prisma';
import { UserRole } from '@prisma/client';
import { PAGE_ROLE_ACCESS, ExtendedRole } from './rbac';

export interface ServerAuthenticatedUser {
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
 * Authoritative Server Session Resolver for Next.js Server Components & Layouts
 * Queries PostgreSQL prisma.userSession to authenticate the caller.
 * Runs strictly in Node.js runtime (NOT on Edge).
 */
export async function getServerSessionUser(): Promise<ServerAuthenticatedUser | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('mssms_session_id')?.value;

    if (!sessionCookie) {
      return null;
    }

    const cleanSessionId = sessionCookie.replace(/^jwt-token-/, '');

    // 1. Verify active database session
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
        username: dbSession.user.username || null,
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

    // If no active, unrevoked database session was found, deny authentication.
    return null;
  } catch (error) {
    console.error('[SERVER_AUTH_ERROR] Failed to resolve server session:', error);
    return null;
  }
}

/**
 * Server-Side Authoritative Page Route Validator
 */
export function verifyServerPageAccess(role: string, pathname: string): { authorized: boolean; redirectUrl?: string } {
  if (role === 'GUEST') {
    return { authorized: false, redirectUrl: '/login' };
  }

  const cleanPath = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;

  // Exact route match
  let allowedRoles = PAGE_ROLE_ACCESS[cleanPath];

  // If no exact match, check prefix match (e.g. /dashboard/students/[id])
  if (!allowedRoles) {
    for (const [routePattern, roles] of Object.entries(PAGE_ROLE_ACCESS)) {
      if (cleanPath.startsWith(routePattern) && routePattern !== '/dashboard') {
        allowedRoles = roles;
        break;
      }
    }
  }

  // If still unlisted and within dashboard, default to SUPER_ADMIN/ADMIN only
  if (!allowedRoles) {
    if (cleanPath.startsWith('/headmaster')) {
      allowedRoles = ['SUPER_ADMIN', 'HEADMASTER'];
    } else if (cleanPath.startsWith('/dashboard')) {
      allowedRoles = ['SUPER_ADMIN', 'ADMIN'];
    }
  }

  if (!allowedRoles || !allowedRoles.includes(role as ExtendedRole)) {
    return { authorized: false, redirectUrl: '/dashboard' };
  }

  return { authorized: true };
}

/**
 * Enforces Authoritative Page Authorization in Server Components & Layouts
 * Redirects server-side BEFORE any HTML, client bundle, or sensitive data props are sent.
 */
export async function requireServerPageAuth(customPathname?: string): Promise<ServerAuthenticatedUser> {
  const user = await getServerSessionUser();
  if (!user) {
    const targetPath = customPathname || headers().get('x-current-pathname') || '/dashboard';
    redirect(`/login?redirect=${encodeURIComponent(targetPath)}`);
  }

  const pathname = customPathname || headers().get('x-current-pathname') || '/dashboard';
  const check = verifyServerPageAccess(user.role, pathname);

  if (!check.authorized) {
    redirect(check.redirectUrl || '/dashboard');
  }

  return user;
}

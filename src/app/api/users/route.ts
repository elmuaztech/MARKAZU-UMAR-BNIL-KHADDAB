import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '../../../lib/auth';
import { hashPassword, generateTemporaryPassword } from '../../../lib/security';
import { sendSystemEmail } from '../../../lib/emailService';
import { getAllServerUsers, createServerUser, readServerDatabase, findServerUser } from '../../../lib/serverDb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let users: any[] = [];
    let querySuccess = false;

    // 1. Try PostgreSQL Prisma if connected
    try {
      users = await prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          avatar: true,
          assignedProgrammeId: true,
          assignedProgrammeName: true,
          status: true,
          isFirstLogin: true,
          isLocked: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });
      querySuccess = true;
    } catch (dbErr) {
      console.warn('[GET_USERS] Postgres query failed, falling back to serverDb:', dbErr);
    }

    if (!querySuccess) {
      users = getAllServerUsers();
    }

    return NextResponse.json({ users, total: users.length });
  } catch (error: any) {
    console.error('[GET_USERS_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const role = body.role || 'TEACHER';
    const phone = (body.phone || '').trim();
    const avatar = body.avatar || null;
    const assignedProgrammeId = body.assignedProgrammeId || null;
    const assignedProgrammeName = body.assignedProgrammeName || null;

    if (!name || !email) {
      return NextResponse.json({ error: 'Full Name and Email address are required.' }, { status: 400 });
    }

    // Duplicate Email Prevention: Reject creation if email already exists in system
    let existingUser: any = null;
    try {
      existingUser = await prisma.user.findFirst({
        where: {
          email: { equals: email, mode: 'insensitive' },
          deletedAt: null,
        },
      });
    } catch (e) {}

    if (!existingUser) {
      existingUser = findServerUser(email);
    }

    if (existingUser) {
      return NextResponse.json(
        { error: `An account with the email address "${email}" already exists in the system. Duplicate email addresses are not allowed.` },
        { status: 400 }
      );
    }

    // Auto-generate Unique User ID / Username (e.g., MUBK-HM-0001, MUBK-TEA-0001)
    let rolePrefix = 'USR';
    if (role === 'HEADMASTER') rolePrefix = 'MUBK-HM';
    else if (role === 'TEACHER') rolePrefix = 'MUBK-TEA';
    else if (role === 'ADMIN') rolePrefix = 'MUBK-ADM';
    else if (role === 'PARENT') rolePrefix = 'MUBK-PAR';
    else if (role === 'STUDENT') rolePrefix = 'MUBK-STU';

    const db = readServerDatabase();
    const roleCount = db.users.filter((u) => u.role === role && !u.deletedAt).length;
    const formattedNum = (roleCount + 1).toString().padStart(4, '0');
    const generatedUsername = body.username || `${rolePrefix}-${formattedNum}`;

    // Generate initial temporary password or use provided password/hash
    let tempPassword = body.tempPassword || body.password || '';
    let passwordHash = '';

    if (body.passwordHash) {
      passwordHash = body.passwordHash;
    } else if (body.password && body.password.startsWith('argon2id$')) {
      passwordHash = body.password;
    } else if (tempPassword) {
      passwordHash = hashPassword(tempPassword);
    } else {
      tempPassword = generateTemporaryPassword();
      passwordHash = hashPassword(tempPassword);
    }

    // 1. Save to persistent serverDb
    const serverUser = createServerUser({
      username: generatedUsername,
      name,
      email,
      password: passwordHash,
      role,
      phone,
      avatar,
      assignedProgrammeId: role === 'HEADMASTER' ? assignedProgrammeId : undefined,
      assignedProgrammeName: role === 'HEADMASTER' ? assignedProgrammeName : undefined,
      status: 'ACTIVE',
      isFirstLogin: body.isFirstLogin ?? true,
      mustChangePassword: body.mustChangePassword ?? true,
    });

    // 2. Also save to PostgreSQL database if available
    let prismaUser: any = null;
    try {
      prismaUser = await prisma.user.create({
        data: {
          username: generatedUsername,
          name,
          email,
          password: passwordHash,
          role: role as any,
          phone,
          avatar,
          assignedProgrammeId: role === 'HEADMASTER' ? assignedProgrammeId : undefined,
          assignedProgrammeName: role === 'HEADMASTER' ? assignedProgrammeName : undefined,
          status: 'ACTIVE',
          isFirstLogin: true,
          mustChangePassword: true,
        },
      });
    } catch (dbErr) {
      // Postgres offline, serverDb handles persistence
    }

    const createdUser = prismaUser || serverUser || { id: generatedUsername, name, email, role };

    // Dispatch Welcome Email with Credentials
    const portalUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://markazu-umar-bnil-khaddab-.vercel.app');
    
    sendSystemEmail({
      to: email,
      recipientName: name,
      subject: `Welcome to Markazu Umar bn Al-Khattab Centre for Islamic Studies Portal - Your Account Credentials (${generatedUsername})`,
      template: 'WELCOME_NEW_ACCOUNT',
      metadata: {
        username: generatedUsername,
        tempPassword,
        portalUrl: `${portalUrl}/login`,
        role: role,
        assignedProgramme: assignedProgrammeName || undefined,
      },
    }).catch(() => {});

    return NextResponse.json(
      {
        message: `Account created successfully for ${name}. Credentials sent to ${email}.`,
        user: {
          id: createdUser.id,
          username: generatedUsername,
          name: name,
          email: email,
          role: role,
          tempPassword,
          assignedProgrammeId,
          assignedProgrammeName,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[CREATE_USER_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to create user account' }, { status: 400 });
  }
}

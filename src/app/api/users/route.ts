import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '../../../lib/auth';
import { hashPassword, generateTemporaryPassword } from '../../../lib/security';
import { sendSystemEmail } from '../../../lib/emailService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const users = await prisma.user.findMany({
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

    return NextResponse.json({ users, total: users.length });
  } catch (error: any) {
    console.error('[GET_USERS_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const body = await req.json();
    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const role = body.role || 'TEACHER';
    const phone = (body.phone || '').trim();
    const assignedProgrammeId = body.assignedProgrammeId || null;
    const assignedProgrammeName = body.assignedProgrammeName || null;

    if (!name || !email) {
      return NextResponse.json({ error: 'Full Name and Email address are required.' }, { status: 400 });
    }

    // Check duplicate email in DB
    const existing = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (existing) {
      return NextResponse.json({ error: `User account with email "${email}" already exists in the database.` }, { status: 400 });
    }

    // Auto-generate Unique User ID / Username (e.g., MUBK-HM-0001, MUBK-TEA-0001)
    let rolePrefix = 'USR';
    if (role === 'HEADMASTER') rolePrefix = 'MUBK-HM';
    else if (role === 'TEACHER') rolePrefix = 'MUBK-TEA';
    else if (role === 'ADMIN') rolePrefix = 'MUBK-ADM';
    else if (role === 'PARENT') rolePrefix = 'MUBK-PAR';
    else if (role === 'STUDENT') rolePrefix = 'MUBK-STU';

    const roleCount = await prisma.user.count({ where: { role: role as any } });
    const formattedNum = (roleCount + 1).toString().padStart(4, '0');
    const generatedUsername = `${rolePrefix}-${formattedNum}`;

    // Generate initial temporary password
    const tempPassword = body.tempPassword || generateTemporaryPassword();
    const passwordHash = hashPassword(tempPassword);

    // Save to PostgreSQL database
    const newUser = await prisma.user.create({
      data: {
        username: generatedUsername,
        name,
        email,
        password: passwordHash,
        role: role as any,
        phone,
        assignedProgrammeId: role === 'HEADMASTER' ? assignedProgrammeId : undefined,
        assignedProgrammeName: role === 'HEADMASTER' ? assignedProgrammeName : undefined,
        status: 'ACTIVE',
        isFirstLogin: true,
        mustChangePassword: true,
      },
    });

    // Dispatch Welcome Email with Credentials
    const portalUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://markazu-umar-bnil-khaddab-.vercel.app');
    
    sendSystemEmail({
      to: newUser.email,
      recipientName: newUser.name,
      subject: `Welcome to Markazu Umar Portal - Your Account Credentials (${generatedUsername})`,
      template: 'WELCOME_NEW_ACCOUNT',
      metadata: {
        username: generatedUsername,
        tempPassword,
        portalUrl: `${portalUrl}/login`,
        role: newUser.role,
        assignedProgramme: newUser.assignedProgrammeName || undefined,
      },
    }).catch(() => {});

    return NextResponse.json(
      {
        message: `Account created successfully for ${newUser.name}. Credentials sent to ${newUser.email}.`,
        user: {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          tempPassword,
          assignedProgrammeId: newUser.assignedProgrammeId,
          assignedProgrammeName: newUser.assignedProgrammeName,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[CREATE_USER_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to create user account' }, { status: 400 });
  }
}

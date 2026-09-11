import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const parents = await prisma.parent.findMany({
      where: { deletedAt: null },
      include: {
        wards: {
          include: {
            schoolClass: true,
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    return NextResponse.json({
      parents,
      total: parents.length,
    });
  } catch (error: any) {
    console.error('[GET_PARENTS_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch parents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const body = await req.json();
    const email = (body.email || `parent.${Date.now()}@markazuumar.edu.ng`).toLowerCase().trim();
    const phone = (body.phone || '08000000000').trim();
    const fullName = (body.fullName || 'Parent Guardian').trim();

    // Check if Parent or User record already exists (Active or Deactivated)
    let existingAnyUser = await prisma.user.findFirst({
      where: {
        email: email,
      },
      include: {
        parent: true,
      },
    });

    if (existingAnyUser) {
      const isDeactivated = existingAnyUser.deletedAt !== null || existingAnyUser.status === 'DEACTIVATED';
      if (isDeactivated) {
        return NextResponse.json(
          {
            isDeactivated: true,
            error: 'This email belongs to a previously deactivated account.',
            message: 'This email belongs to a previously deactivated account.',
            deactivatedUser: {
              id: existingAnyUser.id,
              name: existingAnyUser.name,
              username: existingAnyUser.username,
              email: existingAnyUser.email,
              role: existingAnyUser.role,
              status: existingAnyUser.status,
              deletedAt: existingAnyUser.deletedAt,
              parent: existingAnyUser.parent ? { id: existingAnyUser.parent.id } : null,
            },
          },
          { status: 409 }
        );
      }
    }

    let linkedUser = existingAnyUser && !existingAnyUser.deletedAt ? existingAnyUser : null;

    const newParent = await prisma.$transaction(async (tx) => {
      let targetUserId = linkedUser?.id || body.userId;

      if (!targetUserId) {
        const generatedUsername = body.username || `MUBK-PAR-${Date.now().toString().slice(-4)}`;
        const passHash = body.passwordHash || '$2a$10$wT.L6G2cQkG6K1hK.zYy.O6qQ1.Q2.Q3.Q4';
        const createdUser = await tx.user.create({
          data: {
            username: generatedUsername,
            name: fullName,
            email: email,
            password: passHash,
            role: 'PARENT',
            phone: phone,
            status: 'ACTIVE',
            isFirstLogin: true,
            mustChangePassword: true,
          },
        });
        targetUserId = createdUser.id;
      }

      return await tx.parent.create({
        data: {
          id: body.id,
          fullName: fullName,
          email: email,
          phone: phone,
          occupation: body.occupation || 'Parent',
          address: body.address || 'Kano, Nigeria',
          userId: targetUserId,
        },
      });
    });

    return NextResponse.json(
      {
        message: 'Parent created successfully',
        parent: newParent,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[CREATE_PARENT_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to create parent' }, { status: 400 });
  }
}

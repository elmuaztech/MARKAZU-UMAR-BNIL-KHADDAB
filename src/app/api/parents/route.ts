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

    if (!body.fullName || !body.email || !body.phone) {
      return NextResponse.json({ error: 'Full Name, Email, and Phone are required.' }, { status: 400 });
    }

    const created = await prisma.parent.create({
      data: {
        id: body.id,
        fullName: body.fullName,
        email: body.email.toLowerCase().trim(),
        phone: body.phone,
        occupation: body.occupation || null,
        address: body.address || null,
        userId: body.userId || null,
      },
    });

    return NextResponse.json(
      {
        message: 'Parent created successfully in database',
        parent: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[CREATE_PARENT_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to create parent' }, { status: 400 });
  }
}

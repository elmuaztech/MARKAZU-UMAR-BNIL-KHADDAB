import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER', 'TEACHER', 'PARENT', 'STUDENT']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const { searchParams } = new URL(req.url);
    const programmeId = searchParams.get('programmeId');

    const whereClause: any = {};
    if (programmeId) {
      whereClause.programmeId = programmeId;
    }

    const classes = await prisma.schoolClass.findMany({
      where: whereClause,
      include: {
        programme: true,
        classTeacher: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      classes,
      total: classes.length,
    });
  } catch (error: any) {
    console.error('[GET_CLASSES_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch classes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const body = await req.json();

    if (!body.name || !body.category || !body.section) {
      return NextResponse.json({ error: 'Class Name, Category, and Section are required.' }, { status: 400 });
    }

    if (authUser?.role === 'HEADMASTER') {
      const assignedProg = authUser.assignedProgrammeId;
      if (body.programmeId && assignedProg && body.programmeId !== assignedProg) {
        return NextResponse.json(
          { error: `Access Forbidden (HTTP 403): Headmaster cannot create classes in another programme section.` },
          { status: 403 }
        );
      }
      body.programmeId = assignedProg;
    }

    const newClass = await prisma.schoolClass.create({
      data: {
        name: body.name,
        category: body.category, // TAHFIZ, ISLAMIYYA_PRIMARY, ISLAMIYYA_SECONDARY
        section: body.section,
        subcategory: body.subcategory || null,
        capacity: Number(body.capacity || 30),
        programmeId: body.programmeId || null,
        classTeacherId: body.classTeacherId || null,
      },
    });

    return NextResponse.json(
      {
        message: 'Class created successfully',
        class: newClass,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[CREATE_CLASS_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to create class' }, { status: 400 });
  }
}

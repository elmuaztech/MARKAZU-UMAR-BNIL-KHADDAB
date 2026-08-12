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
    const classId = searchParams.get('classId');
    const programmeId = searchParams.get('programmeId');

    const whereClause: any = {};
    if (classId) whereClause.classId = classId;
    if (programmeId) whereClause.programmeId = programmeId;

    const subjects = await prisma.subject.findMany({
      where: whereClause,
      include: {
        programme: true,
        schoolClass: true,
      },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({
      subjects,
      total: subjects.length,
    });
  } catch (error: any) {
    console.error('[GET_SUBJECTS_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch subjects' }, { status: 500 });
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

    if (!body.name || !body.code) {
      return NextResponse.json({ error: 'Subject Name and Subject Code are required.' }, { status: 400 });
    }

    if (authUser?.role === 'HEADMASTER') {
      const assignedProg = authUser.assignedProgrammeId;
      if (body.programmeId && assignedProg && body.programmeId !== assignedProg) {
        return NextResponse.json(
          { error: `Access Forbidden (HTTP 403): Headmaster cannot create subjects in another programme section.` },
          { status: 403 }
        );
      }
      body.programmeId = assignedProg;
    }

    const newSubject = await prisma.subject.create({
      data: {
        name: body.name,
        arabicName: body.arabicName || null,
        code: body.code,
        category: body.category || 'GENERAL', // TAHFIZ, ISLAMIC, GENERAL
        description: body.description || null,
        programmeId: body.programmeId || null,
        classId: body.classId || null,
        status: body.status || 'ACTIVE',
        displayOrder: Number(body.displayOrder || 1),
      },
    });

    return NextResponse.json(
      {
        message: 'Subject created successfully',
        subject: newSubject,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[CREATE_SUBJECT_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to create subject' }, { status: 400 });
  }
}

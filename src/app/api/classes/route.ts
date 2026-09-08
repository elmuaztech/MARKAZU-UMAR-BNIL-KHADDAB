import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';
import { getAllServerClasses, createServerClass } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);

    const { searchParams } = new URL(req.url);
    const programmeId = searchParams.get('programmeId');

    const whereClause: any = {};
    if (programmeId) {
      whereClause.programmeId = programmeId;
    } else if (authUser?.role === 'HEADMASTER' && authUser.assignedProgrammeId) {
      whereClause.programmeId = authUser.assignedProgrammeId;
    }

    const classes = await prisma.schoolClass.findMany({
      where: whereClause,
      include: {
        programme: true,
        classTeacher: true,
        _count: {
          select: { students: { where: { deletedAt: null } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    const mapped = classes.map((c: any) => ({
      id: c.id,
      name: c.name,
      class_name_english: c.name,
      class_name_arabic: c.classTeacher?.full_name_arabic || '',
      category: c.category,
      section: c.section,
      subcategory: c.subcategory || undefined,
      capacity: c.capacity,
      studentCount: c._count?.students || 0,
      classTeacherId: c.classTeacherId || undefined,
      classTeacherName: c.classTeacher?.fullName || undefined,
      classTeacherNameArabic: c.classTeacher?.full_name_arabic || undefined,
      programmeId: c.programmeId || '',
      programmeName: c.programme?.nameEnglish || 'Programme',
      programmeNameArabic: c.programme?.nameArabic || '',
      programme: c.programme,
      classTeacher: c.classTeacher,
    }));

    return NextResponse.json({
      classes: mapped,
      total: mapped.length,
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

    const className = (body.name || body.class_name_english || '').trim();
    if (!className) {
      return NextResponse.json({ error: 'Class Name is required.' }, { status: 400 });
    }

    let category = body.category || 'TAHFIZ';
    if (!['TAHFIZ', 'ISLAMIYYA_PRIMARY', 'ISLAMIYYA_SECONDARY'].includes(category)) {
      category = 'TAHFIZ';
    }
    const section = (body.section || body.subcategory || 'Section A').trim();

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

    // 1. Save to persistent serverDb
    const serverClass = createServerClass({
      id: body.id,
      name: className,
      category: category,
      section: section,
      subcategory: body.subcategory,
      capacity: Number(body.capacity || 30),
      programmeId: body.programmeId,
      classTeacherId: body.classTeacherId,
    });

    // 2. Persist in PostgreSQL Prisma database
    let prismaClass: any = null;
    try {
      prismaClass = await prisma.schoolClass.create({
        data: {
          id: serverClass.id,
          name: className,
          category: category as any,
          section: section,
          subcategory: body.subcategory || null,
          capacity: Number(body.capacity || 30),
          programmeId: body.programmeId || null,
          classTeacherId: body.classTeacherId || null,
        },
        include: {
          programme: true,
          classTeacher: true,
        },
      });
    } catch (dbErr) {
      console.warn('[CREATE_CLASS] Postgres write warning, saved to serverDb:', dbErr);
    }

    const created = prismaClass || serverClass;

    return NextResponse.json(
      {
        message: 'Class created successfully',
        class: {
          id: created.id,
          name: created.name,
          class_name_english: created.name,
          category: created.category,
          section: created.section,
          subcategory: created.subcategory || undefined,
          capacity: created.capacity,
          studentCount: 0,
          classTeacherId: created.classTeacherId || undefined,
          classTeacherName: created.classTeacher?.fullName || undefined,
          programmeId: created.programmeId || '',
          programmeName: created.programme?.nameEnglish || body.programmeName || 'Programme',
          programme: created.programme,
          classTeacher: created.classTeacher,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[CREATE_CLASS_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to create class' }, { status: 400 });
  }
}

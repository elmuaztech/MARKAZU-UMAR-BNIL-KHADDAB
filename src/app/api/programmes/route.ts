import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '../../../lib/auth';
import { getAllServerProgrammes, createServerProgramme } from '../../../lib/serverDb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const programmes = await prisma.programme.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({
      programmes,
      total: programmes.length,
    });
  } catch (error: any) {
    console.error('[GET_PROGRAMMES_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch programmes' }, { status: 500 });
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

    if (!body.programme_code && !body.code) {
      return NextResponse.json({ error: 'Programme Code is required.' }, { status: 400 });
    }

    const nameEng = body.programme_name_english || body.nameEnglish || body.name || '';
    if (!nameEng) {
      return NextResponse.json({ error: 'Programme English Name is required.' }, { status: 400 });
    }

    // 1. Save to persistent serverDb
    const serverProg = createServerProgramme({
      id: body.id,
      programme_code: body.programme_code || body.code,
      programme_name_english: nameEng,
      programme_name_arabic: body.programme_name_arabic || body.nameArabic || '',
      programme_name: nameEng,
      hasSubcategories: body.hasSubcategories,
      subcategories: body.subcategories,
      status: body.status || 'Active',
      display_order: body.display_order || body.displayOrder || 1,
    });

    // 2. Try PostgreSQL Prisma save
    let prismaProg: any = null;
    try {
      prismaProg = await prisma.programme.create({
        data: {
          id: serverProg.id,
          code: body.programme_code || body.code,
          nameEnglish: nameEng,
          nameArabic: body.programme_name_arabic || body.nameArabic || null,
          description: body.description || null,
          hasSubcategories: !!body.hasSubcategories,
          subcategories: body.subcategories ? JSON.stringify(body.subcategories) : null,
          status: body.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE',
          displayOrder: Number(body.display_order || body.displayOrder || 1),
        },
      });
    } catch (dbErr) {
      console.warn('[CREATE_PROGRAMME] Postgres write warning, saved to serverDb:', dbErr);
    }

    const created = prismaProg || serverProg;

    return NextResponse.json(
      {
        message: 'Programme created successfully in database',
        programme: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[CREATE_PROGRAMME_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to create programme' }, { status: 400 });
  }
}

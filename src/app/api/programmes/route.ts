import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '../../../lib/auth';
import { getAllServerProgrammes, createServerProgramme } from '../../../lib/serverDb';

export const dynamic = 'force-dynamic';

function formatProgrammeResponse(p: any) {
  let subcats: string[] = [];
  if (p.subcategories) {
    try {
      subcats = typeof p.subcategories === 'string' ? JSON.parse(p.subcategories) : p.subcategories;
    } catch (e) {
      subcats = [];
    }
  }
  return {
    id: p.id,
    code: p.code || p.programme_code,
    programme_code: p.code || p.programme_code,
    nameEnglish: p.nameEnglish || p.programme_name_english || p.name || '',
    programme_name_english: p.nameEnglish || p.programme_name_english || p.name || '',
    nameArabic: p.nameArabic || p.programme_name_arabic || '',
    programme_name_arabic: p.nameArabic || p.programme_name_arabic || '',
    programme_name: p.nameEnglish || p.programme_name_english || p.name || '',
    name: p.nameEnglish || p.programme_name_english || p.name || '',
    description: p.description || '',
    hasSubcategories: !!p.hasSubcategories,
    subcategories: subcats,
    status: p.status === 'ACTIVE' || p.status === 'Active' ? 'Active' : 'Inactive',
    displayOrder: p.displayOrder || p.display_order || 1,
    display_order: p.displayOrder || p.display_order || 1,
    createdAt: p.createdAt || p.created_at,
    created_at: p.createdAt || p.created_at,
    updatedAt: p.updatedAt || p.updated_at,
    updated_at: p.updatedAt || p.updated_at,
  };
}

export async function GET(req: NextRequest) {
  try {
    const programmes = await prisma.programme.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    const formatted = programmes.map(formatProgrammeResponse);

    return NextResponse.json({
      programmes: formatted,
      total: formatted.length,
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

    const progCode = (body.programme_code || body.code || '').trim();
    if (!progCode) {
      return NextResponse.json({ error: 'Programme Code is required.' }, { status: 400 });
    }

    const nameEng = (body.programme_name_english || body.nameEnglish || body.name || '').trim();
    if (!nameEng) {
      return NextResponse.json({ error: 'Programme English Name is required.' }, { status: 400 });
    }

    // 1. Save to persistent serverDb
    const serverProg = createServerProgramme({
      id: body.id,
      programme_code: progCode,
      programme_name_english: nameEng,
      programme_name_arabic: body.programme_name_arabic || body.nameArabic || '',
      programme_name: nameEng,
      hasSubcategories: body.hasSubcategories,
      subcategories: body.subcategories,
      status: body.status || 'Active',
      display_order: body.display_order || body.displayOrder || 1,
    });

    // 2. Persist in PostgreSQL Prisma database
    let prismaProg: any = null;
    try {
      prismaProg = await prisma.programme.create({
        data: {
          id: serverProg.id,
          code: progCode,
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

    const created = formatProgrammeResponse(prismaProg || serverProg);

    return NextResponse.json(
      {
        message: 'Programme created successfully',
        programme: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[CREATE_PROGRAMME_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to create programme' }, { status: 400 });
  }
}

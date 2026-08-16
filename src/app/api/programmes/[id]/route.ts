import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '../../../../lib/auth';
import { updateServerProgramme, deleteServerProgramme } from '../../../../lib/serverDb';

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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const { id } = params;
    const body = await req.json();

    // 1. Update in persistent serverDb
    const serverProg = updateServerProgramme(id, body);

    // 2. Update in Postgres Prisma
    let prismaProg: any = null;
    try {
      const updateData: any = {};
      if (body.programme_code || body.code) updateData.code = (body.programme_code || body.code).trim();
      if (body.programme_name_english || body.nameEnglish || body.name) {
        updateData.nameEnglish = (body.programme_name_english || body.nameEnglish || body.name).trim();
      }
      if (body.programme_name_arabic !== undefined || body.nameArabic !== undefined) {
        updateData.nameArabic = (body.programme_name_arabic || body.nameArabic || '').trim() || null;
      }
      if (body.description !== undefined) updateData.description = body.description;
      if (body.hasSubcategories !== undefined) updateData.hasSubcategories = !!body.hasSubcategories;
      if (body.subcategories !== undefined) {
        updateData.subcategories = Array.isArray(body.subcategories) ? JSON.stringify(body.subcategories) : (typeof body.subcategories === 'string' ? body.subcategories : null);
      }
      if (body.status !== undefined) updateData.status = (body.status === 'Inactive' || body.status === 'INACTIVE') ? 'INACTIVE' : 'ACTIVE';
      if (body.display_order !== undefined || body.displayOrder !== undefined) {
        updateData.displayOrder = Number(body.display_order || body.displayOrder);
      }

      prismaProg = await prisma.programme.update({
        where: { id },
        data: updateData,
      });
    } catch (dbErr) {
      console.warn('[UPDATE_PROGRAMME] Postgres write warning, updated in serverDb:', dbErr);
    }

    const updated = formatProgrammeResponse(prismaProg || serverProg);

    return NextResponse.json({
      message: 'Programme updated successfully in database',
      programme: updated,
    });
  } catch (error: any) {
    console.error('[UPDATE_PROGRAMME_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to update programme' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const { id } = params;

    // 1. Delete from persistent serverDb
    deleteServerProgramme(id);

    // 2. Delete from Postgres Prisma with safe unlinking
    try {
      // Unlink any classes linked to this programme before deletion
      await prisma.schoolClass.updateMany({
        where: { programmeId: id },
        data: { programmeId: null },
      }).catch(() => {});

      await prisma.programme.delete({
        where: { id },
      });
    } catch (dbErr) {
      console.warn('[DELETE_PROGRAMME] Postgres write warning, deleted from serverDb:', dbErr);
    }

    return NextResponse.json({
      message: 'Programme deleted successfully from database',
    });
  } catch (error: any) {
    console.error('[DELETE_PROGRAMME_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to delete programme' }, { status: 400 });
  }
}

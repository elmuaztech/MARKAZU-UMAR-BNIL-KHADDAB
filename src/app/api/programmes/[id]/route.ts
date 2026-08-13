import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '../../../../lib/auth';
import { updateServerProgramme, deleteServerProgramme } from '../../../../lib/serverDb';

export const dynamic = 'force-dynamic';

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

    // 2. Update in Postgres Prisma if connected
    let prismaProg: any = null;
    try {
      const updateData: any = {};
      if (body.programme_code || body.code) updateData.code = body.programme_code || body.code;
      if (body.programme_name_english || body.nameEnglish || body.name) updateData.nameEnglish = body.programme_name_english || body.nameEnglish || body.name;
      if (body.programme_name_arabic !== undefined) updateData.nameArabic = body.programme_name_arabic;
      if (body.hasSubcategories !== undefined) updateData.hasSubcategories = !!body.hasSubcategories;
      if (body.subcategories !== undefined) updateData.subcategories = JSON.stringify(body.subcategories);
      if (body.status !== undefined) updateData.status = body.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE';

      prismaProg = await prisma.programme.update({
        where: { id },
        data: updateData,
      });
    } catch (dbErr) {
      console.warn('[UPDATE_PROGRAMME] Postgres write warning, updated in serverDb:', dbErr);
    }

    const updated = prismaProg || serverProg;

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

    // 2. Delete from Postgres Prisma if connected
    try {
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

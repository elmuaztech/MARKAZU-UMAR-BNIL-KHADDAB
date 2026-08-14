import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

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

    const updateData: any = {};
    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.email !== undefined) updateData.email = body.email.toLowerCase().trim();
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.occupation !== undefined) updateData.occupation = body.occupation;
    if (body.address !== undefined) updateData.address = body.address;

    const updated = await prisma.parent.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Parent updated successfully in database',
      parent: updated,
    });
  } catch (error: any) {
    console.error('[UPDATE_PARENT_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to update parent' }, { status: 400 });
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

    await prisma.parent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      message: 'Parent deleted successfully from database',
    });
  } catch (error: any) {
    console.error('[DELETE_PARENT_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to delete parent' }, { status: 400 });
  }
}

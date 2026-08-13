import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAllServerAnnouncements, createServerAnnouncement } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let announcements: any[] = [];
    let querySuccess = false;

    try {
      announcements = await prisma.announcement.findMany({
        orderBy: { date: 'desc' },
      });
      querySuccess = true;
    } catch (dbErr) {
      console.warn('[GET_ANNOUNCEMENTS] Postgres query failed, falling back to serverDb:', dbErr);
    }

    if (!querySuccess || announcements.length === 0) {
      announcements = getAllServerAnnouncements();
    }

    return NextResponse.json({
      announcements,
      total: announcements.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch announcements' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.title || !body.content) {
      return NextResponse.json({ error: 'Title and Content are required.' }, { status: 400 });
    }

    // 1. Save to persistent serverDb JSON database
    const serverAnn = createServerAnnouncement({
      id: body.id,
      title: body.title,
      content: body.content,
      category: body.category || 'GENERAL',
      targetRole: body.targetRole || 'ALL',
      author: body.author || 'Admin',
      pinned: body.pinned || false,
      date: body.date,
    });

    // 2. Try Postgres Prisma create
    let prismaAnn: any = null;
    try {
      prismaAnn = await prisma.announcement.create({
        data: {
          id: serverAnn.id,
          title: body.title,
          content: body.content,
          category: body.category || 'GENERAL',
          targetRole: body.targetRole || 'ALL',
          author: body.author || 'Admin',
          pinned: body.pinned || false,
          date: body.date ? new Date(body.date) : new Date(),
        },
      });
    } catch (dbErr) {
      console.warn('[CREATE_ANNOUNCEMENT] Postgres write warning, saved to serverDb:', dbErr);
    }

    const created = prismaAnn || serverAnn;

    return NextResponse.json(
      {
        message: 'Announcement published successfully and saved permanently',
        announcement: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

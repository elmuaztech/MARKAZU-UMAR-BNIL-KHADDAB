import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let config = await prisma.assessmentConfig.findFirst();

    if (!config) {
      config = await prisma.assessmentConfig.create({
        data: {
          session: '2023/2024',
          term: 'Term 1',
          enableAssignment: true,
          maxAssignment: 10,
          enableCa1: true,
          maxCa1: 20,
          enableCa2: true,
          maxCa2: 20,
          enableTest: false,
          maxTest: 10,
          enableProject: false,
          maxProject: 10,
          enablePractical: false,
          maxPractical: 10,
          enableExam: true,
          maxExam: 50,
          passMark: 40,
          gradingScale: JSON.stringify([
            { grade: 'A', minScore: 75, maxScore: 100, remark: 'Distinction' },
            { grade: 'B', minScore: 60, maxScore: 74.99, remark: 'Very Good' },
            { grade: 'C', minScore: 50, maxScore: 59.99, remark: 'Good' },
            { grade: 'D', minScore: 40, maxScore: 49.99, remark: 'Pass' },
            { grade: 'F', minScore: 0, maxScore: 39.99, remark: 'Fail' },
          ]),
          calcPosition: true,
        },
      });
    }

    return NextResponse.json({
      status: 200,
      message: 'Assessment configuration retrieved successfully',
      data: config,
    });
  } catch (error: any) {
    console.error('[GET_ASSESSMENT_CONFIG_ERROR]', error);
    return NextResponse.json({ status: 500, message: error.message || 'Failed to retrieve assessment configuration' }, { status: 500 });
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
    const existing = await prisma.assessmentConfig.findFirst();

    const data: any = {
      session: body.session || '2023/2024',
      term: body.term || 'Term 1',
      enableAssignment: body.enableAssignment !== undefined ? body.enableAssignment : true,
      maxAssignment: Number(body.maxAssignment ?? 10),
      enableCa1: body.enableCa1 !== undefined ? body.enableCa1 : true,
      maxCa1: Number(body.maxCa1 ?? 20),
      enableCa2: body.enableCa2 !== undefined ? body.enableCa2 : true,
      maxCa2: Number(body.maxCa2 ?? 20),
      enableTest: body.enableTest !== undefined ? body.enableTest : false,
      maxTest: Number(body.maxTest ?? 10),
      enableProject: body.enableProject !== undefined ? body.enableProject : false,
      maxProject: Number(body.maxProject ?? 10),
      enablePractical: body.enablePractical !== undefined ? body.enablePractical : false,
      maxPractical: Number(body.maxPractical ?? 10),
      enableExam: body.enableExam !== undefined ? body.enableExam : true,
      maxExam: Number(body.maxExam ?? 50),
      passMark: Number(body.passMark ?? 40),
      gradingScale: typeof body.gradingScale === 'string' ? body.gradingScale : JSON.stringify(body.gradingScale || []),
      calcPosition: body.calcPosition !== undefined ? body.calcPosition : true,
    };

    let updated: any;
    if (existing) {
      updated = await prisma.assessmentConfig.update({
        where: { id: existing.id },
        data,
      });
    } else {
      updated = await prisma.assessmentConfig.create({
        data,
      });
    }

    return NextResponse.json({
      status: 200,
      message: 'Assessment configuration updated successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('[POST_ASSESSMENT_CONFIG_ERROR]', error);
    return NextResponse.json({ status: 500, message: error.message || 'Internal server error updating assessment config' }, { status: 500 });
  }
}

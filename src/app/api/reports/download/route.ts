import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, resolveTeacherScope } from '@/lib/auth';
import PDFDocument from 'pdfkit';

export const dynamic = 'force-dynamic';

/**
 * Secure Ephemeral Report Card Download API
 * Generates official PDF report cards in-memory and streams directly to user's device.
 * ZERO permanent files stored on VPS disk, public folder, or Cloudflare R2.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please log in to access report cards.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const sessionIdParam = searchParams.get('sessionId');
    const termParam = searchParams.get('term');
    const format = searchParams.get('format') || 'pdf'; // 'pdf' or 'json'

    if (!studentId) {
      return NextResponse.json({ success: false, error: 'Student ID is required.' }, { status: 400 });
    }

    // 1. Fetch student and relationship details
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        schoolClass: {
          select: { id: true, name: true, section: true, programmeId: true },
        },
        parent: {
          select: { id: true, userId: true, fullName: true, phone: true },
        },
      },
    });

    if (!student || student.deletedAt) {
      return NextResponse.json({ success: false, error: 'Student record not found.' }, { status: 404 });
    }

    // 2. Authoritative Relationship & Role Verification
    if (authUser.role === 'PARENT') {
      const parentRecord = await prisma.parent.findFirst({
        where: { OR: [{ userId: authUser.id }, { id: authUser.id }], deletedAt: null },
        include: { wards: { select: { id: true } } },
      });

      const linkedWardIds = parentRecord?.wards.map((w) => w.id) || [];
      const isLinkedChild = linkedWardIds.includes(student.id) || student.guardianId === parentRecord?.id;

      if (!isLinkedChild) {
        return NextResponse.json({
          success: false,
          error: 'Access Denied: You are not authorized to view or download report cards for this child.',
        }, { status: 403 });
      }
    } else if (authUser.role === 'STUDENT') {
      const selfStudent = await prisma.student.findFirst({
        where: { OR: [{ userId: authUser.id }, { id: authUser.id }], deletedAt: null },
        select: { id: true },
      });

      if (!selfStudent || selfStudent.id !== student.id) {
        return NextResponse.json({
          success: false,
          error: 'Access Denied: You may only access your own academic report card.',
        }, { status: 403 });
      }
    } else if (authUser.role === 'TEACHER') {
      const scope = await resolveTeacherScope(authUser.id);
      const teacherClasses = Array.from(new Set([...scope.teachingClassIds, ...scope.attendanceClassIds]));
      if (!teacherClasses.includes(student.classId)) {
        return NextResponse.json({
          success: false,
          error: 'Access Denied: This child is not enrolled in your assigned classes.',
        }, { status: 403 });
      }
    } else if (authUser.role === 'HEADMASTER') {
      const assignedProg = authUser.assignedProgrammeId;
      if (!assignedProg || student.programmeId !== assignedProg) {
        return NextResponse.json({
          success: false,
          error: 'Access Denied: This child does not belong to your assigned section.',
        }, { status: 403 });
      }
    }

    // 3. Resolve academic session and term
    let targetSessionId = sessionIdParam;
    let targetSessionName = '';
    let targetTerm = termParam;

    if (!targetSessionId || !targetTerm) {
      const activeSession = await prisma.schoolSession.findFirst({
        where: { isCurrent: true },
      });
      if (!targetSessionId) targetSessionId = activeSession?.id || null;
      if (!targetSessionName) targetSessionName = activeSession?.sessionName || 'Current Session';
      if (!targetTerm) targetTerm = activeSession?.activeTerm || 'Term 1';
    } else {
      const sessionRec = await prisma.schoolSession.findUnique({ where: { id: targetSessionId } });
      targetSessionName = sessionRec?.sessionName || 'Academic Session';
    }

    // 4. Fetch grade records for the child
    const gradeWhere: any = {
      studentId: student.id,
      term: targetTerm,
    };

    if (targetSessionId) {
      gradeWhere.sessionId = targetSessionId;
    }

    const grades = await prisma.gradeRecord.findMany({
      where: gradeWhere,
      include: {
        subject: { select: { id: true, name: true, code: true, arabicName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 5. Verify Report Release Status
    // Parents and Students can only view or download if report is officially RELEASED
    const isStaff = authUser.role === 'SUPER_ADMIN' || authUser.role === 'ADMIN' || authUser.role === 'HEADMASTER' || authUser.role === 'TEACHER';
    const isReleased = grades.length > 0 && grades.some((g) => g.isReleased === true);

    if (!isStaff && !isReleased) {
      return NextResponse.json({
        success: false,
        notReady: true,
        title: 'Report not available yet',
        message: "You'll be notified when your child's report is ready.",
      }, { status: 404 });
    }

    // Filter to approved grades only
    const approvedGrades = isStaff ? grades : grades.filter((g) => g.status === 'APPROVED');

    if (approvedGrades.length === 0) {
      return NextResponse.json({
        success: false,
        notReady: true,
        title: 'Report not available yet',
        message: "You'll be notified when your child's report is ready.",
      }, { status: 404 });
    }

    // If format is JSON (used by View Report modal/client)
    if (format === 'json') {
      return NextResponse.json({
        success: true,
        student: {
          id: student.id,
          fullName: student.fullName,
          admissionNo: student.admissionNo,
          className: student.schoolClass?.name || 'Class',
          guardianName: student.parent?.fullName || 'Guardian',
          hifzProgress: {
            juzCompleted: student.juzCompleted,
            currentSurah: student.currentSurah,
            currentAyah: student.currentAyah,
          },
          akhlaqRating: student.akhlaqRating,
        },
        session: {
          sessionName: targetSessionName,
          activeTerm: targetTerm,
        },
        grades: approvedGrades,
        isReleased,
      });
    }

    // 6. Generate Ephemeral In-Memory PDF (Zero Disk Writes)
    const pdfBuffer = await generateInMemoryReportPdf(student, approvedGrades, targetSessionName, targetTerm);

    const safeChildName = student.fullName.replace(/[^a-zA-Z0-9]/g, '_');
    const safeTerm = targetTerm.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Report_Card_${safeChildName}_${safeTerm}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error: any) {
    console.error('[REPORT_DOWNLOAD_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Report card generation encountered an error.' }, { status: 500 });
  }
}

/**
 * Pure In-Memory PDF Generation using PDFKit
 * Lightweight, fast, and does NOT touch disk or filesystem.
 */
function generateInMemoryReportPdf(
  student: any,
  grades: any[],
  sessionName: string,
  termName: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Report Card - ${student.fullName}`,
          Author: "Markazu Umar bn Al-Khattab Centre for Qur'an & Islamic Studies",
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Header Banner
      doc.rect(40, 40, 515, 75).fill('#042f1e');
      doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold')
        .text("MARKAZU UMAR BN AL-KHATTAB CENTRE", 45, 50, { align: 'center', width: 505 });
      doc.fontSize(9).font('Helvetica')
        .text("FOR QUR'AN MEMORIZATION & ISLAMIC STUDIES — DANEJI, KANO", 45, 66, { align: 'center', width: 505 });
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#f59e0b')
        .text(`OFFICIAL TERMINAL REPORT CARD — ${termName.toUpperCase()} (${sessionName})`, 45, 84, { align: 'center', width: 505 });

      // Student Biodata Box
      doc.rect(40, 125, 515, 60).fill('#f0fdf4').stroke('#86efac');
      doc.fillColor('#064e3b').fontSize(8).font('Helvetica-Bold');

      doc.text('CHILD NAME:', 50, 135).font('Helvetica').fillColor('#0f172a').text(student.fullName, 120, 135);
      doc.font('Helvetica-Bold').fillColor('#064e3b').text('ADMISSION NO:', 320, 135).font('Helvetica').fillColor('#0f172a').text(student.admissionNo, 410, 135);

      doc.font('Helvetica-Bold').fillColor('#064e3b').text('CLASS:', 50, 152).font('Helvetica').fillColor('#0f172a').text(student.schoolClass?.name || 'Assigned Class', 120, 152);
      doc.font('Helvetica-Bold').fillColor('#064e3b').text('GUARDIAN:', 320, 152).font('Helvetica').fillColor('#0f172a').text(student.parent?.fullName || 'Registered Parent', 410, 152);

      doc.font('Helvetica-Bold').fillColor('#064e3b').text('HIFZ PROGRESS:', 50, 169).font('Helvetica').fillColor('#0f172a').text(`${student.juzCompleted || 0} / 30 Juz Memorized`, 120, 169);
      doc.font('Helvetica-Bold').fillColor('#064e3b').text('AKHLAQ (CONDUCT):', 320, 169).font('Helvetica').fillColor('#0f172a').text(student.akhlaqRating || 'EXCELLENT', 410, 169);

      // Academic Performance Table Header
      let y = 195;
      doc.rect(40, y, 515, 22).fill('#064e3b');
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('SUBJECT', 50, y + 6, { width: 170 });
      doc.text('CA1 (20)', 230, y + 6, { width: 50, align: 'center' });
      doc.text('CA2 (20)', 285, y + 6, { width: 50, align: 'center' });
      doc.text('EXAM (60)', 340, y + 6, { width: 55, align: 'center' });
      doc.text('TOTAL', 400, y + 6, { width: 45, align: 'center' });
      doc.text('GRADE', 450, y + 6, { width: 40, align: 'center' });
      doc.text('REMARK', 495, y + 6, { width: 55, align: 'center' });

      // Table Rows
      y += 22;
      let totalObtained = 0;
      doc.font('Helvetica').fontSize(8);

      grades.forEach((g, index) => {
        const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, y, 515, 18).fill(rowBg);
        doc.fillColor('#0f172a');

        const subjName = g.subject?.name || g.subjectName || 'Subject';
        doc.text(subjName, 50, y + 5, { width: 170 });
        doc.text(g.ca1Score?.toString() || '0', 230, y + 5, { width: 50, align: 'center' });
        doc.text(g.ca2Score?.toString() || '0', 285, y + 5, { width: 50, align: 'center' });
        doc.text(g.examScore?.toString() || '0', 340, y + 5, { width: 55, align: 'center' });
        doc.font('Helvetica-Bold').text(g.totalScore?.toString() || '0', 400, y + 5, { width: 45, align: 'center' });
        doc.text(g.grade || 'A', 450, y + 5, { width: 40, align: 'center' });
        doc.font('Helvetica').text(g.remarks || 'Good', 495, y + 5, { width: 55, align: 'center' });

        totalObtained += Number(g.totalScore || 0);
        y += 18;
      });

      // Summary Box
      y += 8;
      const averageScore = grades.length > 0 ? (totalObtained / grades.length).toFixed(1) : '0';
      doc.rect(40, y, 515, 30).fill('#f0fdf4').stroke('#86efac');
      doc.fillColor('#064e3b').font('Helvetica-Bold').fontSize(9);
      doc.text(`TOTAL SUBJECTS: ${grades.length}`, 50, y + 10);
      doc.text(`CUMULATIVE SCORE: ${totalObtained} / ${grades.length * 100}`, 200, y + 10);
      doc.fillColor('#b45309').text(`TERM AVERAGE: ${averageScore}%`, 390, y + 10);

      // Signatures
      y += 40;
      doc.fillColor('#0f172a').font('Helvetica').fontSize(8);
      doc.lineCap('butt').moveTo(50, y + 35).lineTo(200, y + 35).stroke('#94a3b8');
      doc.text('Class Teacher Signature', 50, y + 40);

      doc.lineCap('butt').moveTo(355, y + 35).lineTo(505, y + 35).stroke('#94a3b8');
      doc.text('Principal / Director Signature', 355, y + 40);

      // Footer
      doc.fontSize(7).fillColor('#64748b')
        .text('Official Academic Transcript — Generated directly on demand by Markazu Umar Portal. Verification token: ' + Date.now(), 40, 780, { align: 'center', width: 515 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

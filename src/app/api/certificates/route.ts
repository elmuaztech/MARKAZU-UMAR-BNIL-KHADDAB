import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, resolveTeacherScope } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized (HTTP 401)' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedStudentId = searchParams.get('studentId');

    // 1. Resolve Target Student with Strict Cross-Account Authorization
    let targetStudentId = requestedStudentId;

    if (authUser.role === 'STUDENT') {
      const studentRec = await prisma.student.findFirst({
        where: {
          OR: [{ userId: authUser.id }, { id: authUser.id }],
          deletedAt: null,
        },
      });

      if (!studentRec) {
        return NextResponse.json({ success: false, error: 'Student record not found.' }, { status: 404 });
      }

      // Security: Students cannot query certificates of any other student
      if (requestedStudentId && requestedStudentId !== studentRec.id) {
        return NextResponse.json(
          { success: false, error: 'Access forbidden (HTTP 403): You may only access your own certificate.' },
          { status: 403 }
        );
      }

      targetStudentId = studentRec.id;
    } else if (authUser.role === 'PARENT') {
      const parentRec = await prisma.parent.findFirst({
        where: {
          OR: [{ userId: authUser.id }, { id: authUser.id }],
          deletedAt: null,
        },
        include: { wards: { select: { id: true } } },
      });

      if (!parentRec) {
        return NextResponse.json({ success: false, error: 'Parent record not found.' }, { status: 404 });
      }

      const linkedWardIds = parentRec.wards.map((w) => w.id);

      if (!targetStudentId) {
        // Default to first linked child if none specified
        targetStudentId = linkedWardIds[0];
      }

      if (!targetStudentId || !linkedWardIds.includes(targetStudentId)) {
        return NextResponse.json(
          { success: false, error: 'Access forbidden (HTTP 403): You may only access certificates for your linked children.' },
          { status: 403 }
        );
      }
    } else if (authUser.role === 'TEACHER') {
      if (!targetStudentId) {
        return NextResponse.json({ success: false, error: 'studentId parameter is required.' }, { status: 400 });
      }
      const scope = await resolveTeacherScope(authUser.id);
      const student = await prisma.student.findUnique({
        where: { id: targetStudentId },
        select: { classId: true },
      });
      if (!student) {
        return NextResponse.json({ success: false, error: 'Student not found.' }, { status: 404 });
      }
      const allowedClasses = Array.from(new Set([...scope.teachingClassIds, ...scope.attendanceClassIds]));
      if (!allowedClasses.includes(student.classId)) {
        return NextResponse.json(
          { success: false, error: 'Access forbidden (HTTP 403): Student is outside your assigned class scope.' },
          { status: 403 }
        );
      }
    } else if (authUser.role === 'HEADMASTER') {
      if (!targetStudentId) {
        return NextResponse.json({ success: false, error: 'studentId parameter is required.' }, { status: 400 });
      }
      const student = await prisma.student.findUnique({
        where: { id: targetStudentId },
        select: { programmeId: true },
      });
      if (!student) {
        return NextResponse.json({ success: false, error: 'Student not found.' }, { status: 404 });
      }
      if (authUser.assignedProgrammeId && student.programmeId !== authUser.assignedProgrammeId) {
        return NextResponse.json(
          { success: false, error: 'Access forbidden (HTTP 403): Student belongs to another programme section.' },
          { status: 403 }
        );
      }
    }

    if (!targetStudentId) {
      return NextResponse.json({ success: false, error: 'studentId parameter is required.' }, { status: 400 });
    }

    // 2. Fetch Full Student Data with Relationships
    const student = await prisma.student.findUnique({
      where: { id: targetStudentId },
      include: {
        schoolClass: {
          include: {
            programme: true,
            classTeacher: true,
          },
        },
        quranAssessments: {
          where: {
            status: 'APPROVED',
          },
          orderBy: { createdAt: 'desc' },
        },
        gradeRecords: {
          where: {
            status: 'APPROVED',
            isReleased: true,
          },
        },
      },
    });

    if (!student || student.deletedAt) {
      return NextResponse.json({ success: false, error: 'Student record not found.' }, { status: 404 });
    }

    // 3. Server-side Academic & Tahfiz Eligibility Verification
    // A student qualifies for a Certificate if ANY of the following legitimate institutional requirements are met:
    // Criterion A: Student status is officially GRADUATED
    const isStatusGraduated = student.status === 'GRADUATED';

    // Criterion B: Full 30-Juz Tahfiz Memorization completed (juzCompleted >= 30 or completedSurahsCount >= 114)
    const isTahfizCompleted = (student.juzCompleted || 0) >= 30 || (student.completedSurahsCount || 0) >= 114;

    // Criterion C: Official Qur'an Assessment passed with QUALIFIED and APPROVED status
    const qualifiedAssessment = student.quranAssessments.find((a) => a.finalResult === 'QUALIFIED');
    const isAssessmentQualified = Boolean(qualifiedAssessment);

    // Criterion D: Academic Curriculum Completion (has at least 3 approved & released grades and 100% pass mark >= 40)
    const hasReleasedGrades = student.gradeRecords.length >= 3;
    const isAcademicPassed =
      hasReleasedGrades && student.gradeRecords.every((g) => (g.totalScore || 0) >= 40);

    const isEligible = isStatusGraduated || isTahfizCompleted || isAssessmentQualified || isAcademicPassed;

    // If NOT eligible: Return clean, secure ineligible status without generating certificate
    if (!isEligible) {
      return NextResponse.json(
        {
          success: false,
          eligible: false,
          student: {
            id: student.id,
            fullName: student.fullName,
            admissionNo: student.admissionNo,
            className: student.schoolClass?.name || 'Class',
          },
          error: 'Certificate not available yet.',
          reason:
            'Student has not yet satisfied the institutional completion or qualification requirements for certificate issuance.',
          criteria: {
            isStatusGraduated,
            isTahfizCompleted,
            juzCompleted: student.juzCompleted || 0,
            requiredJuz: 30,
            isAssessmentQualified,
            isAcademicPassed,
            approvedGradesCount: student.gradeRecords.length,
          },
        },
        { status: 403 }
      );
    }

    // 4. Determine Qualification Details
    let qualificationTitleEnglish = "CERTIFICATE OF TAHFIZUL QUR'AN & ISLAMIC STUDIES GRADUATION";
    let qualificationTitleArabic = "شهادة إتمام حفظ القرآن الكريم والتخرج والدراسات الإسلامية";
    let qualificationReason = 'Successful completion of 30-Juz Holy Qur\'an memorization and exemplary Islamic character (Akhlaq).';

    if (isTahfizCompleted) {
      qualificationTitleEnglish = "CERTIFICATE OF 30-JUZ QUR'AN MEMORIZATION COMPLETION";
      qualificationTitleArabic = "شهادة إتمام حفظ القرآن الكريم كاملاً (٣٠ جزءاً)";
      qualificationReason = 'Demonstrated complete memorization, mastery of Tajweed rules, and comprehensive recitation of the 30 Juz of the Holy Qur\'an.';
    } else if (isAssessmentQualified) {
      qualificationTitleEnglish = "CERTIFICATE OF QUR'AN ASSESSMENT QUALIFICATION";
      qualificationTitleArabic = "شهادة اجتياز التقييم القرآني والتميز في التلاوة والتجويد";
      qualificationReason = 'Successfully qualified in the institutional Qur\'an assessment event with distinction in Tilawa and Tajweed.';
    } else if (isStatusGraduated) {
      qualificationTitleEnglish = "CERTIFICATE OF GRADUATION & CURRICULUM COMPLETION";
      qualificationTitleArabic = "شهادة التخرج وإتمام المنهج الدراسي الإسلامي";
      qualificationReason = 'Satisfactorily completed all academic requirements, Islamic jurisprudence studies, and graduation examinations.';
    }

    const yearIssued = new Date().getFullYear();
    const cleanAdmission = student.admissionNo.replace(/[^a-zA-Z0-9]/g, '');
    const certificateNo = `MUBK-CERT-${yearIssued}-${cleanAdmission}`;

    // Issue Date
    const issueDateStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const issueDateArabic = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    return NextResponse.json({
      success: true,
      eligible: true,
      certificate: {
        certificateNo,
        issueDate: issueDateStr,
        issueDateArabic,
        qualificationTitleEnglish,
        qualificationTitleArabic,
        qualificationReason,
        student: {
          id: student.id,
          admissionNo: student.admissionNo,
          fullName: student.fullName,
          fullNameArabic: (student as any).fullNameArabic || null,
          gender: student.gender,
          className: student.schoolClass?.name || 'Class',
          programmeName: student.schoolClass?.programme?.nameEnglish || 'Islamic Studies & Tahfiz Programme',
          programmeNameArabic: student.schoolClass?.programme?.nameArabic || 'برنامج تحفيظ القرآن والدراسات الإسلامية',
          juzCompleted: student.juzCompleted || 0,
          completedSurahsCount: student.completedSurahsCount || 0,
          akhlaqRating: student.akhlaqRating || 'EXCELLENT',
        },
        school: {
          nameEnglish: "MARKAZU UMAR BN AL-KHATTAB CENTRE FOR QUR'AN MEMORIZATION & ISLAMIC STUDIES",
          nameArabic: "مركز عمر بن الخطاب لتحفيظ القرآن الكريم والدراسات الإسلامية",
          locationEnglish: "Daneji, Kano State, Nigeria",
          locationArabic: "دنيجي، ولاية كانو، نيجيريا",
          principalName: "Malam Umar Faruq",
          principalTitle: "School Director & Head of Studies",
          principalTitleArabic: "مدير المركز ورئيس هيئة التدريس",
          headOfTahfiz: "Sheikh Ahmad Muhammad",
          headOfTahfizTitle: "Head of Tahfiz & Examination Board",
          logoUrl: "/logo-rounded.png",
          sealText: "OFFICIAL SEAL • MARKAZU UMAR BN AL-KHATTAB • KANO",
        },
      },
    });
  } catch (error: any) {
    console.error('[GET_CERTIFICATES_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

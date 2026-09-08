import { GradeRecord, AssessmentConfig } from '@/types';

export function exportResultGridToCSV(
  grades: GradeRecord[],
  programmeName: string,
  className: string,
  subjectName: string,
  session: string,
  term: string,
  config: AssessmentConfig
) {
  const headers = [
    'Admission No',
    'Student Name',
    config.enableAssignment ? `Assignment (Max ${config.maxAssignment})` : null,
    config.enableCa1 ? `CA1 (Max ${config.maxCa1})` : null,
    config.enableCa2 ? `CA2 (Max ${config.maxCa2})` : null,
    config.enableTest ? `Test (Max ${config.maxTest})` : null,
    config.enableProject ? `Project (Max ${config.maxProject})` : null,
    config.enablePractical ? `Practical (Max ${config.maxPractical})` : null,
    config.enableExam ? `Exam (Max ${config.maxExam})` : null,
    'Total Score (100%)',
    'Grade',
    'Status',
    'Remarks',
  ].filter(Boolean);

  const rows = grades.map((g) => {
    return [
      `"${g.admissionNo || 'N/A'}"`,
      `"${g.studentName}"`,
      config.enableAssignment ? g.assignmentScore ?? 0 : null,
      config.enableCa1 ? g.ca1Score : null,
      config.enableCa2 ? g.ca2Score : null,
      config.enableTest ? g.testScore ?? 0 : null,
      config.enableProject ? g.projectScore ?? 0 : null,
      config.enablePractical ? g.practicalScore ?? 0 : null,
      config.enableExam ? g.examScore : null,
      g.totalScore,
      `"${g.grade}"`,
      `"${g.status}"`,
      `"${g.remarks.replace(/"/g, '""')}"`,
    ].filter((val) => val !== null);
  });

  const metadata = [
    `"MARKAZU UMAR BN KHATTAB TAHFIZUL QUR'AN SCHOOL"`,
    `"TEACHER ASSESSMENT ENTRY REFERENCE SHEET - NOT AN OFFICIAL REPORT CARD"`,
    `"Programme: ${programmeName}"`,
    `"Class: ${className}"`,
    `"Subject: ${subjectName}"`,
    `"Session / Term: ${session} - ${term}"`,
    `"Exported Date: ${new Date().toLocaleString()}"`,
    `""`,
  ];

  const csvContent = [...metadata, headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `Teacher_Reference_${subjectName.replace(/\s+/g, '_')}_${className.replace(/\s+/g, '_')}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printOrExportPDFReference(
  grades: GradeRecord[],
  programmeName: string,
  className: string,
  subjectName: string,
  session: string,
  term: string,
  teacherName: string,
  config: AssessmentConfig
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const tableRows = grades
    .map(
      (g, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
      <td style="padding: 6px; text-align: center;">${idx + 1}</td>
      <td style="padding: 6px; font-weight: bold;">${g.admissionNo || 'N/A'}</td>
      <td style="padding: 6px; font-weight: bold;">${g.studentName}</td>
      ${config.enableAssignment ? `<td style="padding: 6px; text-align: center;">${g.assignmentScore ?? 0}</td>` : ''}
      ${config.enableCa1 ? `<td style="padding: 6px; text-align: center;">${g.ca1Score}</td>` : ''}
      ${config.enableCa2 ? `<td style="padding: 6px; text-align: center;">${g.ca2Score}</td>` : ''}
      ${config.enableTest ? `<td style="padding: 6px; text-align: center;">${g.testScore ?? 0}</td>` : ''}
      ${config.enableProject ? `<td style="padding: 6px; text-align: center;">${g.projectScore ?? 0}</td>` : ''}
      ${config.enablePractical ? `<td style="padding: 6px; text-align: center;">${g.practicalScore ?? 0}</td>` : ''}
      ${config.enableExam ? `<td style="padding: 6px; text-align: center;">${g.examScore}</td>` : ''}
      <td style="padding: 6px; text-align: center; font-weight: bold; color: #047857;">${g.totalScore}</td>
      <td style="padding: 6px; text-align: center; font-weight: bold;">${g.grade}</td>
      <td style="padding: 6px; text-align: center; font-size: 10px;">${g.status}</td>
      <td style="padding: 6px; font-style: italic; font-size: 10px;">${g.remarks}</td>
    </tr>
  `
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Teacher Assessment Reference - ${subjectName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b; }
          .header { border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 16px; }
          .watermark { background: #fef3c7; border: 1px solid #f59e0b; color: #b45309; padding: 8px 12px; font-size: 11px; font-weight: bold; border-radius: 8px; text-align: center; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th { background: #065f46; color: white; padding: 8px; font-size: 10px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2 style="margin: 0; color: #064e3b;">Markazu Umar bn Khattab Tahfizul Qur'an & Islamic Studies School</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569;">
            Programme: <strong>${programmeName}</strong> | Class: <strong>${className}</strong> | Subject: <strong>${subjectName}</strong>
          </p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">
            Academic Session: ${session} • Term: ${term} • Teacher Evaluator: ${teacherName}
          </p>
        </div>

        <div class="watermark">
          ⚠️ FOR TEACHER REFERENCE ONLY — THIS IS NOT AN OFFICIAL STUDENT REPORT CARD
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Admission No</th>
              <th>Student Name</th>
              ${config.enableAssignment ? `<th>Assign (${config.maxAssignment})</th>` : ''}
              ${config.enableCa1 ? `<th>CA1 (${config.maxCa1})</th>` : ''}
              ${config.enableCa2 ? `<th>CA2 (${config.maxCa2})</th>` : ''}
              ${config.enableTest ? `<th>Test (${config.maxTest})</th>` : ''}
              ${config.enableProject ? `<th>Proj (${config.maxProject})</th>` : ''}
              ${config.enablePractical ? `<th>Prac (${config.maxPractical})</th>` : ''}
              ${config.enableExam ? `<th>Exam (${config.maxExam})</th>` : ''}
              <th>Total</th>
              <th>Grade</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

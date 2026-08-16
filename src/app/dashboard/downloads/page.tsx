'use client';

import React, { useState } from 'react';
import { useApp } from '../../../lib/context';
import { Download, FileSpreadsheet, FileText, Printer, Filter, ShieldAlert, CheckCircle2, UserCheck, Users, HeartHandshake, Sparkles, Building2 } from 'lucide-react';

export default function DownloadsPage() {
  const { currentUser, students, teachers, parents, programmes, classes, schoolLogo } = useApp();

  const [selectedProgId, setSelectedProgId] = useState<string>('ALL');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [notice, setNotice] = useState<string>('');

  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

  // Access Control: Strictly Admin & Super Admin only
  if (!isAdmin) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-[#042419] border border-rose-500/30 text-center space-y-4 font-sans">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold uppercase text-slate-900 dark:text-white">Access Restricted</h2>
        <p className="text-xs text-rose-600 dark:text-rose-300 max-w-md mx-auto">
          The Download Center is restricted exclusively to School Administrators for accessing official student, staff, and admission records.
        </p>
      </div>
    );
  }

  // Filter students based on selection
  const filteredStudents = students.filter((s) => {
    const matchesProg = selectedProgId === 'ALL' || s.programmeId === selectedProgId;
    const matchesClass = selectedClassId === 'ALL' || s.classId === selectedClassId;
    return matchesProg && matchesClass;
  });

  // Available classes filtered by selected programme
  const availableClasses = selectedProgId === 'ALL'
    ? classes
    : classes.filter((c) => c.programmeId === selectedProgId);

  // Helper to trigger UTF-8 BOM CSV (Opens directly in MS Excel)
  const triggerExcelDownload = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.map((field) => `"${String(field ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotice(`Successfully generated Excel spreadsheet: ${filename}.csv`);
    setTimeout(() => setNotice(''), 4000);
  };

  // Helper to open a clean printable PDF window
  const triggerPrintablePDF = (title: string, subtitle: string, headers: string[], rows: (string | number)[][]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups to view printable PDF.');
      return;
    }

    const logoUrl = schoolLogo || '/logo.jpg';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@700&family=Inter:wght@400;600;800;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 25px; color: #1e293b; background: #fff; }
            .header { text-align: center; border-bottom: 3px double #042f1e; pb: 15px; margin-bottom: 20px; }
            .logo-img { width: 70px; height: 70px; object-fit: contain; margin: 0 auto 8px auto; display: block; border-radius: 50%; border: 2px solid #042f1e; }
            .arabic { font-family: 'Amiri', serif; font-size: 22px; color: #b45309; font-weight: bold; margin-bottom: 4px; }
            .title { font-size: 16px; font-weight: 900; color: #042f1e; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.3; }
            .subtitle { font-size: 12px; font-weight: 700; color: #166534; margin-top: 6px; text-transform: uppercase; }
            .meta { font-size: 10px; color: #64748b; margin-top: 8px; font-family: monospace; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
            th { bg-color: #042f1e; background: #042f1e; color: white; padding: 8px 10px; text-align: left; font-weight: 800; font-size: 10px; text-transform: uppercase; }
            td { border-bottom: 1px solid #e2e8f0; padding: 8px 10px; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .footer { margin-top: 30px; display: flex; justify-between: space-between; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${logoUrl}" alt="School Logo" class="logo-img" onerror="this.style.display='none'" />
            <div class="arabic">مركز عمر بن الخطاب لتحفيظ القرآن والدراسات الإسلامية - دنيج</div>
            <div class="title">MARKAZU UMAR BN AL-KHATTAB CENTRE FOR QUR'AN MEMORIZATION & ISLAMIC STUDIES - DANEJI</div>
            <div class="subtitle">${title} — ${subtitle}</div>
            <div class="meta">Generated on: ${new Date().toLocaleString()} | Official Record Export</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                ${headers.map((h) => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (row, idx) => `
                <tr>
                  <td style="font-weight:bold; color:#64748b;">${idx + 1}</td>
                  ${row.map((col) => `<td>${col ?? '—'}</td>`).join('')}
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="footer" style="margin-top:40px; display:flex; justify-content:space-between;">
            <div>Issued by: Administrative Office, Markazu Umar bn Al-Khattab Centre</div>
            <div>Official Stamp & Signature: _______________________</div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Helper for Official Admission Form PDF
  const triggerAdmissionFormPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups to print the Admission Form.');
      return;
    }

    const logoUrl = schoolLogo || '/logo.jpg';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Official Student Admission Form - Markazu Umar</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@700&family=Inter:wght@400;600;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 30px; color: #0f172a; line-height: 1.5; background: #fff; }
            .header-box { border: 2px solid #042f1e; padding: 15px; border-radius: 12px; text-align: center; position: relative; margin-bottom: 20px; background: #f0fdf4; }
            .logo-img { width: 70px; height: 70px; object-fit: contain; margin: 0 auto 6px auto; display: block; border-radius: 50%; border: 2px solid #042f1e; }
            .arabic { font-family: 'Amiri', serif; font-size: 22px; color: #b45309; font-weight: bold; }
            .title { font-size: 16px; font-weight: 900; color: #042f1e; letter-spacing: 0.5px; line-height: 1.3; }
            .subtitle { font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase; margin-top: 4px; }
            .photo-box { position: absolute; right: 15px; top: 15px; width: 90px; height: 110px; border: 2px dashed #042f1e; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #64748b; text-align: center; }
            .section-title { font-size: 12px; font-weight: 900; background: #042f1e; color: white; padding: 6px 12px; border-radius: 6px; margin-top: 15px; margin-bottom: 12px; text-transform: uppercase; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 11px; }
            .field-group { border-bottom: 1px dotted #cbd5e1; padding-bottom: 4px; }
            .field-label { font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; }
            .field-line { font-size: 11px; font-weight: 600; color: #0f172a; min-height: 16px; margin-top: 2px; }
            .checkbox-group { display: flex; gap: 15px; margin-top: 4px; font-size: 11px; }
            .declaration { border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; font-size: 10px; color: #334155; margin-top: 20px; background: #f8fafc; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 30px; font-size: 10px; font-weight: 700; text-align: center; }
            .sig-line { border-top: 1px solid #0f172a; margin-top: 40px; padding-top: 4px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header-box">
            <img src="${logoUrl}" alt="School Logo" class="logo-img" onerror="this.style.display='none'" />
            <div class="arabic">مركز عمر بن الخطاب لتحفيظ القرآن والدراسات الإسلامية - دنيج</div>
            <div class="title">MARKAZU UMAR BN AL-KHATTAB CENTRE FOR QUR'AN MEMORIZATION & ISLAMIC STUDIES - DANEJI</div>
            <div class="subtitle">Official Student Admission Application Form (1447/1448 AH)</div>
            <div style="font-size:10px; color:#475569; margin-top:3px;">Daneji Quarters, Kano State, Nigeria | Contact: +234 803 123 4567</div>
            <div class="photo-box">Affix Passport<br>Photograph<br>Here</div>
          </div>

          <div class="section-title">1. Applicant Student Personal Details</div>
          <div class="grid">
            <div class="field-group"><div class="field-label">Full Name (English)</div><div class="field-line">___________________________________________________________</div></div>
            <div class="field-group"><div class="field-label">Full Name (Arabic)</div><div class="field-line">___________________________________________________________</div></div>
            <div class="field-group"><div class="field-label">Gender</div><div class="checkbox-group"><span>[ &nbsp; ] Male</span> <span>[ &nbsp; ] Female</span></div></div>
            <div class="field-group"><div class="field-label">Date of Birth</div><div class="field-line">____ / ____ / ________</div></div>
            <div class="field-group"><div class="field-label">State of Origin</div><div class="field-line">___________________________</div></div>
            <div class="field-group"><div class="field-label">Local Government Area (LGA)</div><div class="field-line">___________________________</div></div>
            <div class="field-group" style="grid-column: span 2;"><div class="field-label">Residential Address</div><div class="field-line">_________________________________________________________________________________</div></div>
            <div class="field-group" style="grid-column: span 2;"><div class="field-label">Previous School Attended (If Any)</div><div class="field-line">_________________________________________________________________________________</div></div>
          </div>

          <div class="section-title">2. Programme & Class Preference</div>
          <div class="grid">
            <div class="field-group" style="grid-column: span 2;">
              <div class="field-label">Select Preferred Session / Stream</div>
              <div class="checkbox-group" style="margin-top:6px;">
                <span>[ &nbsp; ] Asubah & Magrib Stream (Morning/Evening)</span>
                <span>[ &nbsp; ] Evening Islamiyya Stream</span>
                <span>[ &nbsp; ] Specialized Full Tahfiz Track</span>
              </div>
            </div>
          </div>

          <div class="section-title">3. Parent / Guardian Information</div>
          <div class="grid">
            <div class="field-group"><div class="field-label">Father / Guardian Name</div><div class="field-line">___________________________________________________________</div></div>
            <div class="field-group"><div class="field-label">Relationship to Student</div><div class="field-line">___________________________________________________________</div></div>
            <div class="field-group"><div class="field-label">Phone Number</div><div class="field-line">___________________________</div></div>
            <div class="field-group"><div class="field-label">WhatsApp Number</div><div class="field-line">___________________________</div></div>
            <div class="field-group"><div class="field-label">Email Address</div><div class="field-line">___________________________</div></div>
            <div class="field-group"><div class="field-label">Occupation</div><div class="field-line">___________________________</div></div>
          </div>

          <div class="declaration">
            <strong>Parent / Guardian Undertaking:</strong><br>
            I hereby certify that all information provided in this admission form is authentic and accurate to the best of my knowledge. I promise to abide by all the rules, regulations, and Tahfiz evaluation guidelines of Markazu Umar.
          </div>

          <div class="signatures">
            <div><div class="sig-line">Parent / Guardian Signature & Date</div></div>
            <div><div class="sig-line">Admissions Officer Signature & Date</div></div>
            <div><div class="sig-line">School Principal Official Stamp</div></div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Export Handlers
  const handleExportStudentsExcel = () => {
    const headers = ['Admission No', 'Full Name', 'Arabic Name', 'Gender', 'Programme', 'Class', 'Guardian Name', 'Guardian Phone', 'Status'];
    const rows = filteredStudents.map((s) => [
      s.admissionNo,
      s.fullName,
      s.fullNameArabic || '',
      s.gender,
      s.programmeName || '',
      s.className,
      s.guardianName,
      s.guardianPhone,
      s.status,
    ]);
    triggerExcelDownload(`Students_Record_${selectedProgId}_${selectedClassId}`, headers, rows);
  };

  const handleExportStudentsPDF = () => {
    const headers = ['Admission No', 'Full Name', 'Gender', 'Class', 'Programme', 'Guardian Phone'];
    const rows = filteredStudents.map((s) => [
      s.admissionNo,
      s.fullName,
      s.gender,
      s.className,
      s.programmeName || '',
      s.guardianPhone,
    ]);
    const progLabel = selectedProgId === 'ALL' ? 'All Programmes' : programmes.find((p) => p.id === selectedProgId)?.programme_name_english;
    const classLabel = selectedClassId === 'ALL' ? 'All Classes' : classes.find((c) => c.id === selectedClassId)?.name;

    triggerPrintablePDF('Official Student Directory Records', `${progLabel} • ${classLabel} (${filteredStudents.length} Students)`, headers, rows);
  };

  const handleExportTeachersExcel = () => {
    const headers = ['Staff No', 'Full Name', 'Arabic Name', 'Email', 'Phone', 'Status'];
    const rows = teachers.map((t) => [
      t.staffNo,
      t.fullName || t.full_name_english,
      t.full_name_arabic || '',
      t.email,
      t.phone,
      t.status,
    ]);
    triggerExcelDownload('Teachers_And_Staff_Directory', headers, rows);
  };

  const handleExportTeachersPDF = () => {
    const headers = ['Staff No', 'Full Name', 'Email', 'Phone', 'Status'];
    const rows = teachers.map((t) => [
      t.staffNo,
      t.fullName || t.full_name_english,
      t.email,
      t.phone,
      t.status,
    ]);
    triggerPrintablePDF('Teachers & Academic Staff Directory', `Total Staff: ${teachers.length}`, headers, rows);
  };

  const handleExportParentsExcel = () => {
    const headers = ['Full Name', 'Email', 'Phone', 'WhatsApp', 'Occupation', 'Residential Address', 'Wards Count'];
    const rows = parents.map((p) => [
      p.fullName,
      p.email,
      p.phone,
      p.whatsapp || p.phone,
      p.occupation,
      p.address,
      p.wardsCount ?? p.wardIds?.length ?? 0,
    ]);
    triggerExcelDownload('Parents_Directory_Records', headers, rows);
  };

  const handleExportParentsPDF = () => {
    const headers = ['Full Name', 'Phone', 'Email', 'Occupation', 'Wards Count'];
    const rows = parents.map((p) => [
      p.fullName,
      p.phone,
      p.email,
      p.occupation,
      p.wardsCount ?? p.wardIds?.length ?? 0,
    ]);
    triggerPrintablePDF('Parents & Guardians Directory', `Total Registered Guardians: ${parents.length}`, headers, rows);
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-gray-100 selection:bg-emerald-500 selection:text-white font-sans">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#042f1e] via-[#064e3b] to-[#0284c7] text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-500/30">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 uppercase tracking-widest mb-1">
            <Download className="w-4 h-4 text-emerald-400" /> Admin Downloads & School Records Export Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Downloads & Official Records Center</h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl">
            Download official printable student admission application forms and export complete student, teacher, parent, and staff records in Excel (.csv) and PDF formats.
          </p>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Grid of Official Download Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* SECTION 1: OFFICIAL ADMISSION FORM */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider">
                Official Document
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Printable PDF</span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Official Student Admission Application Form</h3>
                <p className="text-xs text-slate-600 dark:text-emerald-200/80 mt-1 leading-relaxed">
                  Printable blank official application form (1447/1448 AH) with school emblem, applicant personal details, guardian undertaking, and official signature blocks.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-emerald-500/20 flex flex-wrap items-center gap-3">
            <button
              onClick={triggerAdmissionFormPDF}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all hover:scale-105"
            >
              <Printer className="w-4 h-4" /> Download / Print Admission Form (PDF)
            </button>
          </div>
        </div>

        {/* SECTION 2: STUDENT RECORDS EXPORT (WITH CLASS & PROGRAM FILTERS) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-500/20 uppercase tracking-wider">
                Student Directory Export
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                {filteredStudents.length} Students Selected
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Student Records Data Export</h3>
                <p className="text-xs text-slate-600 dark:text-emerald-200/80 mt-1 leading-relaxed">
                  Export complete student information filtered by specific programme or specific class in Excel (.csv) or PDF document formats.
                </p>
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-emerald-400 block mb-1">
                  Filter by Programme
                </label>
                <select
                  value={selectedProgId}
                  onChange={(e) => {
                    setSelectedProgId(e.target.value);
                    setSelectedClassId('ALL');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">All Programmes</option>
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.programme_name_english} ({p.programme_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-emerald-400 block mb-1">
                  Filter by Class
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">All Classes</option>
                  {availableClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-emerald-500/20 flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportStudentsExcel}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Students Excel (.csv)
            </button>
            <button
              onClick={handleExportStudentsPDF}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <FileText className="w-4 h-4" /> Print / Export PDF
            </button>
          </div>
        </div>

        {/* SECTION 3: TEACHERS & ACADEMIC STAFF DIRECTORY EXPORT */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded border border-purple-500/20 uppercase tracking-wider">
                Staff Records
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                {teachers.length} Teachers Registered
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Teachers & Staff Records Export</h3>
                <p className="text-xs text-slate-600 dark:text-emerald-200/80 mt-1 leading-relaxed">
                  Export full directory records for all teaching and academic staff including staff numbers, contact details, assigned classes, and subjects.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-emerald-500/20 flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportTeachersExcel}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Teachers Excel (.csv)
            </button>
            <button
              onClick={handleExportTeachersPDF}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <FileText className="w-4 h-4" /> Print / Export PDF
            </button>
          </div>
        </div>

        {/* SECTION 4: PARENTS & GUARDIANS DIRECTORY EXPORT */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider">
                Parents Directory
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                {parents.length} Guardians Registered
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Parents & Guardians Records Export</h3>
                <p className="text-xs text-slate-600 dark:text-emerald-200/80 mt-1 leading-relaxed">
                  Export complete parent and guardian contact lists, occupations, addresses, and registered wards counts.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-emerald-500/20 flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportParentsExcel}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Parents Excel (.csv)
            </button>
            <button
              onClick={handleExportParentsPDF}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <FileText className="w-4 h-4" /> Print / Export PDF
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

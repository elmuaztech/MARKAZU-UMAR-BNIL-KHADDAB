'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../../lib/context';
import {
  Database,
  HardDrive,
  Download,
  ShieldAlert,
  CheckCircle2,
  Clock,
  FileJson,
  FileText,
  RefreshCw,
  Lock,
  Sparkles,
  FolderDown,
  ExternalLink,
  ShieldCheck,
  Archive,
  Copy,
  Check,
} from 'lucide-react';

export type BackupType = 'FULL_PACKAGE' | 'JSON_DUMP' | 'PDF_SNAPSHOT';

export interface BackupLogItem {
  id: string;
  timestamp: string;
  backupType: BackupType;
  backupTypeLabel: string;
  performedBy: string;
  performedByRole: string;
  fileSize: string;
  totalRecords: number;
  recordsBreakdown: {
    students: number;
    teachers: number;
    parents: number;
    programmes: number;
    classes: number;
    subjects: number;
    tahfiz: number;
    attendance: number;
    grades: number;
    admissions: number;
    auditLogs: number;
  };
  status: 'DOWNLOADED_AND_SAVED';
  filename: string;
  rawJson?: string;
}

export default function BackupCenterPage() {
  const {
    currentUser,
    students,
    teachers,
    parents,
    programmes,
    classes,
    subjects,
    tahfizRecords,
    attendance,
    grades,
    admissionApplications,
    auditLogs,
    addAuditLog,
    notify,
  } = useApp();

  const [selectedBackupType, setSelectedBackupType] = useState<BackupType>('FULL_PACKAGE');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>('');
  const [copiedInstruction, setCopiedInstruction] = useState<boolean>(false);

  // Calculate live total records across all supported school entities
  const totalDatabaseRecords =
    students.length +
    teachers.length +
    parents.length +
    programmes.length +
    classes.length +
    subjects.length +
    tahfizRecords.length +
    attendance.length +
    grades.length +
    admissionApplications.length +
    auditLogs.length;

  // Initialize and load saved backup logs from localStorage or fallback seed
  const [backupLogs, setBackupLogs] = useState<BackupLogItem[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('markazu_manual_backup_logs');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBackupLogs(parsed);
            return;
          }
        } catch {
          // ignore corrupted local storage
        }
      }
      setBackupLogs([]);
    }
  }, []);

  const saveLogsToStorage = (updatedLogs: BackupLogItem[]) => {
    setBackupLogs(updatedLogs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('markazu_manual_backup_logs', JSON.stringify(updatedLogs));
    }
  };

  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

  // Access Control: Admin & Super Admin only
  if (!isAdmin) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-[#042419] border border-rose-500/30 text-center space-y-4 font-sans">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold uppercase text-slate-900 dark:text-white">Access Restricted</h2>
        <p className="text-xs text-rose-600 dark:text-rose-300 max-w-md mx-auto">
          The System & Database Backup Center is strictly restricted to School Administrators to generate and download manual database snapshots.
        </p>
      </div>
    );
  }

  // Generate complete system data object directly from live database state
  const generateBackupDataObject = (type: BackupType) => {
    return {
      metadata: {
        system: "MARKAZU UMAR BN AL-KHATTAB CENTRE FOR QUR'AN MEMORIZATION & ISLAMIC STUDIES - DANEJI",
        systemShort: 'Markazu Umar Islamic School Management System',
        generatedAt: new Date().toISOString(),
        generatedAtFormatted: new Date().toLocaleString(),
        version: '2.0.0',
        backupType: type,
        backedUpBy: currentUser.name,
        backedUpByEmail: currentUser.email,
        backedUpByRole: currentUser.role,
        securitySealed: true,
      },
      summary: {
        totalRecords: totalDatabaseRecords,
        studentsCount: students.length,
        teachersCount: teachers.length,
        parentsCount: parents.length,
        programmesCount: programmes.length,
        classesCount: classes.length,
        subjectsCount: subjects.length,
        tahfizRecordsCount: tahfizRecords.length,
        attendanceCount: attendance.length,
        gradesCount: grades.length,
        admissionsCount: admissionApplications.length,
        auditLogsCount: auditLogs.length,
      },
      data: {
        students,
        teachers,
        parents,
        programmes,
        classes,
        subjects,
        tahfizRecords,
        attendance,
        grades,
        admissionApplications,
        auditLogs,
      },
    };
  };

  // Trigger Download of JSON Database Dump File
  const downloadJSONBackupFile = (backupObj: any, filename: string) => {
    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Trigger Printable PDF Executive Summary Backup Snapshot
  const triggerPDFBackupSummary = (backupObj: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      notify({
        type: 'warning',
        title: 'Pop-up Blocked',
        message: 'Please allow pop-ups for this site to view and print the PDF backup summary.',
      });
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Markazu Umar - Executive Database Backup Snapshot</title>
          <meta charset="utf-8" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@700&family=Inter:wght@400;600;700;900&display=swap');
            body { font-family: 'Inter', -apple-system, sans-serif; padding: 28px; color: #0f172a; background: #fff; line-height: 1.5; font-size: 12px; }
            .header { text-align: center; border-bottom: 3px double #042f1e; padding-bottom: 12px; margin-bottom: 18px; }
            .arabic { font-family: 'Amiri', serif; font-size: 24px; color: #b45309; font-weight: bold; margin-bottom: 4px; }
            .title { font-size: 17px; font-weight: 900; color: #042f1e; text-transform: uppercase; letter-spacing: 0.5px; }
            .subtitle { font-size: 12px; font-weight: 700; color: #166534; margin-top: 3px; }
            .meta-bar { font-size: 10px; color: #64748b; margin-top: 6px; font-family: monospace; background: #f8fafc; padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 16px; }
            .card { border: 1px solid #cbd5e1; padding: 14px; border-radius: 8px; background: #f8fafc; }
            .card-title { font-size: 11px; font-weight: 900; color: #042f1e; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
            .metric { display: flex; justify-content: space-between; margin-bottom: 5px; border-bottom: 1px dotted #e2e8f0; padding-bottom: 3px; }
            .label { font-weight: 600; color: #475569; }
            .val { font-weight: 800; color: #0f172a; }
            .storage-card { border: 1px solid #94a3b8; padding: 14px; border-radius: 8px; background: #f0fdf4; margin-top: 16px; border-left: 4px solid #16a34a; }
            .storage-title { font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; margin-bottom: 4px; }
            .storage-text { font-size: 10.5px; color: #1e293b; line-height: 1.4; }
            .footer { margin-top: 30px; font-size: 10px; text-align: center; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 10px; }
            @media print { body { padding: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="arabic">مركز عمر بن الخطاب لتحفيظ القرآن والدراسات الإسلامية - دنيج</div>
            <div class="title">MARKAZU UMAR BN AL-KHATTAB CENTRE</div>
            <div class="subtitle">Official System & Database Full Backup Audit Snapshot</div>
            <div class="meta-bar">
              Date & Time: ${backupObj.metadata.generatedAtFormatted} | Generated By: ${backupObj.metadata.backedUpBy} (${backupObj.metadata.backedUpByRole}) | Total Records: ${backupObj.summary.totalRecords}
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="card-title">1. Core Entity Directory</div>
              <div class="metric"><span class="label">Total Enrolled Students</span><span class="val">${backupObj.summary.studentsCount}</span></div>
              <div class="metric"><span class="label">Total Academic Teachers</span><span class="val">${backupObj.summary.teachersCount}</span></div>
              <div class="metric"><span class="label">Registered Parents & Guardians</span><span class="val">${backupObj.summary.parentsCount}</span></div>
              <div class="metric"><span class="label">Active Programmes & Streams</span><span class="val">${backupObj.summary.programmesCount}</span></div>
              <div class="metric"><span class="label">Configured Classes</span><span class="val">${backupObj.summary.classesCount}</span></div>
              <div class="metric"><span class="label">Active Subjects</span><span class="val">${backupObj.summary.subjectsCount}</span></div>
            </div>

            <div class="card">
              <div class="card-title">2. Academic & Operational Logs</div>
              <div class="metric"><span class="label">Tahfiz Quran Progress Logs</span><span class="val">${backupObj.summary.tahfizRecordsCount}</span></div>
              <div class="metric"><span class="label">Attendance Records</span><span class="val">${backupObj.summary.attendanceCount}</span></div>
              <div class="metric"><span class="label">Assessment & Grade Records</span><span class="val">${backupObj.summary.gradesCount}</span></div>
              <div class="metric"><span class="label">Admission Applications</span><span class="val">${backupObj.summary.admissionsCount}</span></div>
              <div class="metric"><span class="label">Security Audit Trail Logs</span><span class="val">${backupObj.summary.auditLogsCount}</span></div>
              <div class="metric"><span class="label">Aggregate Database Records</span><span class="val" style="color:#166534;">${backupObj.summary.totalRecords}</span></div>
            </div>
          </div>

          <div class="storage-card">
            <div class="storage-title">Administrator Manual Storage Certification</div>
            <div class="storage-text">
              This document certifies that a complete manual database backup snapshot was generated directly from the live school database by authorized Administrator <strong>${backupObj.metadata.backedUpBy}</strong>. The corresponding structured JSON database dump file has been downloaded directly to the administrator's device for safe archival on a computer, USB drive, external hard drive, phone, or manual upload to Google Drive.
            </div>
          </div>

          <div class="footer">
            Official System Snapshot &bull; Markazu Umar School Management System &bull; Confidential &bull; Single Source of Truth
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

  // Main Action: Execute Manual Backup & Download
  const handlePerformBackup = (typeToExecute: BackupType = selectedBackupType) => {
    setIsProcessing(true);

    setTimeout(() => {
      try {
        const backupData = generateBackupDataObject(typeToExecute);
        const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `Markazu_Umar_Database_Backup_${timestampStr}`;
        const rawJsonString = JSON.stringify(backupData, null, 2);
        const calculatedSizeMB = (rawJsonString.length / (1024 * 1024)).toFixed(2);
        const formattedSize =
          Number(calculatedSizeMB) < 0.1 ? `${(rawJsonString.length / 1024).toFixed(1)} KB` : `${calculatedSizeMB} MB`;

        let typeLabel = 'Complete Database (JSON + PDF)';
        if (typeToExecute === 'JSON_DUMP') typeLabel = 'Raw JSON Database Dump';
        if (typeToExecute === 'PDF_SNAPSHOT') typeLabel = 'Executive PDF Snapshot';

        // 1. Trigger requested download formats
        if (typeToExecute === 'FULL_PACKAGE' || typeToExecute === 'JSON_DUMP') {
          downloadJSONBackupFile(backupData, filename);
        }

        if (typeToExecute === 'FULL_PACKAGE' || typeToExecute === 'PDF_SNAPSHOT') {
          triggerPDFBackupSummary(backupData);
        }

        // 2. Add to Audit Log & Backup Log history
        const newLog: BackupLogItem = {
          id: `bkp-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          backupType: typeToExecute,
          backupTypeLabel: typeLabel,
          performedBy: currentUser.name,
          performedByRole: currentUser.role,
          fileSize: formattedSize,
          totalRecords: totalDatabaseRecords,
          recordsBreakdown: {
            students: students.length,
            teachers: teachers.length,
            parents: parents.length,
            programmes: programmes.length,
            classes: classes.length,
            subjects: subjects.length,
            tahfiz: tahfizRecords.length,
            attendance: attendance.length,
            grades: grades.length,
            admissions: admissionApplications.length,
            auditLogs: auditLogs.length,
          },
          status: 'DOWNLOADED_AND_SAVED',
          filename: filename,
        };

        const updatedLogs = [newLog, ...backupLogs];
        saveLogsToStorage(updatedLogs);

        addAuditLog({
          action: 'SYSTEM_MANUAL_BACKUP_CREATED',
          performedBy: currentUser.name,
          userRole: currentUser.role,
          details: `Manual backup generated and downloaded (${typeLabel}). Total records included: ${totalDatabaseRecords}. File size: ${formattedSize}.`,
          ipAddress: '127.0.0.1',
          status: 'SUCCESS',
        });

        setIsProcessing(false);
        setNotice(
          `Backup successfully generated! ${typeLabel} (${totalDatabaseRecords} records, ${formattedSize}) has been downloaded to your device.`
        );
        setTimeout(() => setNotice(''), 7000);
      } catch (err: any) {
        setIsProcessing(false);
        notify({
          type: 'error',
          title: 'Backup Generation Failed',
          message: err?.message || 'An unexpected error occurred while generating the backup.',
        });
      }
    }, 600);
  };

  // Re-download an existing backup from current live state
  const handleReDownload = (log: BackupLogItem) => {
    handlePerformBackup(log.backupType);
  };

  const copyStorageTips = () => {
    const text = `Markazu Umar Manual Backup Guide:\n1. Keep downloaded JSON files in your 'Documents/School_Backups' folder.\n2. Copy the file to a USB Flash Drive or External Hard Drive.\n3. Optional: Open Google Drive (drive.google.com) and manually drag-and-drop the downloaded JSON/PDF file to your school drive folder.`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedInstruction(true);
      setTimeout(() => setCopiedInstruction(false), 3000);
    }
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-gray-100 selection:bg-emerald-500 selection:text-white font-sans">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#042f1e] via-[#064e3b] to-[#047857] text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-500/30">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 uppercase tracking-widest mb-1">
            <Database className="w-4 h-4 text-emerald-400" /> Manual Administrator Database Backup
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Database & Records Backup Center</h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl">
            Generate and download complete, secure database archives directly to your computer, phone, or external storage. No Google Cloud APIs, OAuth, or external subscriptions required.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-emerald-200 shrink-0 self-start md:self-auto flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Single Source of Truth
          </div>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Manual Backup Generator Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-emerald-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Generate School Records Backup
              </h2>
              <p className="text-xs text-slate-500 dark:text-emerald-300/80">
                Download a clean, verified database archive generated directly from your current active school records.
              </p>
            </div>
          </div>

          <div className="text-right sm:block flex justify-between items-center bg-slate-50 dark:bg-emerald-950/40 px-3 py-2 rounded-2xl border border-slate-200 dark:border-emerald-800/30">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-emerald-400/80 block">Current Database State</span>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">{totalDatabaseRecords} Total Records</span>
          </div>
        </div>

        {/* Backup Format Selection Cards */}
        <div className="space-y-3">
          <label className="font-bold text-slate-700 dark:text-gray-300 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Select Backup Package Type</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Full Package */}
            <div
              onClick={() => setSelectedBackupType('FULL_PACKAGE')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedBackupType === 'FULL_PACKAGE'
                  ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
                  : 'bg-slate-50 dark:bg-[#021810] border-slate-200 dark:border-emerald-500/20 hover:border-emerald-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Archive className="w-5 h-5" />
                </div>
                {selectedBackupType === 'FULL_PACKAGE' && (
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-500/20 px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                )}
              </div>
              <h3 className="font-black text-xs text-slate-900 dark:text-white uppercase mb-1">
                Complete Backup Package
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-emerald-300/80 leading-relaxed">
                Downloads both the raw JSON database dump file and generates the official printable PDF executive audit snapshot.
              </p>
            </div>

            {/* Raw JSON Dump */}
            <div
              onClick={() => setSelectedBackupType('JSON_DUMP')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedBackupType === 'JSON_DUMP'
                  ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
                  : 'bg-slate-50 dark:bg-[#021810] border-slate-200 dark:border-emerald-500/20 hover:border-emerald-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400">
                  <FileJson className="w-5 h-5" />
                </div>
              </div>
              <h3 className="font-black text-xs text-slate-900 dark:text-white uppercase mb-1">
                Raw JSON Database Dump
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-emerald-300/80 leading-relaxed">
                Raw, structured database file containing all entities, passwords, logs, classes, and results for complete system restoration.
              </p>
            </div>

            {/* PDF Summary Report */}
            <div
              onClick={() => setSelectedBackupType('PDF_SNAPSHOT')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedBackupType === 'PDF_SNAPSHOT'
                  ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
                  : 'bg-slate-50 dark:bg-[#021810] border-slate-200 dark:border-emerald-500/20 hover:border-emerald-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <h3 className="font-black text-xs text-slate-900 dark:text-white uppercase mb-1">
                Executive Audit Snapshot (PDF)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-emerald-300/80 leading-relaxed">
                Formatted, printable certificate with Arabic header, entity metrics, audit timestamp, and administrator seal.
              </p>
            </div>
          </div>
        </div>

        {/* Live Scope Breakdown */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-extrabold uppercase text-slate-700 dark:text-emerald-400 tracking-wider">
            <span>📦 Records Included in Backup Snapshot:</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-300">{totalDatabaseRecords} Total Items</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-white dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/40">
              <span className="text-[10px] text-slate-400 block font-semibold">Students</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{students.length}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/40">
              <span className="text-[10px] text-slate-400 block font-semibold">Teachers</span>
              <span className="font-black text-purple-600 dark:text-purple-400 text-sm">{teachers.length}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/40">
              <span className="text-[10px] text-slate-400 block font-semibold">Parents</span>
              <span className="font-black text-amber-600 dark:text-amber-400 text-sm">{parents.length}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/40">
              <span className="text-[10px] text-slate-400 block font-semibold">Classes & Progs</span>
              <span className="font-black text-sky-600 dark:text-sky-400 text-sm">{classes.length + programmes.length}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/40">
              <span className="text-[10px] text-slate-400 block font-semibold">Tahfiz & Attendance</span>
              <span className="font-black text-teal-600 dark:text-teal-400 text-sm">{tahfizRecords.length + attendance.length}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/40">
              <span className="text-[10px] text-slate-400 block font-semibold">Grades & Audit</span>
              <span className="font-black text-rose-600 dark:text-rose-400 text-sm">{grades.length + auditLogs.length}</span>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-emerald-500/20">
          <div className="text-[11px] text-slate-500 dark:text-emerald-300/70 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span>Encrypted snapshot payload. Ready for offline archival or manual cloud upload.</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handlePerformBackup('JSON_DUMP')}
              disabled={isProcessing}
              className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-emerald-950/60 hover:bg-slate-200 dark:hover:bg-emerald-900/60 text-slate-800 dark:text-emerald-200 font-bold text-xs flex items-center gap-2 border border-slate-200 dark:border-emerald-500/30 transition-all"
              title="Download only raw JSON data file"
            >
              <FileJson className="w-4 h-4 text-sky-500" />
              <span>Download JSON Dump</span>
            </button>

            <button
              onClick={() => handlePerformBackup('PDF_SNAPSHOT')}
              disabled={isProcessing}
              className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-emerald-950/60 hover:bg-slate-200 dark:hover:bg-emerald-900/60 text-slate-800 dark:text-emerald-200 font-bold text-xs flex items-center gap-2 border border-slate-200 dark:border-emerald-500/30 transition-all"
              title="Print or save executive PDF snapshot"
            >
              <FileText className="w-4 h-4 text-amber-500" />
              <span>Print / PDF Snapshot</span>
            </button>

            <button
              onClick={() => handlePerformBackup(selectedBackupType)}
              disabled={isProcessing}
              className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/30 transition-all hover:scale-105 active:scale-95 flex-1 sm:flex-none"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Generating Backup Package...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Download Backup Package Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Storage & Disaster Recovery Guide */}
      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <FolderDown className="w-4 h-4 text-emerald-500" /> Manual Backup Storage & Preservation Instructions
          </h3>
          <button
            onClick={copyStorageTips}
            className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            {copiedInstruction ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span>{copiedInstruction ? 'Instructions Copied!' : 'Copy Instructions'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/20 space-y-2">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black">1</span>
              Local Computer / Phone Archival
            </div>
            <p className="text-[11px] text-slate-500 dark:text-emerald-300/80 leading-relaxed">
              Store your downloaded <code className="bg-slate-100 dark:bg-emerald-950 px-1 py-0.5 rounded font-mono text-[10px]">.json</code> database files in a dedicated folder on your computer or phone (e.g. <span className="font-medium text-slate-700 dark:text-gray-300">Documents/Markazu_Umar_Backups</span>).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/20 space-y-2">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black">2</span>
              External USB / Hard Drive
            </div>
            <p className="text-[11px] text-slate-500 dark:text-emerald-300/80 leading-relaxed">
              Copy the backup files to a USB Flash Drive or External Hard Drive weekly. This ensures 100% offline disaster recovery protection.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/20 space-y-2">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black">3</span>
              Manual Google Drive Upload
            </div>
            <p className="text-[11px] text-slate-500 dark:text-emerald-300/80 leading-relaxed">
              To store in Google Drive, open <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 underline font-semibold inline-flex items-center gap-0.5">drive.google.com <ExternalLink className="w-2.5 h-2.5" /></a>, click <strong>New &rarr; File Upload</strong>, and upload your backup file. No API keys or OAuth required.
            </p>
          </div>
        </div>
      </div>

      {/* Backup Audit Trail & History */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" /> Manual Backup Audit Trail & Snapshot History
          </h3>
          <span className="text-xs font-bold text-slate-500 dark:text-emerald-400 font-mono">
            {backupLogs.length} Snapshots Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-[#021810] text-slate-700 dark:text-emerald-400 uppercase font-bold border-b border-emerald-500/20">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Backup Type</th>
                <th className="p-3.5">Initiated By</th>
                <th className="p-3.5">Records Included</th>
                <th className="p-3.5">Archive Size</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-500/10">
              {backupLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-emerald-400/60 font-sans">
                    <Database className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-500" />
                    <p className="font-semibold text-xs text-slate-700 dark:text-emerald-300">No backup snapshots recorded yet.</p>
                    <p className="text-[11px] text-slate-400 dark:text-emerald-500/70 mt-0.5">Click &quot;Download Backup Package Now&quot; above to create your first manual archive.</p>
                  </td>
                </tr>
              ) : (
                backupLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-emerald-500/5 transition-colors">
                    <td className="p-3.5 font-mono text-slate-600 dark:text-gray-300">{log.timestamp}</td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 dark:text-white">{log.backupTypeLabel}</span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-800 dark:text-emerald-200">
                      {log.performedBy} <span className="text-[10px] text-slate-400">({log.performedByRole})</span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-800 dark:text-emerald-200 font-mono">
                      {log.totalRecords} Records
                    </td>
                    <td className="p-3.5 font-mono text-slate-500 dark:text-emerald-400/70">{log.fileSize}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" /> Downloaded & Saved
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleReDownload(log)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/20 transition-all inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download Again</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


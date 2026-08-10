import * as XLSX from 'xlsx';
import {
  Programme,
  Teacher,
  SchoolClass,
  RawExcelSchoolStructureRow,
  ValidatedImportRow,
  ParsedImportTeacherItem,
} from '@/types';

/**
 * Split raw teacher string into multiple individual teacher names
 * Handles separators like '&', ',', ' and ', '+'
 * e.g., "Mal. Asiya Muhammad Zangi & Mal. Fatima Abdulhadi Ibrahim"
 *    -> ["Mal. Asiya Muhammad Zangi", "Mal. Fatima Abdulhadi Ibrahim"]
 */
export function splitTeacherNames(rawText: string): string[] {
  if (!rawText || !rawText.trim()) return [];
  return rawText
    .split(/&|,|\band\b|\+/i)
    .map((n) => n.trim())
    .filter(Boolean);
}

/**
 * Normalize teacher name for intelligent matching
 * Strips common honorifics: "Mal.", "Malam", "Mallam", "Ustaz", "Dr.", "Mrs.", "Mr."
 */
export function normalizeTeacherName(name: string): string {
  if (!name) return '';
  return name
    .replace(/^(Mal\.|Malam|Mallam|Ustaz|Dr\.|Mr\.|Mrs\.|Ms\.)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Match a raw Excel teacher name against existing system teacher accounts
 */
export function matchTeacherToSystem(
  rawName: string,
  systemTeachers: Teacher[]
): ParsedImportTeacherItem {
  if (!rawName || !rawName.trim()) {
    return { rawName: '', isNotFound: false };
  }

  const normRaw = normalizeTeacherName(rawName);

  // 1. Exact or normalized match
  const matched = systemTeachers.find((t) => {
    const normEn = normalizeTeacherName(t.full_name_english || t.fullName);
    const normFull = normalizeTeacherName(t.fullName);
    if (normEn === normRaw || normFull === normRaw) return true;
    if (normEn.includes(normRaw) || normRaw.includes(normEn)) return true;
    if (normFull.includes(normRaw) || normRaw.includes(normFull)) return true;
    return false;
  });

  if (matched) {
    return {
      rawName,
      matchedTeacherId: matched.id,
      matchedTeacherName: matched.fullName,
      isNotFound: false,
    };
  }

  return {
    rawName,
    isNotFound: true,
  };
}

/**
 * Parse an Excel file buffer into raw school structure row objects
 */
export function parseSchoolStructureExcelBuffer(
  fileBuffer: ArrayBuffer
): RawExcelSchoolStructureRow[] {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const worksheet = workbook.Sheets[sheetName];
  const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  return jsonRows.map((row, index) => {
    // Flexibly match column headers
    const programme = String(row['Programme'] || row['programme'] || row['Program'] || '').trim();
    const subcategory = String(
      row['Subcategory (if any)'] ||
        row['Subcategory'] ||
        row['subcategory'] ||
        row['Sub-category'] ||
        ''
    ).trim();
    const className = String(
      row['Class Name'] || row['Class'] || row['className'] || row['Halqa'] || ''
    ).trim();
    const rawTeachers = String(
      row['Assigned Teacher'] ||
        row['Teacher'] ||
        row['Assigned Teachers'] ||
        row['Teachers'] ||
        ''
    ).trim();
    const rawSubjects = String(
      row['Subjects (Optional)'] || row['Subjects'] || row['Subject'] || ''
    ).trim();
    const notes = String(row['Notes'] || '').trim();

    return {
      programme,
      subcategory,
      className,
      rawTeachers,
      rawSubjects,
      notes,
      rowIndex: index + 2, // Excel row 2 is first data row
    };
  });
}

/**
 * Validate parsed raw rows against existing system programmes, teachers, and classes
 */
export function validateSchoolStructureRows(
  rawRows: RawExcelSchoolStructureRow[],
  systemProgrammes: Programme[],
  systemTeachers: Teacher[],
  existingClasses: SchoolClass[]
): {
  validatedRows: ValidatedImportRow[];
  emptyRowsCount: number;
  validRowsCount: number;
  warningRowsCount: number;
  errorRowsCount: number;
} {
  let emptyRowsCount = 0;
  let validRowsCount = 0;
  let warningRowsCount = 0;
  let errorRowsCount = 0;

  const validatedRows: ValidatedImportRow[] = rawRows.map((row) => {
    // 1. Empty Row Check: Class Name must be present!
    if (!row.className) {
      emptyRowsCount++;
      return {
        rowIndex: row.rowIndex,
        programmeName: row.programme,
        subcategory: row.subcategory,
        className: '',
        rawTeachers: row.rawTeachers,
        parsedTeachers: [],
        rawSubjects: row.rawSubjects,
        parsedSubjects: [],
        status: 'VALID',
        statusMessage: 'Empty row (ignored during import)',
        isEmptyRow: true,
      };
    }

    // 2. Programme Matching
    const matchedProg = systemProgrammes.find((p) => {
      const pName = (p.programme_name_english || p.programme_name).toLowerCase();
      const rName = row.programme.toLowerCase();
      return pName.includes(rName) || rName.includes(pName);
    });

    let status: 'VALID' | 'WARNING' | 'ERROR' = 'VALID';
    let messages: string[] = [];

    if (!matchedProg) {
      status = 'WARNING';
      messages.push(`Programme "${row.programme}" will be linked/created.`);
    }

    // 3. Subcategory Hierarchy Validation for "Asuba & Maghrib"
    if (row.programme.toLowerCase().includes('asuba')) {
      const allowedSubs = ['asuba', 'maghrib', 'tahfiz'];
      if (row.subcategory && !allowedSubs.includes(row.subcategory.toLowerCase())) {
        status = 'WARNING';
        messages.push(
          `Subcategory "${row.subcategory}" under Asuba & Maghrib should be Asuba, Maghrib, or Tahfiz.`
        );
      }
    }

    // 4. Multiple Teacher Parsing & Linking
    const rawTeacherNames = splitTeacherNames(row.rawTeachers);
    const parsedTeachers = rawTeacherNames.map((tName) =>
      matchTeacherToSystem(tName, systemTeachers)
    );

    const missingTeachers = parsedTeachers.filter((t) => t.isNotFound);
    if (missingTeachers.length > 0) {
      status = 'WARNING';
      const namesList = missingTeachers.map((t) => `"${t.rawName}"`).join(', ');
      messages.push(`Teacher account not found: ${namesList}. Please map or resolve.`);
    }

    // 5. Subject Parsing
    const parsedSubjects = row.rawSubjects
      ? row.rawSubjects
          .split(/,|\band\b|&/i)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    // 6. Duplicate Class Check
    const existingClass = existingClasses.find(
      (c) =>
        c.name.toLowerCase() === row.className.toLowerCase() &&
        (!matchedProg || c.programmeId === matchedProg.id)
    );

    if (existingClass) {
      messages.push(`Class "${row.className}" already exists (will update assigned teachers/subjects).`);
    }

    if (status === 'VALID') {
      validRowsCount++;
      if (messages.length === 0) {
        messages.push('Valid school structure entry.');
      }
    } else if (status === 'WARNING') {
      warningRowsCount++;
    } else {
      errorRowsCount++;
    }

    return {
      rowIndex: row.rowIndex,
      programmeName: row.programme,
      programmeId: matchedProg?.id,
      subcategory: row.subcategory,
      className: row.className,
      rawTeachers: row.rawTeachers,
      parsedTeachers,
      rawSubjects: row.rawSubjects,
      parsedSubjects,
      status,
      statusMessage: messages.join(' | '),
      isEmptyRow: false,
    };
  });

  return {
    validatedRows,
    emptyRowsCount,
    validRowsCount,
    warningRowsCount,
    errorRowsCount,
  };
}

/**
 * Authoritative Server-Side Qur'an Assessment Calculation Engine
 * 
 * Markazu Umar bn Al-Khattab Centre for Qur'an Memorization and Islamic Studies
 * 
 * CORE RULES:
 * - Pure configuration-driven calculation (never hard-coded thresholds or categories).
 * - For each individual candidate and mistake category, mistakes accumulate sequentially by day.
 * - Categories are strictly INDEPENDENT (never combined into one threshold).
 * - Disqualification occurs immediately on the day a category mistake count reaches its configured threshold.
 * - Identifies the exact trigger category, cumulative mistakes at trigger, applicable threshold, and day/date.
 */

export interface AssessmentRuleInput {
  id?: string;
  studentType: string;
  mistakeCategory: string;
  threshold: number;
  action?: string;
  active?: boolean;
}

export interface DailyRecordInput {
  dayNumber: number;
  date: Date | string;
  fromHizb?: string | null;
  toHizb?: string | null;
  tajweedMistakes?: number;
  tilawaMistakes?: number;
  categoryMistakes?: Record<string, any> | any;
  notes?: string | null;
}

export interface EngineCalculationResult {
  finalResult: 'QUALIFIED' | 'DISQUALIFIED' | 'PENDING';
  disqualificationReason: string | null;
  disqualificationMistakes: number | null;
  disqualificationThreshold: number | null;
  disqualifiedOnDay: number | null;
  disqualifiedDate: Date | null;
  totalMistakes: number;
  categoryTotals: Record<string, number>;
  statusSummary: string;
}

/**
 * Normalizes category names for consistent comparison while keeping original display names
 */
function normalizeCategoryKey(name: string): string {
  return name.trim().toLowerCase().replace(/[\s_-]+/g, ' ');
}

/**
 * Resolves day's mistakes for a specific category from either:
 * 1. categoryMistakes object (e.g. { "Lahanin Kalma": 1, "Tajweed": 2 })
 * 2. or legacy/form fallback columns (tajweedMistakes, tilawaMistakes)
 */
function getDayMistakesForCategory(
  record: DailyRecordInput,
  categoryName: string
): number {
  const normTarget = normalizeCategoryKey(categoryName);

  // Check dynamic categoryMistakes map first
  if (record.categoryMistakes && typeof record.categoryMistakes === 'object') {
    for (const [key, val] of Object.entries(record.categoryMistakes)) {
      if (normalizeCategoryKey(key) === normTarget) {
        return Math.max(0, Number(val) || 0);
      }
    }
  }

  // Fallbacks for standard form columns if dynamic map doesn't specify this key
  if (normTarget.includes('tajweed') && typeof record.tajweedMistakes === 'number') {
    return Math.max(0, record.tajweedMistakes);
  }

  if (
    (normTarget.includes('tilawa') || normTarget.includes('batar tilawa')) &&
    typeof record.tilawaMistakes === 'number'
  ) {
    return Math.max(0, record.tilawaMistakes);
  }

  return 0;
}

/**
 * Authoritative Evaluation Function
 */
export function evaluateQuranAssessment(
  rules: AssessmentRuleInput[],
  studentType: string,
  dailyRecords: DailyRecordInput[]
): EngineCalculationResult {
  // 1. Filter active rules matching this student type
  const targetStudentType = studentType.trim().toLowerCase();
  const applicableRules = rules.filter(
    (r) =>
      r.active !== false &&
      r.studentType.trim().toLowerCase() === targetStudentType &&
      r.threshold > 0
  );

  // Sort daily records chronologically by dayNumber
  const sortedRecords = [...dailyRecords].sort((a, b) => a.dayNumber - b.dayNumber);

  // Initialize accumulators
  const categoryRunningTotals: Record<string, number> = {};
  for (const rule of applicableRules) {
    categoryRunningTotals[rule.mistakeCategory] = 0;
  }

  let totalMistakes = 0;
  let isDisqualified = false;
  let disqualificationReason: string | null = null;
  let disqualificationMistakes: number | null = null;
  let disqualificationThreshold: number | null = null;
  let disqualifiedOnDay: number | null = null;
  let disqualifiedDate: Date | null = null;

  // Process day by day
  for (const day of sortedRecords) {
    for (const rule of applicableRules) {
      const category = rule.mistakeCategory;
      const countThisDay = getDayMistakesForCategory(day, category);

      categoryRunningTotals[category] = (categoryRunningTotals[category] || 0) + countThisDay;
      totalMistakes += countThisDay;

      // Check if threshold reached
      if (!isDisqualified && categoryRunningTotals[category] >= rule.threshold) {
        isDisqualified = true;
        disqualificationReason = category;
        disqualificationMistakes = categoryRunningTotals[category];
        disqualificationThreshold = rule.threshold;
        disqualifiedOnDay = day.dayNumber;
        disqualifiedDate = day.date ? new Date(day.date) : null;
      }
    }
  }

  // Also include any other category entries recorded in categoryMistakes that might not have explicit rules
  for (const day of sortedRecords) {
    if (day.categoryMistakes && typeof day.categoryMistakes === 'object') {
      for (const [key, val] of Object.entries(day.categoryMistakes)) {
        const found = applicableRules.some(
          (r) => normalizeCategoryKey(r.mistakeCategory) === normalizeCategoryKey(key)
        );
        if (!found) {
          categoryRunningTotals[key] = (categoryRunningTotals[key] || 0) + Math.max(0, Number(val) || 0);
          totalMistakes += Math.max(0, Number(val) || 0);
        }
      }
    }
  }

  if (isDisqualified) {
    return {
      finalResult: 'DISQUALIFIED',
      disqualificationReason,
      disqualificationMistakes,
      disqualificationThreshold,
      disqualifiedOnDay,
      disqualifiedDate,
      totalMistakes,
      categoryTotals: categoryRunningTotals,
      statusSummary: `Disqualified on Day ${disqualifiedOnDay} due to ${disqualificationReason} (${disqualificationMistakes}/${disqualificationThreshold} mistakes reached).`,
    };
  }

  const hasData = sortedRecords.length > 0;
  return {
    finalResult: hasData ? 'QUALIFIED' : 'PENDING',
    disqualificationReason: null,
    disqualificationMistakes: null,
    disqualificationThreshold: null,
    disqualifiedOnDay: null,
    disqualifiedDate: null,
    totalMistakes,
    categoryTotals: categoryRunningTotals,
    statusSummary: hasData
      ? `Qualified: All mistake categories remain strictly within thresholds.`
      : `Pending: No assessment daily records entered yet.`,
  };
}

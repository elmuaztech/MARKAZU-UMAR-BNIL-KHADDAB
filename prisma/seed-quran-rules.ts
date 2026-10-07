import { PrismaClient, RuleSetStatus, AssessmentEventStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedQuranAssessmentRules() {
  console.log('[SEED] Checking initial Markazu Qur\'an Assessment Rules...');

  // Check if an active rule set already exists
  const existingActive = await prisma.assessmentRuleSet.findFirst({
    where: {
      status: RuleSetStatus.ACTIVE,
    },
    include: {
      rules: true,
    },
  });

  let ruleSet = existingActive;

  if (!ruleSet) {
    console.log('[SEED] Creating Initial Markazu Rule Set v1...');
    ruleSet = await prisma.assessmentRuleSet.create({
      data: {
        name: "Markazu Standard Qur'an Assessment Rules",
        description: "Official 30-day physical assessment rules approved for Markazu Umar bn Al-Khattab.",
        version: 1,
        status: RuleSetStatus.ACTIVE,
        effectiveFrom: new Date('2026-01-01'),
        createdBy: 'System Super Admin',
        rules: {
          create: [
            // Student Type: Masu Biye
            {
              studentType: 'Masu Biye',
              mistakeCategory: 'Lahanin Kalma',
              threshold: 2,
              action: 'DISQUALIFY',
              active: true,
            },
            {
              studentType: 'Masu Biye',
              mistakeCategory: 'Lahanin Harafi',
              threshold: 3,
              action: 'DISQUALIFY',
              active: true,
            },
            {
              studentType: 'Masu Biye',
              mistakeCategory: 'Lahanin Wasali',
              threshold: 3,
              action: 'DISQUALIFY',
              active: true,
            },
            // Student Type: Masu Haddah
            {
              studentType: 'Masu Haddah',
              mistakeCategory: 'Batar Tilawa',
              threshold: 3,
              action: 'DISQUALIFY',
              active: true,
            },
            {
              studentType: 'Masu Haddah',
              mistakeCategory: 'Tajweed',
              threshold: 3,
              action: 'DISQUALIFY',
              active: true,
            },
            {
              studentType: 'Masu Haddah',
              mistakeCategory: 'Wasali',
              threshold: 3,
              action: 'DISQUALIFY',
              active: true,
            },
          ],
        },
      },
      include: {
        rules: true,
      },
    });

    console.log(`[SEED] Created Rule Set v1 (${ruleSet.id}) with ${ruleSet.rules.length} rules.`);

    // Record audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'QURAN_RULESET_CREATED',
        performedBy: 'System Super Admin',
        userRole: 'SUPER_ADMIN',
        details: JSON.stringify({
          ruleSetId: ruleSet.id,
          name: ruleSet.name,
          version: ruleSet.version,
          rulesCount: ruleSet.rules.length,
          status: 'ACTIVE',
        }),
        status: 'SUCCESS',
      },
    });
  } else {
    console.log(`[SEED] Found existing Rule Set v${ruleSet.version} (${ruleSet.id}) with ${ruleSet.rules.length} rules.`);
  }

  // Ensure an initial Assessment Event exists for easy portal usage
  const activeSession = await prisma.schoolSession.findFirst({
    where: { isCurrent: true },
  });

  const existingEvent = await prisma.assessmentEvent.findFirst({
    where: { status: AssessmentEventStatus.ACTIVE },
  });

  if (!existingEvent && ruleSet) {
    const event = await prisma.assessmentEvent.create({
      data: {
        name: "Annual Markazu Qur'an Assessment 2026",
        description: "Official 30-day Qur'an memorization and recitation assessment session.",
        academicSessionId: activeSession?.id || null,
        ruleSetId: ruleSet.id,
        status: AssessmentEventStatus.ACTIVE,
        durationDays: 30,
        startDate: new Date('2026-01-10'),
        endDate: new Date('2026-02-10'),
        createdBy: 'System Super Admin',
      },
    });
    console.log(`[SEED] Created initial Assessment Event: "${event.name}" (${event.id})`);
  }

  return ruleSet;
}

seedQuranAssessmentRules()
  .then(() => {
    console.log('[SEED] Seeding completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[SEED] Error seeding:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());


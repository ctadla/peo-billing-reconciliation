import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { invoices, billedRosterMembers, retroAdjustments, postCutoffChanges } from "@shared/schema";

async function seedPEO() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log("Seeding additional PEO companies...");

  const [bhMar] = await db.insert(invoices).values({
    coveragePeriodStart: "2026-03-01",
    coveragePeriodEnd: "2026-03-31",
    invoiceGeneratedAt: new Date("2026-02-05T09:30:00-08:00"),
    cutoffTimestamp: new Date("2026-02-04T23:59:00-08:00"),
    invoiceId: "INV-2026-03-9922",
    batchId: "ACH-998212",
    totalRemitted: "18320.00",
    retroTotal: "240.00",
    basePremiumTotal: "18080.00",
    companyName: "Bright Horizons Consulting",
  }).returning();

  const [bhFeb] = await db.insert(invoices).values({
    coveragePeriodStart: "2026-02-01",
    coveragePeriodEnd: "2026-02-28",
    invoiceGeneratedAt: new Date("2026-01-05T10:00:00-08:00"),
    cutoffTimestamp: new Date("2026-01-04T23:59:00-08:00"),
    invoiceId: "INV-2026-02-8811",
    batchId: "ACH-991005",
    totalRemitted: "17900.00",
    retroTotal: "0.00",
    basePremiumTotal: "17900.00",
    companyName: "Bright Horizons Consulting",
  }).returning();

  const [bhJan] = await db.insert(invoices).values({
    coveragePeriodStart: "2026-01-01",
    coveragePeriodEnd: "2026-01-31",
    invoiceGeneratedAt: new Date("2025-12-05T09:00:00-08:00"),
    cutoffTimestamp: new Date("2025-12-04T23:59:00-08:00"),
    invoiceId: "INV-2026-01-7703",
    batchId: "ACH-988751",
    totalRemitted: "17500.00",
    retroTotal: "-120.00",
    basePremiumTotal: "17620.00",
    companyName: "Bright Horizons Consulting",
  }).returning();

  await db.insert(billedRosterMembers).values([
    { invoiceId: bhMar.id, worksite: "Denver HQ", memberName: "Maria Garcia", employeeId: "BH001", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Aetna Select PPO", tier: "Family", coverageEffectiveDate: "2025-01-01", monthlyPremium: "1780.00", employeeCost: "620.00", dependentCost: "1160.00" },
    { invoiceId: bhMar.id, worksite: "Denver HQ", memberName: "Maria Garcia", employeeId: "BH001", carrier: "Guardian", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Family", coverageEffectiveDate: "2025-01-01", monthlyPremium: "125.00", employeeCost: "45.00", dependentCost: "80.00" },
    { invoiceId: bhMar.id, worksite: "Denver HQ", memberName: "Maria Garcia", employeeId: "BH001", carrier: "Guardian", lineOfCoverage: "Vision", plan: "Guardian Vision", tier: "Family", coverageEffectiveDate: "2025-01-01", monthlyPremium: "32.00", employeeCost: "12.00", dependentCost: "20.00" },
    { invoiceId: bhMar.id, worksite: "Denver HQ", memberName: "Maria Garcia", employeeId: "BH001", carrier: "Guardian", lineOfCoverage: "Life/Disability", plan: "Guardian Life & AD&D", tier: "Employee Only", coverageEffectiveDate: "2025-01-01", monthlyPremium: "18.50", employeeCost: "18.50", dependentCost: "0.00" },
    { invoiceId: bhMar.id, worksite: "Denver HQ", memberName: "James Wilson", employeeId: "BH002", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Aetna Select PPO", tier: "Employee Only", coverageEffectiveDate: "2025-06-01", monthlyPremium: "620.00", employeeCost: "620.00", dependentCost: "0.00" },
    { invoiceId: bhMar.id, worksite: "Denver HQ", memberName: "James Wilson", employeeId: "BH002", carrier: "Guardian", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Employee Only", coverageEffectiveDate: "2025-06-01", monthlyPremium: "45.00", employeeCost: "45.00", dependentCost: "0.00" },
    { invoiceId: bhMar.id, worksite: "Denver HQ", memberName: "James Wilson", employeeId: "BH002", carrier: "Guardian", lineOfCoverage: "Vision", plan: "Guardian Vision", tier: "Employee Only", coverageEffectiveDate: "2025-06-01", monthlyPremium: "12.00", employeeCost: "12.00", dependentCost: "0.00" },
    { invoiceId: bhMar.id, worksite: "Denver HQ", memberName: "James Wilson", employeeId: "BH002", carrier: "Guardian", lineOfCoverage: "Life/Disability", plan: "Guardian Life & AD&D", tier: "Employee Only", coverageEffectiveDate: "2025-06-01", monthlyPremium: "18.50", employeeCost: "18.50", dependentCost: "0.00" },
  ]);

  await db.insert(retroAdjustments).values([
    { invoiceId: bhMar.id, worksite: "Denver HQ", memberName: "Maria Garcia", eventType: "Benefit Change", originalPeriod: "Feb 2026", effectiveDate: "2026-02-10", amount: "155.00", reasonCode: "New dependent added via birth", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Aetna Select PPO", tier: "Family", processedAt: new Date("2026-02-03T11:00:00-08:00") },
    { invoiceId: bhMar.id, worksite: "Denver HQ", memberName: "Maria Garcia", eventType: "Benefit Change", originalPeriod: "Feb 2026", effectiveDate: "2026-02-10", amount: "40.00", reasonCode: "New dependent added via birth", carrier: "Guardian", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Family", processedAt: new Date("2026-02-03T11:00:00-08:00") },
    { invoiceId: bhMar.id, worksite: "Denver HQ", memberName: "Maria Garcia", eventType: "Benefit Change", originalPeriod: "Feb 2026", effectiveDate: "2026-02-10", amount: "25.00", reasonCode: "New dependent added via birth", carrier: "Guardian", lineOfCoverage: "Vision", plan: "Guardian Vision", tier: "Family", processedAt: new Date("2026-02-03T11:00:00-08:00") },
    { invoiceId: bhMar.id, worksite: "Denver HQ", memberName: "Maria Garcia", eventType: "Benefit Change", originalPeriod: "Feb 2026", effectiveDate: "2026-02-10", amount: "20.00", reasonCode: "New dependent added via birth", carrier: "Guardian", lineOfCoverage: "Life/Disability", plan: "Guardian Life & AD&D", tier: "Employee Only", processedAt: new Date("2026-02-03T11:00:00-08:00") },
  ]);

  await db.insert(retroAdjustments).values([
    { invoiceId: bhJan.id, worksite: "Denver HQ", memberName: "Tom Harris", eventType: "Cancelled Benefits", originalPeriod: "Dec 2025", effectiveDate: "2025-12-01", amount: "-62.00", reasonCode: "Late plan correction refund", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Aetna Select PPO", tier: "Employee Only", processedAt: new Date("2025-12-02T15:00:00-08:00") },
    { invoiceId: bhJan.id, worksite: "Denver HQ", memberName: "Tom Harris", eventType: "Cancelled Benefits", originalPeriod: "Dec 2025", effectiveDate: "2025-12-01", amount: "-22.50", reasonCode: "Late plan correction refund", carrier: "Guardian", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Employee Only", processedAt: new Date("2025-12-02T15:00:00-08:00") },
    { invoiceId: bhJan.id, worksite: "Denver HQ", memberName: "Tom Harris", eventType: "Cancelled Benefits", originalPeriod: "Dec 2025", effectiveDate: "2025-12-01", amount: "-17.00", reasonCode: "Late plan correction refund", carrier: "Guardian", lineOfCoverage: "Vision", plan: "Guardian Vision", tier: "Employee Only", processedAt: new Date("2025-12-02T15:00:00-08:00") },
    { invoiceId: bhJan.id, worksite: "Denver HQ", memberName: "Tom Harris", eventType: "Cancelled Benefits", originalPeriod: "Dec 2025", effectiveDate: "2025-12-01", amount: "-18.50", reasonCode: "Late plan correction refund", carrier: "Guardian", lineOfCoverage: "Life/Disability", plan: "Guardian Life & AD&D", tier: "Employee Only", processedAt: new Date("2025-12-02T15:00:00-08:00") },
  ]);

  const [cdMar] = await db.insert(invoices).values({
    coveragePeriodStart: "2026-03-01",
    coveragePeriodEnd: "2026-03-31",
    invoiceGeneratedAt: new Date("2026-02-05T09:45:00-08:00"),
    cutoffTimestamp: new Date("2026-02-04T23:59:00-08:00"),
    invoiceId: "INV-2026-03-9923",
    batchId: "ACH-998213",
    totalRemitted: "9850.00",
    retroTotal: "-175.00",
    basePremiumTotal: "10025.00",
    companyName: "Cascade Digital Solutions",
  }).returning();

  await db.insert(billedRosterMembers).values([
    { invoiceId: cdMar.id, worksite: "Seattle Office", memberName: "Priya Patel", employeeId: "CD001", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Premera Blue Cross", tier: "Employee Only", coverageEffectiveDate: "2025-03-01", monthlyPremium: "590.00", employeeCost: "590.00", dependentCost: "0.00" },
    { invoiceId: cdMar.id, worksite: "Seattle Office", memberName: "Priya Patel", employeeId: "CD001", carrier: "Guardian", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Employee Only", coverageEffectiveDate: "2025-03-01", monthlyPremium: "45.00", employeeCost: "45.00", dependentCost: "0.00" },
    { invoiceId: cdMar.id, worksite: "Seattle Office", memberName: "Priya Patel", employeeId: "CD001", carrier: "Guardian", lineOfCoverage: "Vision", plan: "Guardian Vision", tier: "Employee Only", coverageEffectiveDate: "2025-03-01", monthlyPremium: "12.00", employeeCost: "12.00", dependentCost: "0.00" },
    { invoiceId: cdMar.id, worksite: "Seattle Office", memberName: "Priya Patel", employeeId: "CD001", carrier: "Guardian", lineOfCoverage: "Life/Disability", plan: "Guardian Life & AD&D", tier: "Employee Only", coverageEffectiveDate: "2025-03-01", monthlyPremium: "18.50", employeeCost: "18.50", dependentCost: "0.00" },
    { invoiceId: cdMar.id, worksite: "Seattle Office", memberName: "Derek Tanaka", employeeId: "CD003", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Premera Blue Cross", tier: "Employee + Children", coverageEffectiveDate: "2025-01-01", monthlyPremium: "980.00", employeeCost: "590.00", dependentCost: "390.00" },
    { invoiceId: cdMar.id, worksite: "Seattle Office", memberName: "Derek Tanaka", employeeId: "CD003", carrier: "Guardian", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Employee + Children", coverageEffectiveDate: "2025-01-01", monthlyPremium: "95.00", employeeCost: "45.00", dependentCost: "50.00" },
    { invoiceId: cdMar.id, worksite: "Seattle Office", memberName: "Derek Tanaka", employeeId: "CD003", carrier: "Guardian", lineOfCoverage: "Vision", plan: "Guardian Vision", tier: "Employee + Children", coverageEffectiveDate: "2025-01-01", monthlyPremium: "28.00", employeeCost: "12.00", dependentCost: "16.00" },
    { invoiceId: cdMar.id, worksite: "Seattle Office", memberName: "Derek Tanaka", employeeId: "CD003", carrier: "Guardian", lineOfCoverage: "Life/Disability", plan: "Guardian Life & AD&D", tier: "Employee Only", coverageEffectiveDate: "2025-01-01", monthlyPremium: "18.50", employeeCost: "18.50", dependentCost: "0.00" },
    { invoiceId: cdMar.id, worksite: "Remote - WA", memberName: "Nina Reeves", employeeId: "CD006", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Premera Blue Cross", tier: "Family", coverageEffectiveDate: "2026-01-01", monthlyPremium: "1650.00", employeeCost: "590.00", dependentCost: "1060.00", flags: ["Manual Override"] },
    { invoiceId: cdMar.id, worksite: "Remote - WA", memberName: "Nina Reeves", employeeId: "CD006", carrier: "Guardian", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Family", coverageEffectiveDate: "2026-01-01", monthlyPremium: "125.00", employeeCost: "45.00", dependentCost: "80.00" },
    { invoiceId: cdMar.id, worksite: "Remote - WA", memberName: "Nina Reeves", employeeId: "CD006", carrier: "Guardian", lineOfCoverage: "Vision", plan: "Guardian Vision", tier: "Family", coverageEffectiveDate: "2026-01-01", monthlyPremium: "32.00", employeeCost: "12.00", dependentCost: "20.00" },
    { invoiceId: cdMar.id, worksite: "Remote - WA", memberName: "Nina Reeves", employeeId: "CD006", carrier: "Guardian", lineOfCoverage: "Life/Disability", plan: "Guardian Life & AD&D", tier: "Employee Only", coverageEffectiveDate: "2026-01-01", monthlyPremium: "18.50", employeeCost: "18.50", dependentCost: "0.00" },
  ]);

  await db.insert(retroAdjustments).values([
    { invoiceId: cdMar.id, worksite: "Seattle Office", memberName: "Derek Tanaka", eventType: "Cancelled Benefits", originalPeriod: "Feb 2026", effectiveDate: "2026-02-20", amount: "-98.00", reasonCode: "Dependent aged out - tier change", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Premera Blue Cross", tier: "Employee + Children", processedAt: new Date("2026-02-03T09:30:00-08:00") },
    { invoiceId: cdMar.id, worksite: "Seattle Office", memberName: "Derek Tanaka", eventType: "Cancelled Benefits", originalPeriod: "Feb 2026", effectiveDate: "2026-02-20", amount: "-35.00", reasonCode: "Dependent aged out - tier change", carrier: "Guardian", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Employee + Children", processedAt: new Date("2026-02-03T09:30:00-08:00") },
    { invoiceId: cdMar.id, worksite: "Seattle Office", memberName: "Derek Tanaka", eventType: "Cancelled Benefits", originalPeriod: "Feb 2026", effectiveDate: "2026-02-20", amount: "-24.00", reasonCode: "Dependent aged out - tier change", carrier: "Guardian", lineOfCoverage: "Vision", plan: "Guardian Vision", tier: "Employee + Children", processedAt: new Date("2026-02-03T09:30:00-08:00") },
    { invoiceId: cdMar.id, worksite: "Seattle Office", memberName: "Derek Tanaka", eventType: "Cancelled Benefits", originalPeriod: "Feb 2026", effectiveDate: "2026-02-20", amount: "-18.00", reasonCode: "Dependent aged out - tier change", carrier: "Guardian", lineOfCoverage: "Life/Disability", plan: "Guardian Life & AD&D", tier: "Employee Only", processedAt: new Date("2026-02-03T09:30:00-08:00") },
  ]);

  await db.insert(postCutoffChanges).values([
    { invoiceId: cdMar.id, worksite: "Seattle Office", memberName: "Ryan Cho", eventType: "New Hire Enrollment", effectiveDate: "2026-03-10", expectedPremium: "590.00", expectedMonth: "April 2026 Invoice", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Premera Blue Cross", tier: "Employee Only", processedAt: new Date("2026-02-07T14:00:00-08:00") },
    { invoiceId: cdMar.id, worksite: "Seattle Office", memberName: "Ryan Cho", eventType: "New Hire Enrollment", effectiveDate: "2026-03-10", expectedPremium: "45.00", expectedMonth: "April 2026 Invoice", carrier: "Guardian", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Employee Only", processedAt: new Date("2026-02-07T14:00:00-08:00") },
    { invoiceId: cdMar.id, worksite: "Seattle Office", memberName: "Ryan Cho", eventType: "New Hire Enrollment", effectiveDate: "2026-03-10", expectedPremium: "12.00", expectedMonth: "April 2026 Invoice", carrier: "Guardian", lineOfCoverage: "Vision", plan: "Guardian Vision", tier: "Employee Only", processedAt: new Date("2026-02-07T14:00:00-08:00") },
    { invoiceId: cdMar.id, worksite: "Seattle Office", memberName: "Ryan Cho", eventType: "New Hire Enrollment", effectiveDate: "2026-03-10", expectedPremium: "18.50", expectedMonth: "April 2026 Invoice", carrier: "Guardian", lineOfCoverage: "Life/Disability", plan: "Guardian Life & AD&D", tier: "Employee Only", processedAt: new Date("2026-02-07T14:00:00-08:00") },
  ]);

  console.log("PEO seed complete!");
  await pool.end();
}

seedPEO().catch(console.error);

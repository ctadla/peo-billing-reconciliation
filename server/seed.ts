import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { invoices, billedRosterMembers, retroAdjustments, postCutoffChanges } from "@shared/schema";

async function seed() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  const existing = await db.select().from(invoices);
  if (existing.length > 0) {
    console.log("Database already seeded, skipping.");
    await pool.end();
    return;
  }

  console.log("Seeding database...");

  const [marchInv] = await db.insert(invoices).values({
    coveragePeriodStart: "2026-03-01",
    coveragePeriodEnd: "2026-03-31",
    invoiceGeneratedAt: new Date("2026-02-05T09:12:00-08:00"),
    cutoffTimestamp: new Date("2026-02-04T23:59:00-08:00"),
    invoiceId: "INV-2026-03-9921",
    batchId: "ACH-998211",
    totalRemitted: "24550.00",
    retroTotal: "-320.50",
    basePremiumTotal: "24870.50",
  }).returning();

  const [febInv] = await db.insert(invoices).values({
    coveragePeriodStart: "2026-02-01",
    coveragePeriodEnd: "2026-02-28",
    invoiceGeneratedAt: new Date("2026-01-05T10:30:00-08:00"),
    cutoffTimestamp: new Date("2026-01-04T23:59:00-08:00"),
    invoiceId: "INV-2026-02-8810",
    batchId: "ACH-991004",
    totalRemitted: "23100.00",
    retroTotal: "150.00",
    basePremiumTotal: "22950.00",
  }).returning();

  const [janInv] = await db.insert(invoices).values({
    coveragePeriodStart: "2026-01-01",
    coveragePeriodEnd: "2026-01-31",
    invoiceGeneratedAt: new Date("2025-12-05T08:45:00-08:00"),
    cutoffTimestamp: new Date("2025-12-04T23:59:00-08:00"),
    invoiceId: "INV-2026-01-7702",
    batchId: "ACH-988750",
    totalRemitted: "22400.00",
    retroTotal: "-85.00",
    basePremiumTotal: "22485.00",
  }).returning();

  await db.insert(billedRosterMembers).values([
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Alice Johnson", employeeId: "E001", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Kaiser Silver HMO", tier: "Employee Only", coverageEffectiveDate: "2026-01-01", monthlyPremium: "650.00", employeeCost: "650.00", dependentCost: "0.00" },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Alice Johnson", employeeId: "E001", carrier: "Guardian", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Employee Only", coverageEffectiveDate: "2026-01-01", monthlyPremium: "45.00", employeeCost: "45.00", dependentCost: "0.00" },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Alice Johnson", employeeId: "E001", carrier: "Guardian", lineOfCoverage: "Vision", plan: "Guardian Vision", tier: "Employee Only", coverageEffectiveDate: "2026-01-01", monthlyPremium: "12.00", employeeCost: "12.00", dependentCost: "0.00" },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Alice Johnson", employeeId: "E001", carrier: "Guardian", lineOfCoverage: "Life/Disability", plan: "Guardian Life & AD&D", tier: "Employee Only", coverageEffectiveDate: "2026-01-01", monthlyPremium: "18.50", employeeCost: "18.50", dependentCost: "0.00" },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Bob Smith", employeeId: "E002", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Kaiser Gold PPO", tier: "Family", coverageEffectiveDate: "2025-01-01", monthlyPremium: "1850.00", employeeCost: "650.00", dependentCost: "1200.00", flags: ["Late Event"] },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Bob Smith", employeeId: "E002", carrier: "Guardian", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Family", coverageEffectiveDate: "2025-01-01", monthlyPremium: "125.00", employeeCost: "45.00", dependentCost: "80.00" },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Bob Smith", employeeId: "E002", carrier: "Guardian", lineOfCoverage: "Vision", plan: "Guardian Vision", tier: "Family", coverageEffectiveDate: "2025-01-01", monthlyPremium: "32.00", employeeCost: "12.00", dependentCost: "20.00" },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Bob Smith", employeeId: "E002", carrier: "Guardian", lineOfCoverage: "Life/Disability", plan: "Guardian Life & AD&D", tier: "Employee Only", coverageEffectiveDate: "2025-01-01", monthlyPremium: "18.50", employeeCost: "18.50", dependentCost: "0.00" },
    { invoiceId: marchInv.id, worksite: "Remote - NY", memberName: "Charlie Davis", employeeId: "E005", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Anthem Blue Cross PPO", tier: "Employee + Spouse", coverageEffectiveDate: "2026-03-01", monthlyPremium: "1200.00", employeeCost: "580.00", dependentCost: "620.00", flags: ["Prorated"] },
    { invoiceId: marchInv.id, worksite: "Remote - NY", memberName: "Charlie Davis", employeeId: "E005", carrier: "Guardian", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Employee + Spouse", coverageEffectiveDate: "2026-03-01", monthlyPremium: "78.00", employeeCost: "45.00", dependentCost: "33.00", flags: ["Prorated"] },
    { invoiceId: marchInv.id, worksite: "Remote - NY", memberName: "Charlie Davis", employeeId: "E005", carrier: "Guardian", lineOfCoverage: "Vision", plan: "Guardian Vision", tier: "Employee + Spouse", coverageEffectiveDate: "2026-03-01", monthlyPremium: "22.00", employeeCost: "12.00", dependentCost: "10.00" },
    { invoiceId: marchInv.id, worksite: "Remote - NY", memberName: "Charlie Davis", employeeId: "E005", carrier: "Guardian", lineOfCoverage: "Life/Disability", plan: "Guardian Life & AD&D", tier: "Employee Only", coverageEffectiveDate: "2026-03-01", monthlyPremium: "18.50", employeeCost: "18.50", dependentCost: "0.00" },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Diana Prince", employeeId: "E008", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Kaiser Silver HMO", tier: "Employee Only", coverageEffectiveDate: "2024-01-01", monthlyPremium: "650.00", employeeCost: "650.00", dependentCost: "0.00" },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Diana Prince", employeeId: "E008", carrier: "Guardian", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Employee Only", coverageEffectiveDate: "2024-01-01", monthlyPremium: "45.00", employeeCost: "45.00", dependentCost: "0.00" },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Diana Prince", employeeId: "E008", carrier: "Guardian", lineOfCoverage: "Vision", plan: "Guardian Vision", tier: "Employee Only", coverageEffectiveDate: "2024-01-01", monthlyPremium: "12.00", employeeCost: "12.00", dependentCost: "0.00" },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Diana Prince", employeeId: "E008", carrier: "Guardian", lineOfCoverage: "Life/Disability", plan: "Guardian Life & AD&D", tier: "Employee Only", coverageEffectiveDate: "2024-01-01", monthlyPremium: "18.50", employeeCost: "18.50", dependentCost: "0.00" },
    { invoiceId: marchInv.id, worksite: "Remote - TX", memberName: "Evan Wright", employeeId: "E012", carrier: "Aetna", lineOfCoverage: "Medical", plan: "UHC Choice Plus", tier: "Employee + Children", coverageEffectiveDate: "2026-02-15", monthlyPremium: "950.00", employeeCost: "580.00", dependentCost: "370.00" },
    { invoiceId: marchInv.id, worksite: "Remote - TX", memberName: "Evan Wright", employeeId: "E012", carrier: "Guardian", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Employee + Children", coverageEffectiveDate: "2026-02-15", monthlyPremium: "95.00", employeeCost: "45.00", dependentCost: "50.00" },
    { invoiceId: marchInv.id, worksite: "Remote - TX", memberName: "Evan Wright", employeeId: "E012", carrier: "Guardian", lineOfCoverage: "Vision", plan: "Guardian Vision", tier: "Employee + Children", coverageEffectiveDate: "2026-02-15", monthlyPremium: "28.00", employeeCost: "12.00", dependentCost: "16.00" },
    { invoiceId: marchInv.id, worksite: "Remote - TX", memberName: "Evan Wright", employeeId: "E012", carrier: "Guardian", lineOfCoverage: "Life/Disability", plan: "Guardian Life & AD&D", tier: "Employee Only", coverageEffectiveDate: "2026-02-15", monthlyPremium: "18.50", employeeCost: "18.50", dependentCost: "0.00" },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Fiona Chen", employeeId: "E015", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Kaiser Gold PPO", tier: "Employee + Spouse", coverageEffectiveDate: "2025-06-01", monthlyPremium: "1420.00", employeeCost: "650.00", dependentCost: "770.00" },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Fiona Chen", employeeId: "E015", carrier: "Guardian", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Employee + Spouse", coverageEffectiveDate: "2025-06-01", monthlyPremium: "78.00", employeeCost: "45.00", dependentCost: "33.00" },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Fiona Chen", employeeId: "E015", carrier: "Guardian", lineOfCoverage: "Vision", plan: "Guardian Vision", tier: "Employee + Spouse", coverageEffectiveDate: "2025-06-01", monthlyPremium: "22.00", employeeCost: "12.00", dependentCost: "10.00" },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Fiona Chen", employeeId: "E015", carrier: "Guardian", lineOfCoverage: "Life/Disability", plan: "Guardian Life & AD&D", tier: "Employee Only", coverageEffectiveDate: "2025-06-01", monthlyPremium: "18.50", employeeCost: "18.50", dependentCost: "0.00" },
    { invoiceId: marchInv.id, worksite: "Remote - NY", memberName: "George Kim", employeeId: "E018", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Anthem Blue Cross PPO", tier: "Employee Only", coverageEffectiveDate: "2025-09-01", monthlyPremium: "580.00", employeeCost: "580.00", dependentCost: "0.00" },
    { invoiceId: marchInv.id, worksite: "Remote - NY", memberName: "George Kim", employeeId: "E018", carrier: "Guardian", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Employee Only", coverageEffectiveDate: "2025-09-01", monthlyPremium: "45.00", employeeCost: "45.00", dependentCost: "0.00" },
    { invoiceId: marchInv.id, worksite: "Remote - NY", memberName: "George Kim", employeeId: "E018", carrier: "Guardian", lineOfCoverage: "Vision", plan: "Guardian Vision", tier: "Employee Only", coverageEffectiveDate: "2025-09-01", monthlyPremium: "12.00", employeeCost: "12.00", dependentCost: "0.00" },
    { invoiceId: marchInv.id, worksite: "Remote - NY", memberName: "George Kim", employeeId: "E018", carrier: "Guardian", lineOfCoverage: "Life/Disability", plan: "Guardian Life & AD&D", tier: "Employee Only", coverageEffectiveDate: "2025-09-01", monthlyPremium: "18.50", employeeCost: "18.50", dependentCost: "0.00" },
  ]);

  await db.insert(retroAdjustments).values([
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Bob Smith", eventType: "Benefit Change", originalPeriod: "Feb 2026", effectiveDate: "2026-02-01", amount: "120.00", reasonCode: "Added dependent retroactively", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Kaiser Gold PPO", tier: "Family", processedAt: new Date("2026-02-02T14:30:00-08:00") },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Bob Smith", eventType: "Benefit Change", originalPeriod: "Feb 2026", effectiveDate: "2026-02-01", amount: "40.00", reasonCode: "Added dependent retroactively", carrier: "Guardian", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Family", processedAt: new Date("2026-02-02T14:30:00-08:00") },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Bob Smith", eventType: "Benefit Change", originalPeriod: "Feb 2026", effectiveDate: "2026-02-01", amount: "15.00", reasonCode: "Added dependent retroactively", carrier: "Guardian", lineOfCoverage: "Vision", plan: "Guardian Vision", tier: "Family", processedAt: new Date("2026-02-02T14:30:00-08:00") },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Bob Smith", eventType: "Benefit Change", originalPeriod: "Feb 2026", effectiveDate: "2026-02-01", amount: "10.00", reasonCode: "Added dependent retroactively", carrier: "Guardian", lineOfCoverage: "Life/Disability", plan: "Guardian Life & AD&D", tier: "Employee Only", processedAt: new Date("2026-02-02T14:30:00-08:00") },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Sarah Connor", eventType: "Cancelled Coverage", originalPeriod: "Jan 2026", effectiveDate: "2026-01-15", amount: "-325.00", reasonCode: "Terminated mid-month", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Kaiser Silver HMO", tier: "Employee Only", processedAt: new Date("2026-02-01T09:15:00-08:00") },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Sarah Connor", eventType: "Cancelled Coverage", originalPeriod: "Jan 2026", effectiveDate: "2026-01-15", amount: "-22.50", reasonCode: "Terminated mid-month", carrier: "Guardian", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Employee Only", processedAt: new Date("2026-02-01T09:15:00-08:00") },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Sarah Connor", eventType: "Cancelled Coverage", originalPeriod: "Jan 2026", effectiveDate: "2026-01-15", amount: "-6.00", reasonCode: "Terminated mid-month", carrier: "Guardian", lineOfCoverage: "Vision", plan: "Guardian Vision", tier: "Employee Only", processedAt: new Date("2026-02-01T09:15:00-08:00") },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Sarah Connor", eventType: "Cancelled Coverage", originalPeriod: "Jan 2026", effectiveDate: "2026-01-15", amount: "-152.00", reasonCode: "Terminated mid-month", carrier: "Guardian", lineOfCoverage: "Life/Disability", plan: "Guardian Life & AD&D", tier: "Employee Only", processedAt: new Date("2026-02-01T09:15:00-08:00") },
    { invoiceId: marchInv.id, worksite: "Remote - NY", memberName: "Charlie Davis", eventType: "New Coverage", originalPeriod: "Feb 2026", effectiveDate: "2026-02-15", amount: "580.00", reasonCode: "Late-processed new hire retro", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Anthem Blue Cross PPO", tier: "Employee + Spouse", processedAt: new Date("2026-02-03T16:00:00-08:00") },
    { invoiceId: marchInv.id, worksite: "Remote - NY", memberName: "Charlie Davis", eventType: "New Coverage", originalPeriod: "Feb 2026", effectiveDate: "2026-02-15", amount: "45.00", reasonCode: "Late-processed new hire retro", carrier: "Guardian", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Employee + Spouse", processedAt: new Date("2026-02-03T16:00:00-08:00") },
    { invoiceId: marchInv.id, worksite: "Remote - NY", memberName: "Charlie Davis", eventType: "New Coverage", originalPeriod: "Feb 2026", effectiveDate: "2026-02-15", amount: "12.00", reasonCode: "Late-processed new hire retro", carrier: "Guardian", lineOfCoverage: "Vision", plan: "Guardian Vision", tier: "Employee + Spouse", processedAt: new Date("2026-02-03T16:00:00-08:00") },
    { invoiceId: marchInv.id, worksite: "Remote - NY", memberName: "Charlie Davis", eventType: "New Coverage", originalPeriod: "Feb 2026", effectiveDate: "2026-02-15", amount: "18.50", reasonCode: "Late-processed new hire retro", carrier: "Guardian", lineOfCoverage: "Life/Disability", plan: "Guardian Life & AD&D", tier: "Employee Only", processedAt: new Date("2026-02-03T16:00:00-08:00") },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Fiona Chen", eventType: "Benefit Change", originalPeriod: "Jan 2026", effectiveDate: "2026-01-15", amount: "385.00", reasonCode: "Marriage - tier upgrade retro to Jan", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Kaiser Gold PPO", tier: "Employee + Spouse", processedAt: new Date("2026-02-04T10:00:00-08:00") },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Fiona Chen", eventType: "Benefit Change", originalPeriod: "Jan 2026", effectiveDate: "2026-01-15", amount: "16.50", reasonCode: "Marriage - tier upgrade retro to Jan", carrier: "Guardian", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Employee + Spouse", processedAt: new Date("2026-02-04T10:00:00-08:00") },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Fiona Chen", eventType: "Benefit Change", originalPeriod: "Jan 2026", effectiveDate: "2026-01-15", amount: "5.00", reasonCode: "Marriage - tier upgrade retro to Jan", carrier: "Guardian", lineOfCoverage: "Vision", plan: "Guardian Vision", tier: "Employee + Spouse", processedAt: new Date("2026-02-04T10:00:00-08:00") },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Fiona Chen", eventType: "Benefit Change", originalPeriod: "Feb 2026", effectiveDate: "2026-01-15", amount: "385.00", reasonCode: "Marriage - tier upgrade retro to Jan", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Kaiser Gold PPO", tier: "Employee + Spouse", processedAt: new Date("2026-02-04T10:00:00-08:00") },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Fiona Chen", eventType: "Benefit Change", originalPeriod: "Feb 2026", effectiveDate: "2026-01-15", amount: "16.50", reasonCode: "Marriage - tier upgrade retro to Jan", carrier: "Guardian", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Employee + Spouse", processedAt: new Date("2026-02-04T10:00:00-08:00") },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Fiona Chen", eventType: "Benefit Change", originalPeriod: "Feb 2026", effectiveDate: "2026-01-15", amount: "5.00", reasonCode: "Marriage - tier upgrade retro to Jan", carrier: "Guardian", lineOfCoverage: "Vision", plan: "Guardian Vision", tier: "Employee + Spouse", processedAt: new Date("2026-02-04T10:00:00-08:00") },
  ]);

  await db.insert(postCutoffChanges).values([
    { invoiceId: marchInv.id, worksite: "Remote - NY", memberName: "Frank Castle", eventType: "New Coverage", effectiveDate: "2026-03-15", expectedPremium: "580.00", expectedMonth: "April 2026 Invoice", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Anthem Blue Cross PPO", tier: "Employee Only", processedAt: new Date("2026-02-06T11:00:00-08:00") },
    { invoiceId: marchInv.id, worksite: "Remote - NY", memberName: "Frank Castle", eventType: "New Coverage", effectiveDate: "2026-03-15", expectedPremium: "45.00", expectedMonth: "April 2026 Invoice", carrier: "Guardian", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Employee Only", processedAt: new Date("2026-02-06T11:00:00-08:00") },
    { invoiceId: marchInv.id, worksite: "Remote - NY", memberName: "Frank Castle", eventType: "New Coverage", effectiveDate: "2026-03-15", expectedPremium: "12.00", expectedMonth: "April 2026 Invoice", carrier: "Guardian", lineOfCoverage: "Vision", plan: "Guardian Vision", tier: "Employee Only", processedAt: new Date("2026-02-06T11:00:00-08:00") },
    { invoiceId: marchInv.id, worksite: "Remote - NY", memberName: "Frank Castle", eventType: "New Coverage", effectiveDate: "2026-03-15", expectedPremium: "18.50", expectedMonth: "April 2026 Invoice", carrier: "Guardian", lineOfCoverage: "Life/Disability", plan: "Guardian Life & AD&D", tier: "Employee Only", processedAt: new Date("2026-02-06T11:00:00-08:00") },
  ]);

  console.log("Seed complete!");
  await pool.end();
}

seed().catch(console.error);

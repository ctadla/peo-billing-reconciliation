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

  // March roster
  await db.insert(billedRosterMembers).values([
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Alice Johnson", employeeId: "E001", plan: "Kaiser Silver HMO", tier: "Employee Only", coverageEffectiveDate: "2026-01-01", monthlyPremium: "650.00", employeeCost: "650.00", dependentCost: "0.00" },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Bob Smith", employeeId: "E002", plan: "Kaiser Gold PPO", tier: "Family", coverageEffectiveDate: "2025-01-01", monthlyPremium: "1850.00", employeeCost: "650.00", dependentCost: "1200.00", flags: ["Late Event"] },
    { invoiceId: marchInv.id, worksite: "Remote - NY", memberName: "Charlie Davis", employeeId: "E005", plan: "Anthem Blue Cross PPO", tier: "Employee + Spouse", coverageEffectiveDate: "2026-03-01", monthlyPremium: "1200.00", employeeCost: "580.00", dependentCost: "620.00", flags: ["Prorated"] },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Diana Prince", employeeId: "E008", plan: "Kaiser Silver HMO", tier: "Employee Only", coverageEffectiveDate: "2024-01-01", monthlyPremium: "650.00", employeeCost: "650.00", dependentCost: "0.00" },
    { invoiceId: marchInv.id, worksite: "Remote - TX", memberName: "Evan Wright", employeeId: "E012", plan: "UHC Choice Plus", tier: "Employee + Children", coverageEffectiveDate: "2026-02-15", monthlyPremium: "950.00", employeeCost: "580.00", dependentCost: "370.00" },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Fiona Chen", employeeId: "E015", plan: "Kaiser Gold PPO", tier: "Employee + Spouse", coverageEffectiveDate: "2025-06-01", monthlyPremium: "1420.00", employeeCost: "650.00", dependentCost: "770.00" },
    { invoiceId: marchInv.id, worksite: "Remote - NY", memberName: "George Kim", employeeId: "E018", plan: "Anthem Blue Cross PPO", tier: "Employee Only", coverageEffectiveDate: "2025-09-01", monthlyPremium: "580.00", employeeCost: "580.00", dependentCost: "0.00" },
  ]);

  // March retro
  await db.insert(retroAdjustments).values([
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Bob Smith", eventType: "Late Enrollment", originalPeriod: "Feb 2026", effectiveDate: "2026-02-01", amount: "185.00", reasonCode: "Added dependent retroactively", processedAt: new Date("2026-02-02T14:30:00-08:00") },
    { invoiceId: marchInv.id, worksite: "San Francisco HQ", memberName: "Sarah Connor", eventType: "Retro Termination", originalPeriod: "Jan 2026", effectiveDate: "2026-01-15", amount: "-505.50", reasonCode: "Terminated mid-month", processedAt: new Date("2026-02-01T09:15:00-08:00") },
  ]);

  // March post-cutoff
  await db.insert(postCutoffChanges).values([
    { invoiceId: marchInv.id, worksite: "Remote - NY", memberName: "Frank Castle", eventType: "New Hire", effectiveDate: "2026-03-15", expectedPremium: "325.00", expectedMonth: "April 2026 Invoice", processedAt: new Date("2026-02-06T11:00:00-08:00") },
  ]);

  // February roster
  await db.insert(billedRosterMembers).values([
    { invoiceId: febInv.id, worksite: "San Francisco HQ", memberName: "Alice Johnson", employeeId: "E001", plan: "Kaiser Silver HMO", tier: "Employee Only", coverageEffectiveDate: "2026-01-01", monthlyPremium: "650.00", employeeCost: "650.00", dependentCost: "0.00" },
    { invoiceId: febInv.id, worksite: "San Francisco HQ", memberName: "Bob Smith", employeeId: "E002", plan: "Kaiser Gold PPO", tier: "Family", coverageEffectiveDate: "2025-01-01", monthlyPremium: "1850.00", employeeCost: "650.00", dependentCost: "1200.00" },
    { invoiceId: febInv.id, worksite: "San Francisco HQ", memberName: "Diana Prince", employeeId: "E008", plan: "Kaiser Silver HMO", tier: "Employee Only", coverageEffectiveDate: "2024-01-01", monthlyPremium: "650.00", employeeCost: "650.00", dependentCost: "0.00" },
    { invoiceId: febInv.id, worksite: "San Francisco HQ", memberName: "Sarah Connor", employeeId: "E010", plan: "Kaiser Gold PPO", tier: "Employee + Spouse", coverageEffectiveDate: "2025-03-01", monthlyPremium: "1350.00", employeeCost: "650.00", dependentCost: "700.00" },
    { invoiceId: febInv.id, worksite: "San Francisco HQ", memberName: "Fiona Chen", employeeId: "E015", plan: "Kaiser Gold PPO", tier: "Employee + Spouse", coverageEffectiveDate: "2025-06-01", monthlyPremium: "1420.00", employeeCost: "650.00", dependentCost: "770.00" },
    { invoiceId: febInv.id, worksite: "Remote - NY", memberName: "George Kim", employeeId: "E018", plan: "Anthem Blue Cross PPO", tier: "Employee Only", coverageEffectiveDate: "2025-09-01", monthlyPremium: "580.00", employeeCost: "580.00", dependentCost: "0.00" },
  ]);

  // February retro
  await db.insert(retroAdjustments).values([
    { invoiceId: febInv.id, worksite: "Remote - TX", memberName: "Evan Wright", eventType: "QLE Tier Change", originalPeriod: "Jan 2026", effectiveDate: "2026-01-10", amount: "150.00", reasonCode: "Marriage QLE - tier change to Employee + Children", processedAt: new Date("2026-01-03T16:00:00-08:00") },
  ]);

  // January roster
  await db.insert(billedRosterMembers).values([
    { invoiceId: janInv.id, worksite: "San Francisco HQ", memberName: "Alice Johnson", employeeId: "E001", plan: "Silver HMO (2025)", tier: "Employee Only", coverageEffectiveDate: "2025-01-01", monthlyPremium: "620.00", employeeCost: "620.00", dependentCost: "0.00" },
    { invoiceId: janInv.id, worksite: "San Francisco HQ", memberName: "Bob Smith", employeeId: "E002", plan: "Kaiser Gold PPO", tier: "Family", coverageEffectiveDate: "2025-01-01", monthlyPremium: "1850.00", employeeCost: "650.00", dependentCost: "1200.00" },
    { invoiceId: janInv.id, worksite: "San Francisco HQ", memberName: "Diana Prince", employeeId: "E008", plan: "Kaiser Silver HMO", tier: "Employee Only", coverageEffectiveDate: "2024-01-01", monthlyPremium: "650.00", employeeCost: "650.00", dependentCost: "0.00" },
    { invoiceId: janInv.id, worksite: "San Francisco HQ", memberName: "Sarah Connor", employeeId: "E010", plan: "Kaiser Gold PPO", tier: "Employee + Spouse", coverageEffectiveDate: "2025-03-01", monthlyPremium: "1350.00", employeeCost: "650.00", dependentCost: "700.00" },
    { invoiceId: janInv.id, worksite: "San Francisco HQ", memberName: "Fiona Chen", employeeId: "E015", plan: "Kaiser Gold PPO", tier: "Employee + Spouse", coverageEffectiveDate: "2025-06-01", monthlyPremium: "1420.00", employeeCost: "650.00", dependentCost: "770.00" },
  ]);

  // January retro
  await db.insert(retroAdjustments).values([
    { invoiceId: janInv.id, worksite: "San Francisco HQ", memberName: "Diana Prince", eventType: "Late Enrollment", originalPeriod: "Dec 2025", effectiveDate: "2025-12-15", amount: "-85.00", reasonCode: "Plan correction - overpayment refund", processedAt: new Date("2025-12-03T10:00:00-08:00") },
  ]);

  console.log("Seed complete!");
  await pool.end();
}

seed().catch(console.error);

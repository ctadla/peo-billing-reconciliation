import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { invoices, billedRosterMembers, retroAdjustments, postCutoffChanges } from "@shared/schema";

async function seedPEO() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log("Seeding additional PEO companies...");

  // Company 2: Bright Horizons Consulting
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

  // Bright Horizons March roster
  await db.insert(billedRosterMembers).values([
    { invoiceId: bhMar.id, worksite: "Denver HQ", memberName: "Maria Garcia", employeeId: "BH001", plan: "Aetna Select PPO", tier: "Family", coverageEffectiveDate: "2025-01-01", monthlyPremium: "1780.00", employerShare: "1300.00", employeeShare: "480.00" },
    { invoiceId: bhMar.id, worksite: "Denver HQ", memberName: "James Wilson", employeeId: "BH002", plan: "Aetna Select PPO", tier: "Employee Only", coverageEffectiveDate: "2025-06-01", monthlyPremium: "620.00", employerShare: "500.00", employeeShare: "120.00" },
    { invoiceId: bhMar.id, worksite: "Remote - CO", memberName: "Lisa Park", employeeId: "BH005", plan: "Aetna Select PPO", tier: "Employee + Spouse", coverageEffectiveDate: "2026-01-01", monthlyPremium: "1150.00", employerShare: "850.00", employeeShare: "300.00" },
    { invoiceId: bhMar.id, worksite: "Denver HQ", memberName: "Tom Harris", employeeId: "BH008", plan: "Aetna Basic HMO", tier: "Employee Only", coverageEffectiveDate: "2024-09-01", monthlyPremium: "530.00", employerShare: "400.00", employeeShare: "130.00" },
  ]);

  await db.insert(retroAdjustments).values([
    { invoiceId: bhMar.id, worksite: "Denver HQ", memberName: "Maria Garcia", eventType: "QLE Tier Change", originalPeriod: "Feb 2026", effectiveDate: "2026-02-10", amount: "240.00", reasonCode: "New dependent added via birth QLE", processedAt: new Date("2026-02-03T11:00:00-08:00") },
  ]);

  // Bright Horizons Feb roster
  await db.insert(billedRosterMembers).values([
    { invoiceId: bhFeb.id, worksite: "Denver HQ", memberName: "Maria Garcia", employeeId: "BH001", plan: "Aetna Select PPO", tier: "Employee + Spouse", coverageEffectiveDate: "2025-01-01", monthlyPremium: "1450.00", employerShare: "1050.00", employeeShare: "400.00" },
    { invoiceId: bhFeb.id, worksite: "Denver HQ", memberName: "James Wilson", employeeId: "BH002", plan: "Aetna Select PPO", tier: "Employee Only", coverageEffectiveDate: "2025-06-01", monthlyPremium: "620.00", employerShare: "500.00", employeeShare: "120.00" },
    { invoiceId: bhFeb.id, worksite: "Remote - CO", memberName: "Lisa Park", employeeId: "BH005", plan: "Aetna Select PPO", tier: "Employee + Spouse", coverageEffectiveDate: "2026-01-01", monthlyPremium: "1150.00", employerShare: "850.00", employeeShare: "300.00" },
    { invoiceId: bhFeb.id, worksite: "Denver HQ", memberName: "Tom Harris", employeeId: "BH008", plan: "Aetna Basic HMO", tier: "Employee Only", coverageEffectiveDate: "2024-09-01", monthlyPremium: "530.00", employerShare: "400.00", employeeShare: "130.00" },
  ]);

  // Bright Horizons Jan roster
  await db.insert(billedRosterMembers).values([
    { invoiceId: bhJan.id, worksite: "Denver HQ", memberName: "Maria Garcia", employeeId: "BH001", plan: "Aetna Select PPO", tier: "Employee + Spouse", coverageEffectiveDate: "2025-01-01", monthlyPremium: "1450.00", employerShare: "1050.00", employeeShare: "400.00" },
    { invoiceId: bhJan.id, worksite: "Denver HQ", memberName: "James Wilson", employeeId: "BH002", plan: "Aetna Select PPO", tier: "Employee Only", coverageEffectiveDate: "2025-06-01", monthlyPremium: "620.00", employerShare: "500.00", employeeShare: "120.00" },
    { invoiceId: bhJan.id, worksite: "Denver HQ", memberName: "Tom Harris", employeeId: "BH008", plan: "Aetna Basic HMO", tier: "Employee Only", coverageEffectiveDate: "2024-09-01", monthlyPremium: "530.00", employerShare: "400.00", employeeShare: "130.00" },
  ]);

  await db.insert(retroAdjustments).values([
    { invoiceId: bhJan.id, worksite: "Denver HQ", memberName: "Tom Harris", eventType: "Late Enrollment", originalPeriod: "Dec 2025", effectiveDate: "2025-12-01", amount: "-120.00", reasonCode: "Late plan correction refund", processedAt: new Date("2025-12-02T15:00:00-08:00") },
  ]);

  // Company 3: Cascade Digital Solutions
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

  const [cdFeb] = await db.insert(invoices).values({
    coveragePeriodStart: "2026-02-01",
    coveragePeriodEnd: "2026-02-28",
    invoiceGeneratedAt: new Date("2026-01-05T10:15:00-08:00"),
    cutoffTimestamp: new Date("2026-01-04T23:59:00-08:00"),
    invoiceId: "INV-2026-02-8812",
    batchId: "ACH-991006",
    totalRemitted: "10200.00",
    retroTotal: "0.00",
    basePremiumTotal: "10200.00",
    companyName: "Cascade Digital Solutions",
  }).returning();

  const [cdJan] = await db.insert(invoices).values({
    coveragePeriodStart: "2026-01-01",
    coveragePeriodEnd: "2026-01-31",
    invoiceGeneratedAt: new Date("2025-12-05T09:30:00-08:00"),
    cutoffTimestamp: new Date("2025-12-04T23:59:00-08:00"),
    invoiceId: "INV-2026-01-7704",
    batchId: "ACH-988752",
    totalRemitted: "9700.00",
    retroTotal: "0.00",
    basePremiumTotal: "9700.00",
    companyName: "Cascade Digital Solutions",
  }).returning();

  // Cascade March roster
  await db.insert(billedRosterMembers).values([
    { invoiceId: cdMar.id, worksite: "Seattle Office", memberName: "Priya Patel", employeeId: "CD001", plan: "Premera Blue Cross", tier: "Employee Only", coverageEffectiveDate: "2025-03-01", monthlyPremium: "590.00", employerShare: "450.00", employeeShare: "140.00" },
    { invoiceId: cdMar.id, worksite: "Seattle Office", memberName: "Derek Tanaka", employeeId: "CD003", plan: "Premera Blue Cross", tier: "Employee + Children", coverageEffectiveDate: "2025-01-01", monthlyPremium: "980.00", employerShare: "720.00", employeeShare: "260.00" },
    { invoiceId: cdMar.id, worksite: "Remote - WA", memberName: "Nina Reeves", employeeId: "CD006", plan: "Premera Blue Cross", tier: "Family", coverageEffectiveDate: "2026-01-01", monthlyPremium: "1650.00", employerShare: "1200.00", employeeShare: "450.00", flags: ["Manual Override"] },
  ]);

  await db.insert(retroAdjustments).values([
    { invoiceId: cdMar.id, worksite: "Seattle Office", memberName: "Derek Tanaka", eventType: "Retro Termination", originalPeriod: "Feb 2026", effectiveDate: "2026-02-20", amount: "-175.00", reasonCode: "Dependent aged out - tier change", processedAt: new Date("2026-02-03T09:30:00-08:00") },
  ]);

  await db.insert(postCutoffChanges).values([
    { invoiceId: cdMar.id, worksite: "Seattle Office", memberName: "Ryan Cho", eventType: "New Hire", effectiveDate: "2026-03-10", expectedPremium: "590.00", expectedMonth: "April 2026 Invoice", processedAt: new Date("2026-02-07T14:00:00-08:00") },
  ]);

  // Cascade Feb roster
  await db.insert(billedRosterMembers).values([
    { invoiceId: cdFeb.id, worksite: "Seattle Office", memberName: "Priya Patel", employeeId: "CD001", plan: "Premera Blue Cross", tier: "Employee Only", coverageEffectiveDate: "2025-03-01", monthlyPremium: "590.00", employerShare: "450.00", employeeShare: "140.00" },
    { invoiceId: cdFeb.id, worksite: "Seattle Office", memberName: "Derek Tanaka", employeeId: "CD003", plan: "Premera Blue Cross", tier: "Employee + Children", coverageEffectiveDate: "2025-01-01", monthlyPremium: "980.00", employerShare: "720.00", employeeShare: "260.00" },
    { invoiceId: cdFeb.id, worksite: "Remote - WA", memberName: "Nina Reeves", employeeId: "CD006", plan: "Premera Blue Cross", tier: "Family", coverageEffectiveDate: "2026-01-01", monthlyPremium: "1650.00", employerShare: "1200.00", employeeShare: "450.00" },
  ]);

  // Cascade Jan roster
  await db.insert(billedRosterMembers).values([
    { invoiceId: cdJan.id, worksite: "Seattle Office", memberName: "Priya Patel", employeeId: "CD001", plan: "Premera Blue Cross", tier: "Employee Only", coverageEffectiveDate: "2025-03-01", monthlyPremium: "590.00", employerShare: "450.00", employeeShare: "140.00" },
    { invoiceId: cdJan.id, worksite: "Seattle Office", memberName: "Derek Tanaka", employeeId: "CD003", plan: "Premera Blue Cross", tier: "Employee + Children", coverageEffectiveDate: "2025-01-01", monthlyPremium: "980.00", employerShare: "720.00", employeeShare: "260.00" },
  ]);

  console.log("PEO seed complete!");
  await pool.end();
}

seedPEO().catch(console.error);

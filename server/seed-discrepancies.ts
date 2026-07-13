import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, inArray } from "drizzle-orm";
import {
  invoices,
  billedRosterMembers,
  carrierBillLineItems,
  discrepancies,
  expectedAdjustments,
  type BilledRosterMember,
  type InsertCarrierBillLineItem,
} from "@shared/schema";
import { detectDiscrepancies } from "./discrepancy-engine";

interface PremiumOverride {
  memberName: string;
  lineOfCoverage: string;
  billedPremium: string;
}

interface UnmatchedLineItem {
  memberName: string;
  lineOfCoverage: string;
  plan: string | null;
  tier: string | null;
  billedPremium: string;
}

async function seedDiscrepancies() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  const existing = await db.select().from(carrierBillLineItems);
  if (existing.length > 0) {
    console.log("Discrepancy demo data already seeded, skipping.");
    await pool.end();
    return;
  }

  const marchInvoices = await db.select().from(invoices).where(eq(invoices.coveragePeriodStart, "2026-03-01"));
  if (marchInvoices.length === 0) {
    console.log("No March invoices found - run server/seed.ts and server/seed-peo.ts first.");
    await pool.end();
    return;
  }

  const invoiceIds = marchInvoices.map(i => i.id);
  const roster = await db.select().from(billedRosterMembers).where(inArray(billedRosterMembers.invoiceId, invoiceIds));

  console.log("Seeding master March carrier bills for Guardian and Aetna across all customers...");

  const uploadedAt = new Date("2026-03-08T09:00:00-08:00");
  const detectedAt = new Date("2026-03-08T09:05:00-08:00");

  async function seedCarrierBill(carrier: string, overrides: PremiumOverride[], unmatchedRows: UnmatchedLineItem[]) {
    const carrierRoster: BilledRosterMember[] = roster.filter(r => r.carrier === carrier);

    const matchedItems: InsertCarrierBillLineItem[] = carrierRoster.map(r => {
      const override = overrides.find(o => o.memberName === r.memberName && o.lineOfCoverage === r.lineOfCoverage);
      return {
        invoiceId: r.invoiceId,
        memberNameRaw: r.memberName,
        carrier,
        lineOfCoverage: r.lineOfCoverage,
        plan: r.plan,
        tier: r.tier,
        billedPremium: override ? override.billedPremium : r.monthlyPremium,
        uploadedAt,
      };
    });

    const unmatchedItems: InsertCarrierBillLineItem[] = unmatchedRows.map(u => ({
      invoiceId: null,
      memberNameRaw: u.memberName,
      carrier,
      lineOfCoverage: u.lineOfCoverage,
      plan: u.plan,
      tier: u.tier,
      billedPremium: u.billedPremium,
      uploadedAt,
    }));

    const saved = await db.insert(carrierBillLineItems).values([...matchedItems, ...unmatchedItems]).returning();
    const invoiceIdByLineItem = new Map(saved.map(s => [s.id, s.invoiceId]));

    const detected = detectDiscrepancies(carrierRoster, saved);

    const savedDiscrepancies = await db.insert(discrepancies).values(
      detected.map(d => ({
        invoiceId: invoiceIdByLineItem.get(d.billLineItemId) ?? null,
        billLineItemId: d.billLineItemId,
        rosterMemberId: d.rosterMemberId,
        memberName: d.memberName,
        carrier: d.carrier,
        lineOfCoverage: d.lineOfCoverage,
        discrepancyType: d.discrepancyType,
        expectedPremium: d.expectedPremium,
        billedPremium: d.billedPremium,
        deltaAmount: d.deltaAmount,
        status: "open",
        detectedAt,
      }))
    ).returning();

    return { billLineItems: saved, discrepancies: savedDiscrepancies };
  }

  const aetnaBill = await seedCarrierBill(
    "Aetna",
    [
      { memberName: "Bob Smith", lineOfCoverage: "Medical", billedPremium: "2000.00" },
      { memberName: "Maria Garcia", lineOfCoverage: "Medical", billedPremium: "1900.00" },
      { memberName: "Derek Tanaka", lineOfCoverage: "Medical", billedPremium: "1000.00" },
    ],
    [
      { memberName: "Henry Ford", lineOfCoverage: "Medical", plan: "Kaiser Silver HMO", tier: "Employee Only", billedPremium: "610.00" },
    ]
  );

  const guardianBill = await seedCarrierBill(
    "Guardian",
    [
      { memberName: "Charlie Davis", lineOfCoverage: "Dental", billedPremium: "60.00" },
      { memberName: "Evan Wright", lineOfCoverage: "Vision", billedPremium: "45.00" },
      { memberName: "James Wilson", lineOfCoverage: "Dental", billedPremium: "60.00" },
      { memberName: "Nina Reeves", lineOfCoverage: "Vision", billedPremium: "40.00" },
    ],
    [
      { memberName: "Grace Hopper", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Employee Only", billedPremium: "60.00" },
    ]
  );

  const bobDiscrepancy = aetnaBill.discrepancies.find(d => d.memberName === "Bob Smith");
  if (bobDiscrepancy) {
    await db.update(discrepancies).set({
      status: "resolved_carrier_error",
      faultParty: "carrier",
      resolutionNotes: "Aetna billed the family tier at the wrong rate. Confirmed with carrier rep, expecting a credit on the April bill.",
      resolvedAt: new Date("2026-03-09T14:00:00-08:00"),
    }).where(eq(discrepancies.id, bobDiscrepancy.id));

    await db.insert(expectedAdjustments).values({
      discrepancyId: bobDiscrepancy.id,
      invoiceId: bobDiscrepancy.invoiceId,
      memberName: "Bob Smith",
      carrier: "Aetna",
      lineOfCoverage: "Medical",
      amount: "150.00",
      direction: "credit_owed_to_us",
      status: "pending",
      createdAt: new Date("2026-03-09T14:00:00-08:00"),
    });
  }

  const charlieDiscrepancy = guardianBill.discrepancies.find(d => d.memberName === "Charlie Davis");
  if (charlieDiscrepancy) {
    await db.update(discrepancies).set({
      status: "resolved_gusto_error",
      faultParty: "gusto",
      resolutionNotes: "Active Benefits had the wrong tier cost for the Guardian Dental plan - corrected to match the carrier's rate card.",
      resolvedAt: new Date("2026-03-09T10:30:00-08:00"),
    }).where(eq(discrepancies.id, charlieDiscrepancy.id));
  }

  console.log(`Seeded Aetna bill: ${aetnaBill.billLineItems.length} line items, ${aetnaBill.discrepancies.length} discrepancies.`);
  console.log(`Seeded Guardian bill: ${guardianBill.billLineItems.length} line items, ${guardianBill.discrepancies.length} discrepancies.`);
  await pool.end();
}

seedDiscrepancies().catch(console.error);

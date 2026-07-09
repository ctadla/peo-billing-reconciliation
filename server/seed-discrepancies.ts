import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import {
  invoices,
  billedRosterMembers,
  carrierBillLineItems,
  discrepancies,
  expectedAdjustments,
  type BilledRosterMember,
} from "@shared/schema";
import { detectDiscrepancies } from "./discrepancy-engine";

async function seedDiscrepancies() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  const existing = await db.select().from(carrierBillLineItems);
  if (existing.length > 0) {
    console.log("Discrepancy demo data already seeded, skipping.");
    await pool.end();
    return;
  }

  const [invoice] = await db.select().from(invoices).where(eq(invoices.invoiceId, "INV-2026-03-9921"));
  if (!invoice) {
    console.log("Seed invoice INV-2026-03-9921 not found - run server/seed.ts first.");
    await pool.end();
    return;
  }

  const roster = await db.select().from(billedRosterMembers).where(eq(billedRosterMembers.invoiceId, invoice.id));
  const byNameCoverage = (name: string, carrier: string, lineOfCoverage: string): BilledRosterMember | undefined =>
    roster.find(r => r.memberName === name && r.carrier === carrier && r.lineOfCoverage === lineOfCoverage);

  console.log("Seeding a sample carrier bill with discrepancies...");

  const uploadedAt = new Date("2026-03-08T09:00:00-08:00");
  const bill = [
    { memberNameRaw: "Alice Johnson", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Kaiser Silver HMO", tier: "Employee Only", billedPremium: byNameCoverage("Alice Johnson", "Aetna", "Medical")!.monthlyPremium },
    { memberNameRaw: "Bob Smith", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Kaiser Gold PPO", tier: "Family", billedPremium: "2000.00" },
    { memberNameRaw: "Charlie Davis", carrier: "Guardian", lineOfCoverage: "Dental", plan: "Guardian Dental PPO", tier: "Employee + Spouse", billedPremium: "60.00" },
    { memberNameRaw: "Diana Prince", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Kaiser Silver HMO", tier: "Employee Only", billedPremium: byNameCoverage("Diana Prince", "Aetna", "Medical")!.monthlyPremium },
    { memberNameRaw: "Evan Wright", carrier: "Guardian", lineOfCoverage: "Vision", plan: "Guardian Vision", tier: "Employee + Children", billedPremium: "45.00" },
    { memberNameRaw: "Henry Ford", carrier: "Aetna", lineOfCoverage: "Medical", plan: "Kaiser Silver HMO", tier: "Employee Only", billedPremium: "610.00" },
  ];

  const savedItems = await db.insert(carrierBillLineItems).values(
    bill.map(item => ({ ...item, invoiceId: invoice.id, uploadedAt }))
  ).returning();

  const detected = detectDiscrepancies(roster, savedItems);
  const now = new Date("2026-03-08T09:05:00-08:00");

  const savedDiscrepancies = await db.insert(discrepancies).values(
    detected.map(d => ({
      invoiceId: invoice.id,
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
      detectedAt: now,
    }))
  ).returning();

  const bobDiscrepancy = savedDiscrepancies.find(d => d.memberName === "Bob Smith");
  const charlieDiscrepancy = savedDiscrepancies.find(d => d.memberName === "Charlie Davis");

  if (bobDiscrepancy) {
    await db.update(discrepancies).set({
      status: "resolved_carrier_error",
      faultParty: "carrier",
      resolutionNotes: "Aetna billed the family tier at the wrong rate. Confirmed with carrier rep, expecting a credit on the April bill.",
      resolvedAt: new Date("2026-03-09T14:00:00-08:00"),
    }).where(eq(discrepancies.id, bobDiscrepancy.id));

    await db.insert(expectedAdjustments).values({
      discrepancyId: bobDiscrepancy.id,
      invoiceId: invoice.id,
      memberName: "Bob Smith",
      carrier: "Aetna",
      lineOfCoverage: "Medical",
      amount: "150.00",
      direction: "credit_owed_to_us",
      status: "pending",
      createdAt: new Date("2026-03-09T14:00:00-08:00"),
    });
  }

  if (charlieDiscrepancy) {
    await db.update(discrepancies).set({
      status: "resolved_gusto_error",
      faultParty: "gusto",
      resolutionNotes: "Active Benefits had the wrong tier cost for the Guardian Dental plan - corrected to match the carrier's rate card.",
      resolvedAt: new Date("2026-03-09T10:30:00-08:00"),
    }).where(eq(discrepancies.id, charlieDiscrepancy.id));
  }

  console.log(`Seeded ${savedItems.length} bill line items and ${savedDiscrepancies.length} discrepancies for ${invoice.invoiceId}.`);
  await pool.end();
}

seedDiscrepancies().catch(console.error);

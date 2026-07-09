import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, numeric, date, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const invoices = pgTable("invoices", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  coveragePeriodStart: date("coverage_period_start").notNull(),
  coveragePeriodEnd: date("coverage_period_end").notNull(),
  invoiceGeneratedAt: timestamp("invoice_generated_at").notNull(),
  cutoffTimestamp: timestamp("cutoff_timestamp").notNull(),
  invoiceId: text("invoice_id").notNull().unique(),
  batchId: text("batch_id").notNull(),
  totalRemitted: numeric("total_remitted", { precision: 12, scale: 2 }).notNull(),
  retroTotal: numeric("retro_total", { precision: 12, scale: 2 }).notNull(),
  basePremiumTotal: numeric("base_premium_total", { precision: 12, scale: 2 }).notNull(),
  companyName: text("company_name").notNull().default("Matt Morgan Design Inc."),
  payoutStatus: text("payout_status").notNull().default("pending"),
  paidAt: timestamp("paid_at"),
});

export const billedRosterMembers = pgTable("billed_roster_members", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  invoiceId: integer("invoice_id").notNull(),
  worksite: text("worksite").notNull(),
  memberName: text("member_name").notNull(),
  employeeId: text("employee_id").notNull(),
  carrier: text("carrier").notNull(),
  lineOfCoverage: text("line_of_coverage").notNull(),
  plan: text("plan").notNull(),
  tier: text("tier").notNull(),
  coverageEffectiveDate: date("coverage_effective_date").notNull(),
  terminationDate: date("termination_date"),
  monthlyPremium: numeric("monthly_premium", { precision: 10, scale: 2 }).notNull(),
  employeeCost: numeric("employee_cost", { precision: 10, scale: 2 }).notNull(),
  dependentCost: numeric("dependent_cost", { precision: 10, scale: 2 }).notNull(),
  flags: text("flags").array(),
});

export const retroAdjustments = pgTable("retro_adjustments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  invoiceId: integer("invoice_id").notNull(),
  worksite: text("worksite").notNull(),
  memberName: text("member_name").notNull(),
  eventType: text("event_type").notNull(),
  originalPeriod: text("original_period").notNull(),
  effectiveDate: date("effective_date").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  reasonCode: text("reason_code").notNull(),
  carrier: text("carrier"),
  lineOfCoverage: text("line_of_coverage"),
  plan: text("plan"),
  tier: text("tier"),
  processedAt: timestamp("processed_at").notNull(),
});

export const postCutoffChanges = pgTable("post_cutoff_changes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  invoiceId: integer("invoice_id").notNull(),
  worksite: text("worksite").notNull(),
  memberName: text("member_name").notNull(),
  eventType: text("event_type").notNull(),
  effectiveDate: date("effective_date").notNull(),
  expectedPremium: numeric("expected_premium", { precision: 10, scale: 2 }).notNull(),
  expectedMonth: text("expected_month").notNull(),
  carrier: text("carrier"),
  lineOfCoverage: text("line_of_coverage"),
  plan: text("plan"),
  tier: text("tier"),
  processedAt: timestamp("processed_at").notNull(),
});

export const carrierBillLineItems = pgTable("carrier_bill_line_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  invoiceId: integer("invoice_id").notNull(),
  memberNameRaw: text("member_name_raw").notNull(),
  carrier: text("carrier").notNull(),
  lineOfCoverage: text("line_of_coverage").notNull(),
  plan: text("plan"),
  tier: text("tier"),
  billedPremium: numeric("billed_premium", { precision: 10, scale: 2 }).notNull(),
  uploadedAt: timestamp("uploaded_at").notNull(),
});

export const discrepancies = pgTable("discrepancies", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  invoiceId: integer("invoice_id").notNull(),
  billLineItemId: integer("bill_line_item_id").notNull(),
  rosterMemberId: integer("roster_member_id"),
  memberName: text("member_name").notNull(),
  carrier: text("carrier").notNull(),
  lineOfCoverage: text("line_of_coverage").notNull(),
  discrepancyType: text("discrepancy_type").notNull(), // "premium_mismatch" | "unmatched_member"
  expectedPremium: numeric("expected_premium", { precision: 10, scale: 2 }),
  billedPremium: numeric("billed_premium", { precision: 10, scale: 2 }).notNull(),
  deltaAmount: numeric("delta_amount", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("open"), // "open" | "resolved_gusto_error" | "resolved_carrier_error"
  faultParty: text("fault_party"), // "gusto" | "carrier"
  resolutionNotes: text("resolution_notes"),
  detectedAt: timestamp("detected_at").notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const expectedAdjustments = pgTable("expected_adjustments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  discrepancyId: integer("discrepancy_id").notNull(),
  invoiceId: integer("invoice_id").notNull(),
  memberName: text("member_name").notNull(),
  carrier: text("carrier").notNull(),
  lineOfCoverage: text("line_of_coverage").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  direction: text("direction").notNull(), // "credit_owed_to_us" | "debit_owed_to_carrier"
  status: text("status").notNull().default("pending"), // "pending" | "received"
  createdAt: timestamp("created_at").notNull(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true });
export const insertBilledRosterSchema = createInsertSchema(billedRosterMembers).omit({ id: true });
export const insertRetroAdjustmentSchema = createInsertSchema(retroAdjustments).omit({ id: true });
export const insertPostCutoffSchema = createInsertSchema(postCutoffChanges).omit({ id: true });
export const insertCarrierBillLineItemSchema = createInsertSchema(carrierBillLineItems).omit({ id: true });
export const insertDiscrepancySchema = createInsertSchema(discrepancies).omit({ id: true });
export const insertExpectedAdjustmentSchema = createInsertSchema(expectedAdjustments).omit({ id: true });

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertBilledRosterMember = z.infer<typeof insertBilledRosterSchema>;
export type BilledRosterMember = typeof billedRosterMembers.$inferSelect;

export type InsertRetroAdjustment = z.infer<typeof insertRetroAdjustmentSchema>;
export type RetroAdjustment = typeof retroAdjustments.$inferSelect;

export type InsertPostCutoffChange = z.infer<typeof insertPostCutoffSchema>;
export type PostCutoffChange = typeof postCutoffChanges.$inferSelect;

export type InsertCarrierBillLineItem = z.infer<typeof insertCarrierBillLineItemSchema>;
export type CarrierBillLineItem = typeof carrierBillLineItems.$inferSelect;

export type InsertDiscrepancy = z.infer<typeof insertDiscrepancySchema>;
export type Discrepancy = typeof discrepancies.$inferSelect;

export type InsertExpectedAdjustment = z.infer<typeof insertExpectedAdjustmentSchema>;
export type ExpectedAdjustment = typeof expectedAdjustments.$inferSelect;

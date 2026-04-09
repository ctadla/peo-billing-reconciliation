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

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true });
export const insertBilledRosterSchema = createInsertSchema(billedRosterMembers).omit({ id: true });
export const insertRetroAdjustmentSchema = createInsertSchema(retroAdjustments).omit({ id: true });
export const insertPostCutoffSchema = createInsertSchema(postCutoffChanges).omit({ id: true });

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertBilledRosterMember = z.infer<typeof insertBilledRosterSchema>;
export type BilledRosterMember = typeof billedRosterMembers.$inferSelect;

export type InsertRetroAdjustment = z.infer<typeof insertRetroAdjustmentSchema>;
export type RetroAdjustment = typeof retroAdjustments.$inferSelect;

export type InsertPostCutoffChange = z.infer<typeof insertPostCutoffSchema>;
export type PostCutoffChange = typeof postCutoffChanges.$inferSelect;

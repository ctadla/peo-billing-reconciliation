import { eq, and, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  invoices,
  billedRosterMembers,
  retroAdjustments,
  postCutoffChanges,
  carrierBillLineItems,
  discrepancies,
  expectedAdjustments,
  type Invoice,
  type InsertInvoice,
  type BilledRosterMember,
  type InsertBilledRosterMember,
  type RetroAdjustment,
  type InsertRetroAdjustment,
  type PostCutoffChange,
  type InsertPostCutoffChange,
  type CarrierBillLineItem,
  type InsertCarrierBillLineItem,
  type Discrepancy,
  type InsertDiscrepancy,
  type ExpectedAdjustment,
  type InsertExpectedAdjustment,
} from "@shared/schema";

export interface IStorage {
  getInvoices(): Promise<Invoice[]>;
  getInvoicesByCompany(companyName: string): Promise<Invoice[]>;
  getInvoiceById(id: number): Promise<Invoice | undefined>;
  createInvoice(data: InsertInvoice): Promise<Invoice>;

  getRosterByInvoice(invoiceId: number): Promise<BilledRosterMember[]>;
  getRosterByInvoiceIds(invoiceIds: number[]): Promise<BilledRosterMember[]>;
  createRosterMember(data: InsertBilledRosterMember): Promise<BilledRosterMember>;

  getRetroByInvoice(invoiceId: number): Promise<RetroAdjustment[]>;
  getRetroByInvoiceIds(invoiceIds: number[]): Promise<RetroAdjustment[]>;
  createRetroAdjustment(data: InsertRetroAdjustment): Promise<RetroAdjustment>;

  getPostCutoffByInvoice(invoiceId: number): Promise<PostCutoffChange[]>;
  getPostCutoffByInvoiceIds(invoiceIds: number[]): Promise<PostCutoffChange[]>;
  createPostCutoffChange(data: InsertPostCutoffChange): Promise<PostCutoffChange>;

  getDistinctPeriods(): Promise<{ start: string; end: string }[]>;
  getDistinctCompanies(): Promise<string[]>;
  getInvoicesByPeriod(periodStart: string, companyName?: string): Promise<Invoice[]>;

  setInvoicePayoutStatus(id: number, status: string, paidAt: Date | null): Promise<Invoice | undefined>;

  getBillLineItemsByInvoice(invoiceId: number): Promise<CarrierBillLineItem[]>;
  replaceBillLineItems(invoiceId: number, items: InsertCarrierBillLineItem[]): Promise<CarrierBillLineItem[]>;

  getDiscrepanciesByInvoice(invoiceId: number): Promise<Discrepancy[]>;
  getDiscrepancyById(id: number): Promise<Discrepancy | undefined>;
  deleteDiscrepanciesByInvoice(invoiceId: number): Promise<void>;
  createDiscrepancies(rows: InsertDiscrepancy[]): Promise<Discrepancy[]>;
  updateDiscrepancy(id: number, patch: Partial<Discrepancy>): Promise<Discrepancy | undefined>;

  getExpectedAdjustmentsByInvoice(invoiceId: number): Promise<ExpectedAdjustment[]>;
  createExpectedAdjustment(data: InsertExpectedAdjustment): Promise<ExpectedAdjustment>;
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export class DatabaseStorage implements IStorage {
  async getInvoices(): Promise<Invoice[]> {
    return db.select().from(invoices).orderBy(invoices.coveragePeriodStart);
  }

  async getInvoicesByCompany(companyName: string): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.companyName, companyName)).orderBy(invoices.coveragePeriodStart);
  }

  async getInvoiceById(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async createInvoice(data: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values(data).returning();
    return invoice;
  }

  async getRosterByInvoice(invoiceId: number): Promise<BilledRosterMember[]> {
    return db.select().from(billedRosterMembers).where(eq(billedRosterMembers.invoiceId, invoiceId)).orderBy(billedRosterMembers.memberName, billedRosterMembers.lineOfCoverage);
  }

  async getRosterByInvoiceIds(invoiceIds: number[]): Promise<BilledRosterMember[]> {
    if (invoiceIds.length === 0) return [];
    return db.select().from(billedRosterMembers).where(inArray(billedRosterMembers.invoiceId, invoiceIds)).orderBy(billedRosterMembers.invoiceId, billedRosterMembers.memberName, billedRosterMembers.lineOfCoverage);
  }

  async createRosterMember(data: InsertBilledRosterMember): Promise<BilledRosterMember> {
    const [member] = await db.insert(billedRosterMembers).values(data).returning();
    return member;
  }

  async getRetroByInvoice(invoiceId: number): Promise<RetroAdjustment[]> {
    return db.select().from(retroAdjustments).where(eq(retroAdjustments.invoiceId, invoiceId));
  }

  async getRetroByInvoiceIds(invoiceIds: number[]): Promise<RetroAdjustment[]> {
    if (invoiceIds.length === 0) return [];
    return db.select().from(retroAdjustments).where(inArray(retroAdjustments.invoiceId, invoiceIds));
  }

  async createRetroAdjustment(data: InsertRetroAdjustment): Promise<RetroAdjustment> {
    const [adj] = await db.insert(retroAdjustments).values(data).returning();
    return adj;
  }

  async getPostCutoffByInvoice(invoiceId: number): Promise<PostCutoffChange[]> {
    return db.select().from(postCutoffChanges).where(eq(postCutoffChanges.invoiceId, invoiceId));
  }

  async getPostCutoffByInvoiceIds(invoiceIds: number[]): Promise<PostCutoffChange[]> {
    if (invoiceIds.length === 0) return [];
    return db.select().from(postCutoffChanges).where(inArray(postCutoffChanges.invoiceId, invoiceIds));
  }

  async createPostCutoffChange(data: InsertPostCutoffChange): Promise<PostCutoffChange> {
    const [change] = await db.insert(postCutoffChanges).values(data).returning();
    return change;
  }

  async getDistinctPeriods(): Promise<{ start: string; end: string }[]> {
    const result = await db
      .selectDistinct({
        start: invoices.coveragePeriodStart,
        end: invoices.coveragePeriodEnd,
      })
      .from(invoices)
      .orderBy(invoices.coveragePeriodStart);
    return result;
  }

  async getDistinctCompanies(): Promise<string[]> {
    const result = await db
      .selectDistinct({ companyName: invoices.companyName })
      .from(invoices)
      .orderBy(invoices.companyName);
    return result.map(r => r.companyName);
  }

  async getInvoicesByPeriod(periodStart: string, companyName?: string): Promise<Invoice[]> {
    if (companyName) {
      return db.select().from(invoices).where(
        and(eq(invoices.coveragePeriodStart, periodStart), eq(invoices.companyName, companyName))
      );
    }
    return db.select().from(invoices).where(eq(invoices.coveragePeriodStart, periodStart));
  }

  async setInvoicePayoutStatus(id: number, status: string, paidAt: Date | null): Promise<Invoice | undefined> {
    const [invoice] = await db.update(invoices).set({ payoutStatus: status, paidAt }).where(eq(invoices.id, id)).returning();
    return invoice;
  }

  async getBillLineItemsByInvoice(invoiceId: number): Promise<CarrierBillLineItem[]> {
    return db.select().from(carrierBillLineItems).where(eq(carrierBillLineItems.invoiceId, invoiceId));
  }

  async replaceBillLineItems(invoiceId: number, items: InsertCarrierBillLineItem[]): Promise<CarrierBillLineItem[]> {
    await db.delete(carrierBillLineItems).where(eq(carrierBillLineItems.invoiceId, invoiceId));
    if (items.length === 0) return [];
    return db.insert(carrierBillLineItems).values(items).returning();
  }

  async getDiscrepanciesByInvoice(invoiceId: number): Promise<Discrepancy[]> {
    return db.select().from(discrepancies).where(eq(discrepancies.invoiceId, invoiceId));
  }

  async getDiscrepancyById(id: number): Promise<Discrepancy | undefined> {
    const [row] = await db.select().from(discrepancies).where(eq(discrepancies.id, id));
    return row;
  }

  async deleteDiscrepanciesByInvoice(invoiceId: number): Promise<void> {
    await db.delete(expectedAdjustments).where(eq(expectedAdjustments.invoiceId, invoiceId));
    await db.delete(discrepancies).where(eq(discrepancies.invoiceId, invoiceId));
  }

  async createDiscrepancies(rows: InsertDiscrepancy[]): Promise<Discrepancy[]> {
    if (rows.length === 0) return [];
    return db.insert(discrepancies).values(rows).returning();
  }

  async updateDiscrepancy(id: number, patch: Partial<Discrepancy>): Promise<Discrepancy | undefined> {
    const [row] = await db.update(discrepancies).set(patch).where(eq(discrepancies.id, id)).returning();
    return row;
  }

  async getExpectedAdjustmentsByInvoice(invoiceId: number): Promise<ExpectedAdjustment[]> {
    return db.select().from(expectedAdjustments).where(eq(expectedAdjustments.invoiceId, invoiceId));
  }

  async createExpectedAdjustment(data: InsertExpectedAdjustment): Promise<ExpectedAdjustment> {
    const [row] = await db.insert(expectedAdjustments).values(data).returning();
    return row;
  }
}

export const storage = new DatabaseStorage();

import { eq, and, or, isNull, inArray } from "drizzle-orm";
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
  carrierBillPayouts,
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
  type CarrierBillPayout,
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

  getBillLineItemsByCarrierAndInvoiceIds(carrier: string, invoiceIds: number[]): Promise<CarrierBillLineItem[]>;
  deleteBillLineItemsByCarrierAndInvoiceIds(carrier: string, invoiceIds: number[]): Promise<void>;
  insertBillLineItems(items: InsertCarrierBillLineItem[]): Promise<CarrierBillLineItem[]>;

  getDiscrepanciesByCarrierAndInvoiceIds(carrier: string, invoiceIds: number[]): Promise<Discrepancy[]>;
  getDiscrepancyById(id: number): Promise<Discrepancy | undefined>;
  deleteDiscrepanciesByCarrierAndInvoiceIds(carrier: string, invoiceIds: number[]): Promise<void>;
  createDiscrepancies(rows: InsertDiscrepancy[]): Promise<Discrepancy[]>;
  updateDiscrepancy(id: number, patch: Partial<Discrepancy>): Promise<Discrepancy | undefined>;

  getExpectedAdjustmentsByCarrierAndInvoiceIds(carrier: string, invoiceIds: number[]): Promise<ExpectedAdjustment[]>;
  getExpectedAdjustmentById(id: number): Promise<ExpectedAdjustment | undefined>;
  getExpectedAdjustmentByDiscrepancyId(discrepancyId: number): Promise<ExpectedAdjustment | undefined>;
  getPendingAdjustmentsByCarrier(carrier: string): Promise<{ adjustment: ExpectedAdjustment; invoice: Invoice | null }[]>;
  getAllPendingAdjustments(): Promise<{ adjustment: ExpectedAdjustment; invoice: Invoice | null }[]>;
  createExpectedAdjustment(data: InsertExpectedAdjustment): Promise<ExpectedAdjustment>;
  updateExpectedAdjustment(id: number, patch: Partial<ExpectedAdjustment>): Promise<ExpectedAdjustment | undefined>;
  deleteExpectedAdjustment(id: number): Promise<void>;

  getCarrierBillPayout(carrier: string, periodStart: string): Promise<CarrierBillPayout | undefined>;
  markCarrierBillPaid(carrier: string, periodStart: string, receiptFileName: string): Promise<CarrierBillPayout>;
  clearCarrierBillPayout(carrier: string, periodStart: string): Promise<void>;
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

  async getBillLineItemsByCarrierAndInvoiceIds(carrier: string, invoiceIds: number[]): Promise<CarrierBillLineItem[]> {
    return db.select().from(carrierBillLineItems).where(
      and(eq(carrierBillLineItems.carrier, carrier), or(inArray(carrierBillLineItems.invoiceId, invoiceIds), isNull(carrierBillLineItems.invoiceId)))
    );
  }

  async deleteBillLineItemsByCarrierAndInvoiceIds(carrier: string, invoiceIds: number[]): Promise<void> {
    await db.delete(carrierBillLineItems).where(
      and(eq(carrierBillLineItems.carrier, carrier), or(inArray(carrierBillLineItems.invoiceId, invoiceIds), isNull(carrierBillLineItems.invoiceId)))
    );
  }

  async insertBillLineItems(items: InsertCarrierBillLineItem[]): Promise<CarrierBillLineItem[]> {
    if (items.length === 0) return [];
    return db.insert(carrierBillLineItems).values(items).returning();
  }

  async getDiscrepanciesByCarrierAndInvoiceIds(carrier: string, invoiceIds: number[]): Promise<Discrepancy[]> {
    return db.select().from(discrepancies).where(
      and(eq(discrepancies.carrier, carrier), or(inArray(discrepancies.invoiceId, invoiceIds), isNull(discrepancies.invoiceId)))
    );
  }

  async getDiscrepancyById(id: number): Promise<Discrepancy | undefined> {
    const [row] = await db.select().from(discrepancies).where(eq(discrepancies.id, id));
    return row;
  }

  async deleteDiscrepanciesByCarrierAndInvoiceIds(carrier: string, invoiceIds: number[]): Promise<void> {
    const scope = and(eq(discrepancies.carrier, carrier), or(inArray(discrepancies.invoiceId, invoiceIds), isNull(discrepancies.invoiceId)));
    const toDelete = await db.select({ id: discrepancies.id }).from(discrepancies).where(scope);
    const ids = toDelete.map(d => d.id);
    if (ids.length > 0) {
      await db.delete(expectedAdjustments).where(inArray(expectedAdjustments.discrepancyId, ids));
    }
    await db.delete(discrepancies).where(scope);
  }

  async createDiscrepancies(rows: InsertDiscrepancy[]): Promise<Discrepancy[]> {
    if (rows.length === 0) return [];
    return db.insert(discrepancies).values(rows).returning();
  }

  async updateDiscrepancy(id: number, patch: Partial<Discrepancy>): Promise<Discrepancy | undefined> {
    const [row] = await db.update(discrepancies).set(patch).where(eq(discrepancies.id, id)).returning();
    return row;
  }

  async getExpectedAdjustmentsByCarrierAndInvoiceIds(carrier: string, invoiceIds: number[]): Promise<ExpectedAdjustment[]> {
    return db.select().from(expectedAdjustments).where(
      and(eq(expectedAdjustments.carrier, carrier), or(inArray(expectedAdjustments.invoiceId, invoiceIds), isNull(expectedAdjustments.invoiceId)))
    );
  }

  async getExpectedAdjustmentById(id: number): Promise<ExpectedAdjustment | undefined> {
    const [row] = await db.select().from(expectedAdjustments).where(eq(expectedAdjustments.id, id));
    return row;
  }

  async getExpectedAdjustmentByDiscrepancyId(discrepancyId: number): Promise<ExpectedAdjustment | undefined> {
    const [row] = await db.select().from(expectedAdjustments).where(eq(expectedAdjustments.discrepancyId, discrepancyId));
    return row;
  }

  async getPendingAdjustmentsByCarrier(carrier: string): Promise<{ adjustment: ExpectedAdjustment; invoice: Invoice | null }[]> {
    const rows = await db
      .select({ adjustment: expectedAdjustments, invoice: invoices })
      .from(expectedAdjustments)
      .leftJoin(invoices, eq(expectedAdjustments.invoiceId, invoices.id))
      .where(and(eq(expectedAdjustments.carrier, carrier), eq(expectedAdjustments.status, "pending")));
    return rows;
  }

  async getAllPendingAdjustments(): Promise<{ adjustment: ExpectedAdjustment; invoice: Invoice | null }[]> {
    const rows = await db
      .select({ adjustment: expectedAdjustments, invoice: invoices })
      .from(expectedAdjustments)
      .leftJoin(invoices, eq(expectedAdjustments.invoiceId, invoices.id))
      .where(eq(expectedAdjustments.status, "pending"));
    return rows;
  }

  async createExpectedAdjustment(data: InsertExpectedAdjustment): Promise<ExpectedAdjustment> {
    const [row] = await db.insert(expectedAdjustments).values(data).returning();
    return row;
  }

  async updateExpectedAdjustment(id: number, patch: Partial<ExpectedAdjustment>): Promise<ExpectedAdjustment | undefined> {
    const [row] = await db.update(expectedAdjustments).set(patch).where(eq(expectedAdjustments.id, id)).returning();
    return row;
  }

  async deleteExpectedAdjustment(id: number): Promise<void> {
    await db.delete(expectedAdjustments).where(eq(expectedAdjustments.id, id));
  }

  async getCarrierBillPayout(carrier: string, periodStart: string): Promise<CarrierBillPayout | undefined> {
    const [row] = await db.select().from(carrierBillPayouts).where(
      and(eq(carrierBillPayouts.carrier, carrier), eq(carrierBillPayouts.periodStart, periodStart))
    );
    return row;
  }

  async markCarrierBillPaid(carrier: string, periodStart: string, receiptFileName: string): Promise<CarrierBillPayout> {
    await db.delete(carrierBillPayouts).where(
      and(eq(carrierBillPayouts.carrier, carrier), eq(carrierBillPayouts.periodStart, periodStart))
    );
    const [row] = await db.insert(carrierBillPayouts).values({ carrier, periodStart, paidAt: new Date(), receiptFileName }).returning();
    return row;
  }

  async clearCarrierBillPayout(carrier: string, periodStart: string): Promise<void> {
    await db.delete(carrierBillPayouts).where(
      and(eq(carrierBillPayouts.carrier, carrier), eq(carrierBillPayouts.periodStart, periodStart))
    );
  }
}

export const storage = new DatabaseStorage();

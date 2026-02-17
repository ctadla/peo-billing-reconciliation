import { eq, and, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  invoices,
  billedRosterMembers,
  retroAdjustments,
  postCutoffChanges,
  type Invoice,
  type InsertInvoice,
  type BilledRosterMember,
  type InsertBilledRosterMember,
  type RetroAdjustment,
  type InsertRetroAdjustment,
  type PostCutoffChange,
  type InsertPostCutoffChange,
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
}

export const storage = new DatabaseStorage();

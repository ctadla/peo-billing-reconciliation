import { eq } from "drizzle-orm";
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
  getInvoiceById(id: number): Promise<Invoice | undefined>;
  createInvoice(data: InsertInvoice): Promise<Invoice>;

  getRosterByInvoice(invoiceId: number): Promise<BilledRosterMember[]>;
  createRosterMember(data: InsertBilledRosterMember): Promise<BilledRosterMember>;

  getRetroByInvoice(invoiceId: number): Promise<RetroAdjustment[]>;
  createRetroAdjustment(data: InsertRetroAdjustment): Promise<RetroAdjustment>;

  getPostCutoffByInvoice(invoiceId: number): Promise<PostCutoffChange[]>;
  createPostCutoffChange(data: InsertPostCutoffChange): Promise<PostCutoffChange>;
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export class DatabaseStorage implements IStorage {
  async getInvoices(): Promise<Invoice[]> {
    return db.select().from(invoices).orderBy(invoices.coveragePeriodStart);
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
    return db.select().from(billedRosterMembers).where(eq(billedRosterMembers.invoiceId, invoiceId));
  }

  async createRosterMember(data: InsertBilledRosterMember): Promise<BilledRosterMember> {
    const [member] = await db.insert(billedRosterMembers).values(data).returning();
    return member;
  }

  async getRetroByInvoice(invoiceId: number): Promise<RetroAdjustment[]> {
    return db.select().from(retroAdjustments).where(eq(retroAdjustments.invoiceId, invoiceId));
  }

  async createRetroAdjustment(data: InsertRetroAdjustment): Promise<RetroAdjustment> {
    const [adj] = await db.insert(retroAdjustments).values(data).returning();
    return adj;
  }

  async getPostCutoffByInvoice(invoiceId: number): Promise<PostCutoffChange[]> {
    return db.select().from(postCutoffChanges).where(eq(postCutoffChanges.invoiceId, invoiceId));
  }

  async createPostCutoffChange(data: InsertPostCutoffChange): Promise<PostCutoffChange> {
    const [change] = await db.insert(postCutoffChanges).values(data).returning();
    return change;
  }
}

export const storage = new DatabaseStorage();

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/invoices", async (req, res) => {
    const company = req.query.company as string | undefined;
    if (company) {
      const invoices = await storage.getInvoicesByCompany(company);
      return res.json(invoices);
    }
    const invoices = await storage.getInvoices();
    res.json(invoices);
  });

  app.get("/api/invoices/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid invoice ID" });

    const invoice = await storage.getInvoiceById(id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const [roster, retro, postCutoff] = await Promise.all([
      storage.getRosterByInvoice(id),
      storage.getRetroByInvoice(id),
      storage.getPostCutoffByInvoice(id),
    ]);

    res.json({ invoice, roster, retro, postCutoff });
  });

  app.get("/api/peo/periods", async (_req, res) => {
    const periods = await storage.getDistinctPeriods();
    res.json(periods);
  });

  app.get("/api/peo/companies", async (_req, res) => {
    const companies = await storage.getDistinctCompanies();
    res.json(companies);
  });

  app.get("/api/peo/billing", async (req, res) => {
    const periodStart = req.query.period as string;
    const company = req.query.company as string | undefined;

    if (!periodStart) {
      return res.status(400).json({ message: "period query parameter is required" });
    }

    const matchingInvoices = await storage.getInvoicesByPeriod(periodStart, company || undefined);

    if (matchingInvoices.length === 0) {
      return res.json({ invoices: [], roster: [], retro: [], postCutoff: [], summary: null });
    }

    const invoiceIds = matchingInvoices.map(i => i.id);

    const [roster, retro, postCutoff] = await Promise.all([
      storage.getRosterByInvoiceIds(invoiceIds),
      storage.getRetroByInvoiceIds(invoiceIds),
      storage.getPostCutoffByInvoiceIds(invoiceIds),
    ]);

    const invoiceMap = new Map(matchingInvoices.map(i => [i.id, i]));

    const rosterWithCompany = roster.map(r => ({
      ...r,
      companyName: invoiceMap.get(r.invoiceId)?.companyName || "Unknown",
    }));

    const retroWithCompany = retro.map(r => ({
      ...r,
      companyName: invoiceMap.get(r.invoiceId)?.companyName || "Unknown",
    }));

    const postCutoffWithCompany = postCutoff.map(p => ({
      ...p,
      companyName: invoiceMap.get(p.invoiceId)?.companyName || "Unknown",
    }));

    const totalRemitted = matchingInvoices.reduce((sum, i) => sum + parseFloat(i.totalRemitted), 0);
    const retroTotal = matchingInvoices.reduce((sum, i) => sum + parseFloat(i.retroTotal), 0);
    const basePremium = matchingInvoices.reduce((sum, i) => sum + parseFloat(i.basePremiumTotal), 0);
    const distinctCompanies = new Set(matchingInvoices.map(i => i.companyName));

    const summary = {
      totalRemitted,
      retroTotal,
      basePremium,
      companyCount: distinctCompanies.size,
      periodStart: matchingInvoices[0].coveragePeriodStart,
      periodEnd: matchingInvoices[0].coveragePeriodEnd,
      invoiceCount: matchingInvoices.length,
    };

    res.json({
      invoices: matchingInvoices,
      roster: rosterWithCompany,
      retro: retroWithCompany,
      postCutoff: postCutoffWithCompany,
      summary,
    });
  });

  return httpServer;
}

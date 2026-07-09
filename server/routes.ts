import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { detectDiscrepancies } from "./discrepancy-engine";
import type { Discrepancy } from "@shared/schema";

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

  app.get("/api/invoices/:id/discrepancies", async (req, res) => {
    const invoiceId = parseInt(req.params.id);
    if (isNaN(invoiceId)) return res.status(400).json({ message: "Invalid invoice ID" });

    const [billLineItems, discrepancyRows, adjustments] = await Promise.all([
      storage.getBillLineItemsByInvoice(invoiceId),
      storage.getDiscrepanciesByInvoice(invoiceId),
      storage.getExpectedAdjustmentsByInvoice(invoiceId),
    ]);

    res.json({
      billLineItems,
      discrepancies: discrepancyRows,
      expectedAdjustments: adjustments,
      summary: {
        total: discrepancyRows.length,
        open: discrepancyRows.filter(d => d.status === "open").length,
        resolved: discrepancyRows.filter(d => d.status !== "open").length,
      },
    });
  });

  app.post("/api/invoices/:id/bill-upload", async (req, res) => {
    const invoiceId = parseInt(req.params.id);
    if (isNaN(invoiceId)) return res.status(400).json({ message: "Invalid invoice ID" });

    const invoice = await storage.getInvoiceById(invoiceId);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const lineItems = req.body?.lineItems;
    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ message: "lineItems array is required" });
    }

    const now = new Date();
    const insertItems = lineItems.map((item: any) => ({
      invoiceId,
      memberNameRaw: String(item.memberName ?? "").trim(),
      carrier: String(item.carrier ?? "").trim(),
      lineOfCoverage: String(item.lineOfCoverage ?? "").trim(),
      plan: item.plan ? String(item.plan).trim() : null,
      tier: item.tier ? String(item.tier).trim() : null,
      billedPremium: String(item.billedPremium ?? "0"),
      uploadedAt: now,
    }));

    if (insertItems.some(i => !i.memberNameRaw || !i.carrier || !i.lineOfCoverage)) {
      return res.status(400).json({ message: "Each line item requires memberName, carrier, and lineOfCoverage" });
    }

    await storage.deleteDiscrepanciesByInvoice(invoiceId);
    const savedItems = await storage.replaceBillLineItems(invoiceId, insertItems);

    const roster = await storage.getRosterByInvoice(invoiceId);
    const detected = detectDiscrepancies(roster, savedItems);

    const created = await storage.createDiscrepancies(detected.map(d => ({
      invoiceId,
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
    })));

    await storage.setInvoicePayoutStatus(invoiceId, "pending", null);

    res.json({ billLineItems: savedItems, discrepancies: created });
  });

  app.post("/api/invoices/:id/recheck", async (req, res) => {
    const invoiceId = parseInt(req.params.id);
    if (isNaN(invoiceId)) return res.status(400).json({ message: "Invalid invoice ID" });

    const [billLineItems, roster, allDiscrepancies] = await Promise.all([
      storage.getBillLineItemsByInvoice(invoiceId),
      storage.getRosterByInvoice(invoiceId),
      storage.getDiscrepanciesByInvoice(invoiceId),
    ]);

    const openDiscrepancies = allDiscrepancies.filter(d => d.status === "open");
    const redetected = detectDiscrepancies(roster, billLineItems);
    const stillOpenByLineItem = new Set(redetected.map(d => d.billLineItemId));

    const now = new Date();
    const autoResolved: Discrepancy[] = [];
    for (const disc of openDiscrepancies) {
      if (!stillOpenByLineItem.has(disc.billLineItemId)) {
        const row = await storage.updateDiscrepancy(disc.id, {
          status: "resolved_gusto_error",
          faultParty: "gusto",
          resolutionNotes: "Auto-resolved: Active Benefits now matches the carrier bill.",
          resolvedAt: now,
        });
        if (row) autoResolved.push(row);
      }
    }

    const discrepancyRows = await storage.getDiscrepanciesByInvoice(invoiceId);
    res.json({ discrepancies: discrepancyRows, autoResolvedCount: autoResolved.length });
  });

  app.post("/api/discrepancies/:id/resolve", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid discrepancy ID" });

    const discrepancy = await storage.getDiscrepancyById(id);
    if (!discrepancy) return res.status(404).json({ message: "Discrepancy not found" });
    if (discrepancy.status !== "open") return res.status(409).json({ message: "Discrepancy already resolved" });

    const { faultParty, resolutionNotes } = req.body ?? {};
    if (faultParty !== "gusto" && faultParty !== "carrier") {
      return res.status(400).json({ message: "faultParty must be 'gusto' or 'carrier'" });
    }

    const now = new Date();
    const status = faultParty === "gusto" ? "resolved_gusto_error" : "resolved_carrier_error";
    const updated = await storage.updateDiscrepancy(id, {
      status,
      faultParty,
      resolutionNotes: resolutionNotes ? String(resolutionNotes) : null,
      resolvedAt: now,
    });

    let adjustment = null;
    if (faultParty === "carrier") {
      const expected = discrepancy.expectedPremium ? parseFloat(discrepancy.expectedPremium) : 0;
      const billed = parseFloat(discrepancy.billedPremium);
      const delta = billed - expected;
      adjustment = await storage.createExpectedAdjustment({
        discrepancyId: id,
        invoiceId: discrepancy.invoiceId,
        memberName: discrepancy.memberName,
        carrier: discrepancy.carrier,
        lineOfCoverage: discrepancy.lineOfCoverage,
        amount: Math.abs(delta).toFixed(2),
        direction: delta > 0 ? "credit_owed_to_us" : "debit_owed_to_carrier",
        status: "pending",
        createdAt: now,
      });
    }

    res.json({ discrepancy: updated, expectedAdjustment: adjustment });
  });

  app.post("/api/invoices/:id/pay", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid invoice ID" });

    const invoice = await storage.getInvoiceById(id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const openCount = (await storage.getDiscrepanciesByInvoice(id)).filter(d => d.status === "open").length;
    if (openCount > 0) {
      return res.status(409).json({ message: `${openCount} unresolved discrepancy(ies) must be resolved before payout` });
    }

    const updated = await storage.setInvoicePayoutStatus(id, "paid", new Date());
    res.json(updated);
  });

  return httpServer;
}

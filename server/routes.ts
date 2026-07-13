import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { detectDiscrepancies, normalizeName } from "./discrepancy-engine";
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

  app.get("/api/discrepancies", async (req, res) => {
    const carrier = req.query.carrier as string | undefined;
    const period = req.query.period as string | undefined;
    if (!carrier || !period) {
      return res.status(400).json({ message: "carrier and period query parameters are required" });
    }

    const periodInvoices = await storage.getInvoicesByPeriod(period);
    const invoiceIds = periodInvoices.map(i => i.id);
    const invoiceMap = new Map(periodInvoices.map(i => [i.id, i]));
    const companyNameFor = (invoiceId: number | null) =>
      invoiceId !== null ? invoiceMap.get(invoiceId)?.companyName ?? "Unknown" : "Unmatched to a customer";

    const [roster, billLineItems, discrepancyRows, adjustments, payout] = await Promise.all([
      storage.getRosterByInvoiceIds(invoiceIds),
      storage.getBillLineItemsByCarrierAndInvoiceIds(carrier, invoiceIds),
      storage.getDiscrepanciesByCarrierAndInvoiceIds(carrier, invoiceIds),
      storage.getExpectedAdjustmentsByCarrierAndInvoiceIds(carrier, invoiceIds),
      storage.getCarrierBillPayout(carrier, period),
    ]);

    const rosterForCarrier = roster.filter(r => r.carrier === carrier);
    const discrepanciesWithCompany = discrepancyRows.map(d => ({ ...d, companyName: companyNameFor(d.invoiceId) }));
    const adjustmentsWithCompany = adjustments.map(a => ({ ...a, companyName: companyNameFor(a.invoiceId) }));
    const companyCount = new Set(discrepanciesWithCompany.map(d => d.companyName)).size;

    res.json({
      carrier,
      period,
      isPaid: !!payout,
      paidAt: payout?.paidAt ?? null,
      receiptFileName: payout?.receiptFileName ?? null,
      hasBill: billLineItems.length > 0,
      roster: rosterForCarrier,
      discrepancies: discrepanciesWithCompany,
      expectedAdjustments: adjustmentsWithCompany,
      summary: {
        total: discrepanciesWithCompany.length,
        open: discrepanciesWithCompany.filter(d => d.status === "open").length,
        resolved: discrepanciesWithCompany.filter(d => d.status !== "open").length,
        companyCount,
      },
    });
  });

  app.get("/api/discrepancies/bill-download", async (req, res) => {
    const carrier = req.query.carrier as string | undefined;
    const period = req.query.period as string | undefined;
    if (!carrier || !period) {
      return res.status(400).json({ message: "carrier and period query parameters are required" });
    }

    const periodInvoices = await storage.getInvoicesByPeriod(period);
    const invoiceIds = periodInvoices.map(i => i.id);
    const invoiceMap = new Map(periodInvoices.map(i => [i.id, i]));
    const companyNameFor = (invoiceId: number | null) =>
      invoiceId !== null ? invoiceMap.get(invoiceId)?.companyName ?? "Unknown" : "Unmatched to a customer";

    const billLineItems = await storage.getBillLineItemsByCarrierAndInvoiceIds(carrier, invoiceIds);

    const csvEscape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const header = ["Customer", "Member", "Carrier", "Line of Coverage", "Plan", "Tier", "Billed Premium"];
    const rows = billLineItems.map(item => [
      companyNameFor(item.invoiceId),
      item.memberNameRaw,
      item.carrier,
      item.lineOfCoverage,
      item.plan ?? "",
      item.tier ?? "",
      item.billedPremium,
    ]);
    const csv = [header, ...rows].map(row => row.map(v => csvEscape(String(v))).join(",")).join("\r\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${carrier}-${period}-bill.csv"`);
    res.send(csv);
  });

  app.post("/api/discrepancies/bill-upload", async (req, res) => {
    const { carrier, period, lineItems } = req.body ?? {};
    if (!carrier || !period) {
      return res.status(400).json({ message: "carrier and period are required" });
    }
    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ message: "lineItems array is required" });
    }

    const periodInvoices = await storage.getInvoicesByPeriod(period);
    if (periodInvoices.length === 0) {
      return res.status(404).json({ message: "No invoices found for this coverage period" });
    }
    const invoiceIds = periodInvoices.map(i => i.id);
    const roster = await storage.getRosterByInvoiceIds(invoiceIds);

    const rosterByKey = new Map<string, (typeof roster)[number]>();
    for (const member of roster) {
      rosterByKey.set(`${normalizeName(member.memberName)}|${member.carrier}|${member.lineOfCoverage}`, member);
    }

    const now = new Date();
    const insertItems = lineItems.map((item: any) => {
      const memberNameRaw = String(item.memberName ?? "").trim();
      const itemCarrier = String(item.carrier ?? "").trim();
      const lineOfCoverage = String(item.lineOfCoverage ?? "").trim();
      const match = rosterByKey.get(`${normalizeName(memberNameRaw)}|${itemCarrier}|${lineOfCoverage}`);
      return {
        invoiceId: match ? match.invoiceId : null,
        memberNameRaw,
        carrier: itemCarrier,
        lineOfCoverage,
        plan: item.plan ? String(item.plan).trim() : null,
        tier: item.tier ? String(item.tier).trim() : null,
        billedPremium: String(item.billedPremium ?? "0"),
        uploadedAt: now,
      };
    });

    if (insertItems.some(i => !i.memberNameRaw || !i.carrier || !i.lineOfCoverage)) {
      return res.status(400).json({ message: "Each line item requires memberName, carrier, and lineOfCoverage" });
    }

    await storage.deleteDiscrepanciesByCarrierAndInvoiceIds(carrier, invoiceIds);
    await storage.deleteBillLineItemsByCarrierAndInvoiceIds(carrier, invoiceIds);
    const savedItems = await storage.insertBillLineItems(insertItems);

    const detected = detectDiscrepancies(roster, savedItems);
    const savedById = new Map(savedItems.map(i => [i.id, i]));

    const created = await storage.createDiscrepancies(detected.map(d => ({
      invoiceId: savedById.get(d.billLineItemId)?.invoiceId ?? null,
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

    // A member+coverage is "clean" this period if it's on the carrier's roster here but didn't produce a discrepancy.
    const companyByInvoiceId = new Map(periodInvoices.map(i => [i.id, i.companyName]));
    const dirtyRosterMemberIds = new Set(detected.map(d => d.rosterMemberId).filter((id): id is number => id !== null));
    const cleanKeys = new Set(
      roster
        .filter(r => r.carrier === carrier && !dirtyRosterMemberIds.has(r.id))
        .map(r => `${companyByInvoiceId.get(r.invoiceId)}|${normalizeName(r.memberName)}|${r.lineOfCoverage}`)
    );

    let autoReceivedCount = 0;
    const pendingOlder = await storage.getPendingAdjustmentsByCarrier(carrier);
    for (const { adjustment, invoice } of pendingOlder) {
      if (!invoice || invoice.coveragePeriodStart >= period) continue;
      const key = `${invoice.companyName}|${normalizeName(adjustment.memberName)}|${adjustment.lineOfCoverage}`;
      if (cleanKeys.has(key)) {
        await storage.updateExpectedAdjustment(adjustment.id, { status: "received" });
        autoReceivedCount++;
      }
    }

    res.json({ billLineItems: savedItems, discrepancies: created, autoReceivedCount });
  });

  app.post("/api/discrepancies/clear-bill", async (req, res) => {
    const { carrier, period } = req.body ?? {};
    if (!carrier || !period) {
      return res.status(400).json({ message: "carrier and period are required" });
    }

    const periodInvoices = await storage.getInvoicesByPeriod(period);
    const invoiceIds = periodInvoices.map(i => i.id);

    if (invoiceIds.length > 0) {
      await storage.deleteDiscrepanciesByCarrierAndInvoiceIds(carrier, invoiceIds);
      await storage.deleteBillLineItemsByCarrierAndInvoiceIds(carrier, invoiceIds);
    }
    await storage.clearCarrierBillPayout(carrier, period);

    res.json({ cleared: true });
  });

  app.post("/api/discrepancies/recheck", async (req, res) => {
    const { carrier, period } = req.body ?? {};
    if (!carrier || !period) {
      return res.status(400).json({ message: "carrier and period are required" });
    }

    const periodInvoices = await storage.getInvoicesByPeriod(period);
    const invoiceIds = periodInvoices.map(i => i.id);

    const [roster, billLineItems, allDiscrepancies] = await Promise.all([
      storage.getRosterByInvoiceIds(invoiceIds),
      storage.getBillLineItemsByCarrierAndInvoiceIds(carrier, invoiceIds),
      storage.getDiscrepanciesByCarrierAndInvoiceIds(carrier, invoiceIds),
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

    const discrepancyRows = await storage.getDiscrepanciesByCarrierAndInvoiceIds(carrier, invoiceIds);
    res.json({ discrepancies: discrepancyRows, autoResolvedCount: autoResolved.length });
  });

  app.post("/api/discrepancies/:id/resolve", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid discrepancy ID" });

    const discrepancy = await storage.getDiscrepancyById(id);
    if (!discrepancy) return res.status(404).json({ message: "Discrepancy not found" });
    if (discrepancy.status !== "open") return res.status(409).json({ message: "Discrepancy already resolved" });

    const { faultParty, resolutionNotes, amount } = req.body ?? {};
    if (faultParty !== "gusto" && faultParty !== "carrier") {
      return res.status(400).json({ message: "faultParty must be 'gusto' or 'carrier'" });
    }
    if (amount !== undefined && (isNaN(parseFloat(amount)) || parseFloat(amount) < 0)) {
      return res.status(400).json({ message: "amount must be a non-negative number" });
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
      const adjustmentAmount = amount !== undefined ? parseFloat(amount) : Math.abs(delta);
      adjustment = await storage.createExpectedAdjustment({
        discrepancyId: id,
        invoiceId: discrepancy.invoiceId,
        memberName: discrepancy.memberName,
        carrier: discrepancy.carrier,
        lineOfCoverage: discrepancy.lineOfCoverage,
        amount: adjustmentAmount.toFixed(2),
        direction: delta > 0 ? "credit_owed_to_us" : "debit_owed_to_carrier",
        status: "pending",
        createdAt: now,
      });
    }

    res.json({ discrepancy: updated, expectedAdjustment: adjustment });
  });

  app.post("/api/discrepancies/:id/reopen", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid discrepancy ID" });

    const { carrier, period } = req.body ?? {};
    if (!carrier || !period) {
      return res.status(400).json({ message: "carrier and period are required" });
    }

    const payout = await storage.getCarrierBillPayout(carrier, period);
    if (payout) {
      return res.status(409).json({ message: "This bill has already been paid — discrepancies can no longer be reopened." });
    }

    const discrepancy = await storage.getDiscrepancyById(id);
    if (!discrepancy) return res.status(404).json({ message: "Discrepancy not found" });
    if (discrepancy.status === "open") return res.status(409).json({ message: "Discrepancy is already open" });

    const updated = await storage.updateDiscrepancy(id, {
      status: "open",
      faultParty: null,
      resolutionNotes: null,
      resolvedAt: null,
    });

    let removedAdjustment = false;
    const adjustment = await storage.getExpectedAdjustmentByDiscrepancyId(id);
    if (adjustment && adjustment.status === "pending") {
      await storage.deleteExpectedAdjustment(adjustment.id);
      removedAdjustment = true;
    }

    res.json({ discrepancy: updated, removedAdjustment });
  });

  app.get("/api/expected-adjustments", async (_req, res) => {
    const pending = await storage.getAllPendingAdjustments();
    const payoutChecks = await Promise.all(
      pending.map(({ adjustment, invoice }) =>
        invoice ? storage.getCarrierBillPayout(adjustment.carrier, invoice.coveragePeriodStart) : Promise.resolve(undefined)
      )
    );
    const rows = pending.map(({ adjustment, invoice }, i) => ({
      ...adjustment,
      companyName: invoice?.companyName ?? "Unmatched to a customer",
      invoiceDate: invoice?.coveragePeriodStart ?? null,
      locked: !!payoutChecks[i],
    }));
    res.json({ adjustments: rows });
  });

  app.post("/api/expected-adjustments/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid adjustment ID" });

    const adjustment = await storage.getExpectedAdjustmentById(id);
    if (!adjustment) return res.status(404).json({ message: "Expected adjustment not found" });

    if (adjustment.invoiceId !== null) {
      const invoice = await storage.getInvoiceById(adjustment.invoiceId);
      if (invoice) {
        const payout = await storage.getCarrierBillPayout(adjustment.carrier, invoice.coveragePeriodStart);
        if (payout) {
          return res.status(409).json({ message: "This bill has already been paid — the adjustment can no longer be edited." });
        }
      }
    }

    const { amount, direction, status } = req.body ?? {};
    const patch: Partial<typeof adjustment> = {};

    if (amount !== undefined) {
      const parsed = parseFloat(amount);
      if (isNaN(parsed) || parsed < 0) return res.status(400).json({ message: "amount must be a non-negative number" });
      patch.amount = parsed.toFixed(2);
    }
    if (direction !== undefined) {
      if (direction !== "credit_owed_to_us" && direction !== "debit_owed_to_carrier") {
        return res.status(400).json({ message: "direction must be 'credit_owed_to_us' or 'debit_owed_to_carrier'" });
      }
      patch.direction = direction;
    }
    if (status !== undefined) {
      if (status !== "pending" && status !== "received") {
        return res.status(400).json({ message: "status must be 'pending' or 'received'" });
      }
      patch.status = status;
    }

    const updated = await storage.updateExpectedAdjustment(id, patch);
    res.json(updated);
  });

  app.post("/api/discrepancies/pay", async (req, res) => {
    const { carrier, period, receiptFileName } = req.body ?? {};
    if (!carrier || !period) {
      return res.status(400).json({ message: "carrier and period are required" });
    }
    if (!receiptFileName || !String(receiptFileName).trim()) {
      return res.status(400).json({ message: "A receipt of payment must be uploaded" });
    }

    const periodInvoices = await storage.getInvoicesByPeriod(period);
    if (periodInvoices.length === 0) {
      return res.status(404).json({ message: "No invoices found for this coverage period" });
    }
    const invoiceIds = periodInvoices.map(i => i.id);

    const openCount = (await storage.getDiscrepanciesByCarrierAndInvoiceIds(carrier, invoiceIds)).filter(d => d.status === "open").length;
    if (openCount > 0) {
      return res.status(409).json({ message: `${openCount} unresolved discrepancy(ies) must be resolved before payout` });
    }

    const payout = await storage.markCarrierBillPaid(carrier, period, String(receiptFileName).trim());
    res.json(payout);
  });

  return httpServer;
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/invoices", async (_req, res) => {
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

  return httpServer;
}

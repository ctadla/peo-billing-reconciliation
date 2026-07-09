import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { UploadBillDialog } from "@/components/reconciliation/UploadBillDialog";
import { ResolveDiscrepancyDialog, type ResolvableDiscrepancy } from "@/components/reconciliation/ResolveDiscrepancyDialog";
import { DiscrepancyTable, type DiscrepancyRow } from "@/components/reconciliation/DiscrepancyTable";
import { ExpectedAdjustmentsTable } from "@/components/reconciliation/ExpectedAdjustmentsTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  RefreshCw,
  DollarSign,
  Loader2,
  FileWarning,
  CheckCircle2,
  Building2,
  BadgeCheck,
} from "lucide-react";
import { format } from "date-fns";

function extractErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const jsonPart = raw.replace(/^\d+:\s*/, "");
  try {
    return JSON.parse(jsonPart).message || jsonPart;
  } catch {
    return jsonPart;
  }
}

export default function BillReconciliation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<DiscrepancyRow | null>(null);

  const { data: invoices } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
    queryFn: async () => (await fetch("/api/invoices")).json(),
  });

  useEffect(() => {
    if (!selectedInvoiceId && invoices && invoices.length > 0) {
      setSelectedInvoiceId(invoices[invoices.length - 1].id);
    }
  }, [invoices, selectedInvoiceId]);

  const { data: invoiceDetail, isLoading: invoiceLoading } = useQuery<any>({
    queryKey: ["/api/invoices", selectedInvoiceId],
    queryFn: async () => (await fetch(`/api/invoices/${selectedInvoiceId}`)).json(),
    enabled: !!selectedInvoiceId,
  });

  const { data: reconciliation, isLoading: reconLoading } = useQuery<any>({
    queryKey: ["/api/invoices", selectedInvoiceId, "discrepancies"],
    queryFn: async () => (await fetch(`/api/invoices/${selectedInvoiceId}/discrepancies`)).json(),
    enabled: !!selectedInvoiceId,
  });

  const invalidateInvoiceQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/invoices", selectedInvoiceId, "discrepancies"] });
    queryClient.invalidateQueries({ queryKey: ["/api/invoices", selectedInvoiceId] });
    queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
  };

  const uploadMutation = useMutation({
    mutationFn: async (lineItems: any[]) => {
      const res = await apiRequest("POST", `/api/invoices/${selectedInvoiceId}/bill-upload`, { lineItems });
      return res.json();
    },
    onSuccess: (data) => {
      setUploadOpen(false);
      invalidateInvoiceQueries();
      toast({
        title: "Bill checked",
        description: `${data.discrepancies.length} discrepanc${data.discrepancies.length === 1 ? "y" : "ies"} found out of ${data.billLineItems.length} line items.`,
      });
    },
    onError: (err) => toast({ title: "Upload failed", description: extractErrorMessage(err), variant: "destructive" }),
  });

  const recheckMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/invoices/${selectedInvoiceId}/recheck`);
      return res.json();
    },
    onSuccess: (data) => {
      invalidateInvoiceQueries();
      toast({
        title: "Rechecked against Active Benefits",
        description: data.autoResolvedCount > 0
          ? `${data.autoResolvedCount} discrepanc${data.autoResolvedCount === 1 ? "y" : "ies"} cleared up.`
          : "No changes since the last check.",
      });
    },
    onError: (err) => toast({ title: "Recheck failed", description: extractErrorMessage(err), variant: "destructive" }),
  });

  const resolveMutation = useMutation({
    mutationFn: async (params: { id: number; faultParty: "gusto" | "carrier"; resolutionNotes: string }) => {
      const res = await apiRequest("POST", `/api/discrepancies/${params.id}/resolve`, {
        faultParty: params.faultParty,
        resolutionNotes: params.resolutionNotes,
      });
      return res.json();
    },
    onSuccess: () => {
      setResolveTarget(null);
      invalidateInvoiceQueries();
      toast({ title: "Discrepancy resolved" });
    },
    onError: (err) => toast({ title: "Couldn't resolve", description: extractErrorMessage(err), variant: "destructive" }),
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/invoices/${selectedInvoiceId}/pay`);
      return res.json();
    },
    onSuccess: () => {
      invalidateInvoiceQueries();
      toast({ title: "Bill paid out" });
    },
    onError: (err) => toast({ title: "Couldn't pay bill", description: extractErrorMessage(err), variant: "destructive" }),
  });

  const invoice = invoiceDetail?.invoice;
  const roster = invoiceDetail?.roster || [];
  const discrepancies: DiscrepancyRow[] = reconciliation?.discrepancies || [];
  const expectedAdjustments = reconciliation?.expectedAdjustments || [];
  const summary = reconciliation?.summary || { total: 0, open: 0, resolved: 0 };
  const hasBill = (reconciliation?.billLineItems || []).length > 0;
  const isPaid = invoice?.payoutStatus === "paid";
  const canPay = hasBill && summary.open === 0 && !isPaid;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <Header activePage="bill-reconciliation" />

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileWarning className="h-5 w-5 text-[#0a8080]" />
              <span className="text-sm font-medium text-[#0a8080] uppercase tracking-wider">Bill Reconciliation</span>
            </div>
            <h2 className="text-3xl font-sans font-bold text-slate-800 tracking-tight">Discrepancy Detection</h2>
            <p className="text-muted-foreground mt-1">Check a carrier bill against Active Benefits before paying out.</p>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <Select
              value={selectedInvoiceId ? String(selectedInvoiceId) : ""}
              onValueChange={(v) => setSelectedInvoiceId(parseInt(v))}
            >
              <SelectTrigger className="w-[340px] bg-white border-slate-200" data-testid="select-invoice">
                <SelectValue placeholder="Select an invoice" />
              </SelectTrigger>
              <SelectContent>
                {invoices?.map((inv) => (
                  <SelectItem key={inv.id} value={String(inv.id)} data-testid={`invoice-option-${inv.id}`}>
                    {inv.companyName} — {inv.invoiceId} ({format(new Date(inv.coveragePeriodStart + "T00:00:00"), "MMM yyyy")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {invoiceLoading || reconLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#0a8080]" />
          </div>
        ) : !invoice ? (
          <div className="text-center py-20 text-muted-foreground">No invoice selected.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Open Discrepancies</p>
                  <h3 className={`text-2xl font-bold ${summary.open > 0 ? "text-amber-600" : "text-slate-800"}`}>{summary.open}</h3>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Resolved</p>
                  <h3 className="text-2xl font-bold text-slate-800">{summary.resolved}</h3>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pending Carrier Adjustments</p>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {expectedAdjustments.filter((a: any) => a.status === "pending").length}
                  </h3>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Payout Status</p>
                  <Badge className={isPaid ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-slate-100 text-slate-700 hover:bg-slate-100"}>
                    {isPaid ? "Paid" : "Pending"}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <Button variant="outline" className="gap-2" onClick={() => setUploadOpen(true)} data-testid="button-upload-bill">
                <Upload className="h-4 w-4" /> Upload Bill
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                disabled={!hasBill || recheckMutation.isPending}
                onClick={() => recheckMutation.mutate()}
                data-testid="button-check-corrections"
              >
                {recheckMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Check for Corrections
              </Button>
              <div className="flex-1" />
              {isPaid ? (
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 gap-1 px-3 py-1.5">
                  <BadgeCheck className="h-4 w-4" /> Paid {invoice.paidAt ? format(new Date(invoice.paidAt), "M/d/yy") : ""}
                </Badge>
              ) : (
                <Button
                  className="bg-[#0a8080] hover:bg-[#086a6a] gap-2"
                  disabled={!canPay || payMutation.isPending}
                  onClick={() => payMutation.mutate()}
                  title={!hasBill ? "Upload a bill first" : summary.open > 0 ? "Resolve all open discrepancies before paying out" : undefined}
                  data-testid="button-pay-bill"
                >
                  {payMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
                  Pay Bill
                </Button>
              )}
            </div>

            {!hasBill ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center rounded-md border bg-white shadow-sm">
                <Upload className="h-8 w-8 text-slate-300" />
                <p className="font-medium text-slate-700">No carrier bill uploaded yet</p>
                <p className="text-sm text-muted-foreground">Upload a bill to compare it against this invoice's Active Benefits roster.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {summary.open === 0 && (
                  <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" /> All discrepancies handled. This bill is clear to pay out.
                  </div>
                )}
                <DiscrepancyTable discrepancies={discrepancies} onResolve={setResolveTarget} />
                <ExpectedAdjustmentsTable adjustments={expectedAdjustments} />
              </div>
            )}
          </>
        )}
      </main>

      <UploadBillDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        roster={roster}
        onSubmit={(lineItems) => uploadMutation.mutate(lineItems)}
        isSubmitting={uploadMutation.isPending}
      />

      <ResolveDiscrepancyDialog
        discrepancy={resolveTarget as ResolvableDiscrepancy | null}
        onOpenChange={(open) => !open && setResolveTarget(null)}
        onSubmit={({ faultParty, resolutionNotes }) => {
          if (!resolveTarget) return;
          resolveMutation.mutate({ id: resolveTarget.id, faultParty, resolutionNotes });
        }}
        isSubmitting={resolveMutation.isPending}
      />
    </div>
  );
}

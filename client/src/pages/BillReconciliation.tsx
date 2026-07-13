import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { UploadBillDialog, buildSampleBill } from "@/components/reconciliation/UploadBillDialog";
import { DevModeToggle } from "@/components/dev/DevModeToggle";
import { ResolveDiscrepancyDialog, type ResolvableDiscrepancy } from "@/components/reconciliation/ResolveDiscrepancyDialog";
import { DiscrepancyTable, type DiscrepancyRow } from "@/components/reconciliation/DiscrepancyTable";
import { ExpectedAdjustmentsTable, type ExpectedAdjustmentRow } from "@/components/reconciliation/ExpectedAdjustmentsTable";
import { EditAdjustmentDialog, type EditableAdjustment } from "@/components/reconciliation/EditAdjustmentDialog";
import { UploadReceiptDialog } from "@/components/reconciliation/UploadReceiptDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Download,
  RefreshCw,
  ExternalLink,
  Loader2,
  FileWarning,
  CheckCircle2,
  Shield,
  BadgeCheck,
} from "lucide-react";
import { format } from "date-fns";

const CARRIERS = ["Guardian", "Aetna"];
const PROCESS_PAYMENT_URL = "https://www.aetna.com/health-care-professionals/claims-payment-reimbursement.html";

function extractErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const jsonPart = raw.replace(/^\d+:\s*/, "");
  try {
    return JSON.parse(jsonPart).message || jsonPart;
  } catch {
    return jsonPart;
  }
}

interface DiscrepancyReport {
  isPaid: boolean;
  paidAt: string | null;
  receiptFileName: string | null;
  hasBill: boolean;
  roster: any[];
  discrepancies: DiscrepancyRow[];
  expectedAdjustments: ExpectedAdjustmentRow[];
  summary: { total: number; open: number; resolved: number; companyCount: number };
}

export default function BillReconciliation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCarrier, setSelectedCarrier] = useState<string>(
    () => new URLSearchParams(window.location.search).get("carrier") || CARRIERS[0]
  );
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    () => new URLSearchParams(window.location.search).get("period") || ""
  );
  const [uploadOpen, setUploadOpen] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<DiscrepancyRow | null>(null);
  const [editAdjustmentTarget, setEditAdjustmentTarget] = useState<ExpectedAdjustmentRow | null>(null);
  const [receiptUploadOpen, setReceiptUploadOpen] = useState(false);

  const { data: periods } = useQuery<{ start: string; end: string }[]>({
    queryKey: ["/api/peo/periods"],
    queryFn: async () => (await fetch("/api/peo/periods")).json(),
  });

  useEffect(() => {
    if (!selectedPeriod && periods && periods.length > 0) {
      setSelectedPeriod(periods[periods.length - 1].start);
    }
  }, [periods, selectedPeriod]);

  const { data: report, isLoading: reportLoading } = useQuery<DiscrepancyReport>({
    queryKey: ["/api/discrepancies", selectedCarrier, selectedPeriod],
    queryFn: async () => (await fetch(`/api/discrepancies?carrier=${encodeURIComponent(selectedCarrier)}&period=${encodeURIComponent(selectedPeriod)}`)).json(),
    enabled: !!selectedCarrier && !!selectedPeriod,
  });

  const invalidateReport = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/discrepancies", selectedCarrier, selectedPeriod] });
  };

  const uploadMutation = useMutation({
    mutationFn: async (params: { carrier: string; period: string; lineItems: any[] }) => {
      const res = await apiRequest("POST", "/api/discrepancies/bill-upload", params);
      return res.json();
    },
    onSuccess: (data, params) => {
      setUploadOpen(false);
      setSelectedCarrier(params.carrier);
      setSelectedPeriod(params.period);
      queryClient.invalidateQueries({ queryKey: ["/api/discrepancies", params.carrier, params.period] });
      const autoReceivedNote = data.autoReceivedCount > 0
        ? ` ${data.autoReceivedCount} prior expected adjustment${data.autoReceivedCount === 1 ? "" : "s"} auto-marked received.`
        : "";
      toast({
        title: "Bill checked",
        description: `${data.discrepancies.length} discrepanc${data.discrepancies.length === 1 ? "y" : "ies"} found out of ${data.billLineItems.length} line items.${autoReceivedNote}`,
      });
    },
    onError: (err) => toast({ title: "Upload failed", description: extractErrorMessage(err), variant: "destructive" }),
  });

  const recheckMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/discrepancies/recheck", { carrier: selectedCarrier, period: selectedPeriod });
      return res.json();
    },
    onSuccess: (data) => {
      invalidateReport();
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
    mutationFn: async (params: { id: number; faultParty: "gusto" | "carrier"; resolutionNotes: string; amount?: string }) => {
      const res = await apiRequest("POST", `/api/discrepancies/${params.id}/resolve`, {
        faultParty: params.faultParty,
        resolutionNotes: params.resolutionNotes,
        amount: params.amount,
      });
      return res.json();
    },
    onSuccess: () => {
      setResolveTarget(null);
      invalidateReport();
      toast({ title: "Discrepancy resolved" });
    },
    onError: (err) => toast({ title: "Couldn't resolve", description: extractErrorMessage(err), variant: "destructive" }),
  });

  const reopenMutation = useMutation({
    mutationFn: async (discrepancyId: number) => {
      const res = await apiRequest("POST", `/api/discrepancies/${discrepancyId}/reopen`, { carrier: selectedCarrier, period: selectedPeriod });
      return res.json();
    },
    onSuccess: (data) => {
      invalidateReport();
      toast({
        title: "Discrepancy reopened",
        description: data.removedAdjustment ? "The pending expected adjustment tied to it was removed." : undefined,
      });
    },
    onError: (err) => toast({ title: "Couldn't reopen", description: extractErrorMessage(err), variant: "destructive" }),
  });

  const editAdjustmentMutation = useMutation({
    mutationFn: async (params: { id: number; amount: string; direction: "credit_owed_to_us" | "debit_owed_to_carrier"; status: "pending" | "received" }) => {
      const res = await apiRequest("POST", `/api/expected-adjustments/${params.id}`, {
        amount: params.amount,
        direction: params.direction,
        status: params.status,
      });
      return res.json();
    },
    onSuccess: () => {
      setEditAdjustmentTarget(null);
      invalidateReport();
      toast({ title: "Adjustment updated" });
    },
    onError: (err) => toast({ title: "Couldn't update adjustment", description: extractErrorMessage(err), variant: "destructive" }),
  });

  const payMutation = useMutation({
    mutationFn: async (receiptFileName: string) => {
      const res = await apiRequest("POST", "/api/discrepancies/pay", { carrier: selectedCarrier, period: selectedPeriod, receiptFileName });
      return res.json();
    },
    onSuccess: () => {
      setReceiptUploadOpen(false);
      invalidateReport();
      toast({ title: "Payment marked complete" });
    },
    onError: (err) => toast({ title: "Couldn't mark as complete", description: extractErrorMessage(err), variant: "destructive" }),
  });

  const clearBillMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/discrepancies/clear-bill", { carrier: selectedCarrier, period: selectedPeriod });
      return res.json();
    },
    onSuccess: () => {
      invalidateReport();
      toast({ title: "Reverted to Awaiting Bill" });
    },
    onError: (err) => toast({ title: "Couldn't clear bill", description: extractErrorMessage(err), variant: "destructive" }),
  });

  const handleDevModeChange = (next: "awaiting" | "ingested") => {
    if (next === "ingested") {
      if (!report?.roster?.length) {
        toast({ title: "No roster to sample from", description: "This carrier has no roster members for the selected period.", variant: "destructive" });
        return;
      }
      uploadMutation.mutate({ carrier: selectedCarrier, period: selectedPeriod, lineItems: buildSampleBill(report.roster) });
    } else {
      clearBillMutation.mutate();
    }
  };

  const openDiscrepancies = (report?.discrepancies || []).filter((d) => d.status === "open");
  const pendingAdjustments = (report?.expectedAdjustments || []).filter((a) => a.status === "pending");
  const summary = report?.summary || { total: 0, open: 0, resolved: 0, companyCount: 0 };
  const hasBill = report?.hasBill || false;
  const isPaid = report?.isPaid || false;
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
            <p className="text-muted-foreground mt-1">Carrier billing discrepancies across all customers for a coverage period.</p>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-500" />
            <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
              <SelectTrigger className="w-[140px] bg-white border-slate-200" data-testid="select-carrier">
                <SelectValue placeholder="Carrier" />
              </SelectTrigger>
              <SelectContent>
                {CARRIERS.map((carrier) => (
                  <SelectItem key={carrier} value={carrier} data-testid={`carrier-option-${carrier}`}>
                    {carrier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px] bg-white border-slate-200" data-testid="select-period">
                <SelectValue placeholder="Coverage period" />
              </SelectTrigger>
              <SelectContent>
                {periods?.slice().reverse().map((p) => (
                  <SelectItem key={p.start} value={p.start} data-testid={`period-option-${p.start}`}>
                    {format(new Date(p.start + "T00:00:00"), "MMMM yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          <Button
            variant="outline"
            className="gap-2"
            disabled={!hasBill}
            onClick={() => window.open(`/api/discrepancies/bill-download?carrier=${encodeURIComponent(selectedCarrier)}&period=${encodeURIComponent(selectedPeriod)}`, "_blank")}
            data-testid="button-download-bill"
          >
            <Download className="h-4 w-4" /> Download Bill
          </Button>
          <div className="flex-1" />
          {isPaid ? (
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 gap-1 px-3 py-1.5">
              <BadgeCheck className="h-4 w-4" />
              Paid {report?.paidAt ? format(new Date(report.paidAt), "M/d/yy") : ""}
              {report?.receiptFileName ? ` · ${report.receiptFileName}` : ""}
            </Badge>
          ) : (
            <>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open(PROCESS_PAYMENT_URL, "_blank")}
                data-testid="button-process-payment"
              >
                <ExternalLink className="h-4 w-4" /> Process Payment
              </Button>
              <Button
                className="bg-[#0a8080] hover:bg-[#086a6a] gap-2"
                disabled={!canPay}
                onClick={() => setReceiptUploadOpen(true)}
                title={!hasBill ? "Upload a bill first" : summary.open > 0 ? "Resolve all open discrepancies before paying out" : undefined}
                data-testid="button-mark-complete"
              >
                <CheckCircle2 className="h-4 w-4" /> Mark as Complete
              </Button>
            </>
          )}
        </div>

        {reportLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#0a8080]" />
          </div>
        ) : !hasBill ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center rounded-md border bg-white shadow-sm">
            <Upload className="h-8 w-8 text-slate-300" />
            <p className="font-medium text-slate-700">No carrier bill uploaded yet</p>
            <p className="text-sm text-muted-foreground">Upload a bill to compare it against every customer's Active Benefits roster for this carrier and coverage date.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {summary.open === 0 && (
              <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4" /> All discrepancies handled. This bill is clear to pay out.
              </div>
            )}
            <div className="space-y-3">
              <h3 className="text-lg font-sans font-bold text-slate-800">Open Discrepancies</h3>
              <DiscrepancyTable discrepancies={openDiscrepancies} onResolve={setResolveTarget} />
            </div>
            <ExpectedAdjustmentsTable
              adjustments={pendingAdjustments}
              onEdit={setEditAdjustmentTarget}
              onReopen={(a) => reopenMutation.mutate(a.discrepancyId)}
              locked={isPaid}
            />
          </div>
        )}
      </main>

      <UploadBillDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        carriers={CARRIERS}
        periods={periods || []}
        defaultCarrier={selectedCarrier}
        defaultPeriod={selectedPeriod}
        onSubmit={({ carrier, period, lineItems }) => uploadMutation.mutate({ carrier, period, lineItems })}
        isSubmitting={uploadMutation.isPending}
      />

      <ResolveDiscrepancyDialog
        discrepancy={resolveTarget as ResolvableDiscrepancy | null}
        onOpenChange={(open) => !open && setResolveTarget(null)}
        onSubmit={({ faultParty, resolutionNotes, amount }) => {
          if (!resolveTarget) return;
          resolveMutation.mutate({ id: resolveTarget.id, faultParty, resolutionNotes, amount });
        }}
        isSubmitting={resolveMutation.isPending}
      />

      <EditAdjustmentDialog
        adjustment={editAdjustmentTarget as EditableAdjustment | null}
        onOpenChange={(open) => !open && setEditAdjustmentTarget(null)}
        onSubmit={({ amount, direction, status }) => {
          if (!editAdjustmentTarget) return;
          editAdjustmentMutation.mutate({ id: editAdjustmentTarget.id, amount, direction, status });
        }}
        isSubmitting={editAdjustmentMutation.isPending}
      />

      <UploadReceiptDialog
        open={receiptUploadOpen}
        onOpenChange={setReceiptUploadOpen}
        onSubmit={(receiptFileName) => payMutation.mutate(receiptFileName)}
        isSubmitting={payMutation.isPending}
      />

      <DevModeToggle
        mode={hasBill ? "ingested" : "awaiting"}
        onModeChange={handleDevModeChange}
        isBusy={reportLoading || uploadMutation.isPending || clearBillMutation.isPending}
      />
    </div>
  );
}

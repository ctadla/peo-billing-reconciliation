import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { SummaryCards } from "@/components/reconciliation/SummaryCards";
import { BilledRosterTable } from "@/components/reconciliation/BilledRosterTable";
import { RetroTable } from "@/components/reconciliation/RetroTable";
import { PostCutoffTable } from "@/components/reconciliation/PostCutoffTable";
import { MemberDetailSheet } from "@/components/reconciliation/MemberDetailSheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";

function formatPeriodLabel(start: string, end: string) {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const month = format(s, "MMMM yyyy");
  const range = `${s.getMonth() + 1}/${s.getDate()}–${e.getMonth() + 1}/${e.getDate()}`;
  return `${month} (${range})`;
}

function formatTimestamp(ts: string) {
  const d = new Date(ts);
  return format(d, "M/d/yy hh:mm a") + " PT";
}

export default function InvoiceReconciliation() {
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");

  const { data: invoiceList, isLoading: listLoading } = useQuery({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      const res = await fetch("/api/invoices");
      return res.json();
    },
  });

  const activeInvoiceId = selectedInvoiceId || (invoiceList && invoiceList.length > 0 ? String(invoiceList[invoiceList.length - 1].id) : "");

  const { data: invoiceDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["/api/invoices", activeInvoiceId],
    queryFn: async () => {
      const res = await fetch(`/api/invoices/${activeInvoiceId}`);
      return res.json();
    },
    enabled: !!activeInvoiceId,
  });

  const handleMemberClick = (member: any) => {
    setSelectedMember(member);
    setIsSheetOpen(true);
  };

  const isLoading = listLoading || detailLoading;

  const summaryData = invoiceDetail?.invoice
    ? {
        coveragePeriod: `${format(new Date(invoiceDetail.invoice.coveragePeriodStart + "T00:00:00"), "M/d/yy")} – ${format(new Date(invoiceDetail.invoice.coveragePeriodEnd + "T00:00:00"), "M/d/yy")}`,
        invoiceDate: formatTimestamp(invoiceDetail.invoice.invoiceGeneratedAt),
        cutoffDate: formatTimestamp(invoiceDetail.invoice.cutoffTimestamp),
        invoiceId: invoiceDetail.invoice.invoiceId,
        batchId: invoiceDetail.invoice.batchId,
        totalRemitted: parseFloat(invoiceDetail.invoice.totalRemitted),
        retroTotal: parseFloat(invoiceDetail.invoice.retroTotal),
        basePremium: parseFloat(invoiceDetail.invoice.basePremiumTotal),
      }
    : null;

  const rosterData = invoiceDetail?.roster?.map((m: any) => ({
    id: String(m.id),
    worksite: m.worksite,
    name: m.memberName,
    employeeId: m.employeeId,
    plan: m.plan,
    tier: m.tier,
    effectiveDate: format(new Date(m.coverageEffectiveDate + "T00:00:00"), "MM/dd/yyyy"),
    termDate: m.terminationDate ? format(new Date(m.terminationDate + "T00:00:00"), "MM/dd/yyyy") : undefined,
    monthlyPremium: parseFloat(m.monthlyPremium),
    employeeCost: parseFloat(m.employeeCost),
    dependentCost: parseFloat(m.dependentCost),
    flags: m.flags || undefined,
  })) || [];

  const retroData = invoiceDetail?.retro?.map((r: any) => ({
    id: String(r.id),
    worksite: r.worksite,
    name: r.memberName,
    eventType: r.eventType,
    originalPeriod: r.originalPeriod,
    effectiveDate: format(new Date(r.effectiveDate + "T00:00:00"), "MM/dd/yyyy"),
    amount: parseFloat(r.amount),
    reason: r.reasonCode,
    processedAt: formatTimestamp(r.processedAt),
  })) || [];

  const postCutoffData = invoiceDetail?.postCutoff?.map((p: any) => ({
    id: String(p.id),
    worksite: p.worksite,
    name: p.memberName,
    eventType: p.eventType,
    effectiveDate: format(new Date(p.effectiveDate + "T00:00:00"), "MM/dd/yyyy"),
    expectedPremium: parseFloat(p.expectedPremium),
    expectedMonth: p.expectedMonth,
    processedAt: formatTimestamp(p.processedAt),
  })) || [];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <Header />

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-3xl font-serif font-bold text-slate-800 tracking-tight">Invoice Reconciliation</h2>
            <p className="text-muted-foreground mt-1">Audit premiums, retro adjustments, and roster changes for this billing cycle.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Viewing Invoice:</span>
            <Select value={activeInvoiceId} onValueChange={setSelectedInvoiceId}>
              <SelectTrigger className="w-[280px] bg-white border-slate-200" data-testid="select-period">
                <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                <SelectValue placeholder="Select coverage period" />
              </SelectTrigger>
              <SelectContent>
                {invoiceList?.slice().reverse().map((inv: any) => (
                  <SelectItem key={inv.id} value={String(inv.id)} data-testid={`period-option-${inv.id}`}>
                    {formatPeriodLabel(inv.coveragePeriodStart, inv.coveragePeriodEnd)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#3A7D73]" />
          </div>
        ) : summaryData ? (
          <>
            <SummaryCards data={summaryData} />

            <div className="space-y-6">
              <Tabs defaultValue="roster" className="w-full">
                <TabsList className="bg-white border p-1 h-12 mb-6 w-full justify-start rounded-lg shadow-sm">
                  <TabsTrigger value="roster" className="data-[state=active]:bg-[#3A7D73] data-[state=active]:text-white px-6 h-9" data-testid="tab-roster">
                    Current Roster & Billing
                  </TabsTrigger>
                  <TabsTrigger value="retro" className="data-[state=active]:bg-[#3A7D73] data-[state=active]:text-white px-6 h-9" data-testid="tab-retro">
                    Retro Adjustments
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="roster" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <BilledRosterTable
                    data={rosterData}
                    onMemberClick={handleMemberClick}
                  />
                  {postCutoffData.length > 0 && <PostCutoffTable data={postCutoffData} />}
                </TabsContent>

                <TabsContent value="retro" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <RetroTable data={retroData} />
                </TabsContent>
              </Tabs>
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            No invoice data available. Select a coverage period above.
          </div>
        )}
      </main>

      <MemberDetailSheet
        member={selectedMember}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  );
}

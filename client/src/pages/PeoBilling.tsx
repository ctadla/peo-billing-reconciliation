import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { SummaryCards } from "@/components/reconciliation/SummaryCards";
import { MemberDetailSheet } from "@/components/reconciliation/MemberDetailSheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2, Download, Filter, AlertTriangle, Building2 } from "lucide-react";
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

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

export default function PeoBilling() {
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");

  const { data: periods } = useQuery({
    queryKey: ["/api/peo/periods"],
    queryFn: async () => {
      const res = await fetch("/api/peo/periods");
      return res.json();
    },
  });

  const { data: companies } = useQuery({
    queryKey: ["/api/peo/companies"],
    queryFn: async () => {
      const res = await fetch("/api/peo/companies");
      return res.json();
    },
  });

  const activePeriod = selectedPeriod || (periods && periods.length > 0 ? periods[periods.length - 1].start : "");

  const { data: billingData, isLoading } = useQuery({
    queryKey: ["/api/peo/billing", activePeriod, selectedCompany],
    queryFn: async () => {
      const params = new URLSearchParams({ period: activePeriod });
      if (selectedCompany && selectedCompany !== "all") {
        params.set("company", selectedCompany);
      }
      const res = await fetch(`/api/peo/billing?${params}`);
      return res.json();
    },
    enabled: !!activePeriod,
  });

  const handleMemberClick = (member: any) => {
    setSelectedMember(member);
    setIsSheetOpen(true);
  };

  const summaryData = billingData?.summary
    ? {
        coveragePeriod: `${format(new Date(billingData.summary.periodStart + "T00:00:00"), "M/d/yy")} – ${format(new Date(billingData.summary.periodEnd + "T00:00:00"), "M/d/yy")}`,
        invoiceDate: `${billingData.summary.invoiceCount} invoices across ${billingData.summary.companyCount} groups`,
        cutoffDate: billingData.invoices?.[0]?.cutoffTimestamp ? formatTimestamp(billingData.invoices[0].cutoffTimestamp) : "N/A",
        invoiceId: `${billingData.summary.invoiceCount} invoices`,
        batchId: selectedCompany !== "all" ? billingData.invoices?.[0]?.batchId || "—" : "Multiple",
        totalRemitted: billingData.summary.totalRemitted,
        retroTotal: billingData.summary.retroTotal,
        basePremium: billingData.summary.basePremium,
      }
    : null;

  const rosterData = billingData?.roster?.map((m: any) => ({
    id: String(m.id),
    companyName: m.companyName,
    name: m.memberName,
    employeeId: m.employeeId,
    plan: m.plan,
    tier: m.tier,
    effectiveDate: format(new Date(m.coverageEffectiveDate + "T00:00:00"), "MM/dd/yyyy"),
    monthlyPremium: parseFloat(m.monthlyPremium),
    employeeCost: parseFloat(m.employeeCost),
    dependentCost: parseFloat(m.dependentCost),
    flags: m.flags || undefined,
  })) || [];

  const retroData = billingData?.retro?.map((r: any) => ({
    id: String(r.id),
    companyName: r.companyName,
    name: r.memberName,
    eventType: r.eventType,
    originalPeriod: r.originalPeriod,
    effectiveDate: format(new Date(r.effectiveDate + "T00:00:00"), "MM/dd/yyyy"),
    amount: parseFloat(r.amount),
    reason: r.reasonCode,
    processedAt: formatTimestamp(r.processedAt),
  })) || [];

  const postCutoffData = billingData?.postCutoff?.map((p: any) => ({
    id: String(p.id),
    companyName: p.companyName,
    name: p.memberName,
    eventType: p.eventType,
    effectiveDate: format(new Date(p.effectiveDate + "T00:00:00"), "MM/dd/yyyy"),
    expectedPremium: parseFloat(p.expectedPremium),
    expectedMonth: p.expectedMonth,
    processedAt: formatTimestamp(p.processedAt),
  })) || [];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <Header activePage="peo-billing" />

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-5 w-5 text-[#3A7D73]" />
              <span className="text-sm font-medium text-[#3A7D73] uppercase tracking-wider">PEO-Level View</span>
            </div>
            <h2 className="text-3xl font-serif font-bold text-slate-800 tracking-tight">PEO Billing Reconciliation</h2>
            <p className="text-muted-foreground mt-1">Aggregated premium data across all groups in the PEO.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Group:</span>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-[240px] bg-white border-slate-200" data-testid="select-company">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {companies?.map((c: string) => (
                    <SelectItem key={c} value={c} data-testid={`company-option-${c}`}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Period:</span>
              <Select value={activePeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[260px] bg-white border-slate-200" data-testid="select-peo-period">
                  <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                  <SelectValue placeholder="Select coverage period" />
                </SelectTrigger>
                <SelectContent>
                  {periods?.slice().reverse().map((p: any) => (
                    <SelectItem key={p.start} value={p.start} data-testid={`peo-period-${p.start}`}>
                      {formatPeriodLabel(p.start, p.end)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                  <TabsTrigger value="roster" className="data-[state=active]:bg-[#3A7D73] data-[state=active]:text-white px-6 h-9" data-testid="peo-tab-roster">
                    Current Roster & Billing
                  </TabsTrigger>
                  <TabsTrigger value="retro" className="data-[state=active]:bg-[#3A7D73] data-[state=active]:text-white px-6 h-9" data-testid="peo-tab-retro">
                    Retro Adjustments
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="roster" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* PEO Billed Roster */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-serif font-bold text-slate-800">Billed Roster</h3>
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                          {rosterData.length} Members
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" className="h-8 gap-2" data-testid="peo-export-roster">
                        <Download className="h-3.5 w-3.5" /> Export CSV
                      </Button>
                    </div>

                    <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="font-semibold text-slate-600">Group</TableHead>
                            <TableHead className="font-semibold text-slate-600">Member Name</TableHead>
                            <TableHead className="font-semibold text-slate-600">ID</TableHead>
                            <TableHead className="font-semibold text-slate-600">Plan</TableHead>
                            <TableHead className="font-semibold text-slate-600">Tier</TableHead>
                            <TableHead className="font-semibold text-slate-600">Effective</TableHead>
                            <TableHead className="font-semibold text-slate-600">Premium</TableHead>
                            <TableHead className="font-semibold text-slate-600">Employee Cost</TableHead>
                            <TableHead className="font-semibold text-slate-600">Dependent Cost</TableHead>
                            <TableHead className="font-semibold text-slate-600 text-right">Flags</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rosterData.map((member: any) => (
                            <TableRow
                              key={member.id}
                              className="hover:bg-slate-50 cursor-pointer transition-colors"
                              onClick={() => handleMemberClick(member)}
                            >
                              <TableCell className="font-medium text-slate-700">{member.companyName}</TableCell>
                              <TableCell>
                                <span className="font-semibold text-[#3A7D73] hover:underline">{member.name}</span>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs">{member.employeeId}</TableCell>
                              <TableCell>{member.plan}</TableCell>
                              <TableCell>{member.tier}</TableCell>
                              <TableCell>{member.effectiveDate}</TableCell>
                              <TableCell>{formatCurrency(member.monthlyPremium)}</TableCell>
                              <TableCell className="text-muted-foreground">{formatCurrency(member.employeeCost)}</TableCell>
                              <TableCell className="text-muted-foreground">{formatCurrency(member.dependentCost)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  {member.flags?.map((flag: string) => (
                                    <Badge key={flag} variant="secondary" className="text-[10px] h-5 px-1.5 bg-amber-50 text-amber-700 border-amber-200">
                                      {flag}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Post-cutoff */}
                  {postCutoffData.length > 0 && (
                    <div className="space-y-4 border-t border-slate-200 pt-8 mt-8">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-serif font-bold text-slate-800">Post-Cutoff Changes</h3>
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 shadow-none font-normal gap-1">
                              <AlertTriangle className="h-3 w-3" /> Not Billed Yet
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Changes processed after the invoice cutoff. These will be reflected in the next billing cycle.
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 gap-2">
                          <Download className="h-3.5 w-3.5" /> Export CSV
                        </Button>
                      </div>

                      <div className="rounded-md border bg-slate-50/50 border-slate-200 shadow-sm overflow-hidden opacity-90">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="font-semibold text-slate-500">Group</TableHead>
                              <TableHead className="font-semibold text-slate-500">Member Name</TableHead>
                              <TableHead className="font-semibold text-slate-500">Event Type</TableHead>
                              <TableHead className="font-semibold text-slate-500">Effective Date</TableHead>
                              <TableHead className="font-semibold text-slate-500">Expected Impact</TableHead>
                              <TableHead className="font-semibold text-slate-500 text-right">Est. Premium</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {postCutoffData.map((item: any) => (
                              <TableRow key={item.id} className="hover:bg-slate-100">
                                <TableCell className="font-medium text-slate-600">{item.companyName}</TableCell>
                                <TableCell>
                                  <span className="font-semibold text-slate-700">{item.name}</span>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-white text-slate-600 border-slate-200 font-normal">
                                    {item.eventType}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-slate-600">{item.effectiveDate}</TableCell>
                                <TableCell className="text-slate-600">{item.expectedMonth}</TableCell>
                                <TableCell className="text-right font-medium text-slate-600">
                                  {formatCurrency(item.expectedPremium)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="retro" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-serif font-bold text-slate-800">Retro Adjustments Included</h3>
                      <Button variant="outline" size="sm" className="h-8 gap-2">
                        <Download className="h-3.5 w-3.5" /> Export CSV
                      </Button>
                    </div>

                    <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="font-semibold text-slate-600">Group</TableHead>
                            <TableHead className="font-semibold text-slate-600">Member Name</TableHead>
                            <TableHead className="font-semibold text-slate-600">Event Type</TableHead>
                            <TableHead className="font-semibold text-slate-600">Original Period</TableHead>
                            <TableHead className="font-semibold text-slate-600">Effective</TableHead>
                            <TableHead className="font-semibold text-slate-600">Reason</TableHead>
                            <TableHead className="font-semibold text-slate-600 text-right">Adjustment</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {retroData.map((item: any) => (
                            <TableRow key={item.id} className="hover:bg-slate-50">
                              <TableCell className="font-medium text-slate-700">{item.companyName}</TableCell>
                              <TableCell>
                                <span className="font-semibold text-[#3A7D73] hover:underline cursor-pointer">{item.name}</span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-normal">
                                  {item.eventType}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{item.originalPeriod}</TableCell>
                              <TableCell>{item.effectiveDate}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{item.reason}</TableCell>
                              <TableCell className={`text-right font-medium ${item.amount < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                {item.amount > 0 ? "+" : ""}{formatCurrency(item.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {retroData.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                No retro adjustments for this period.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            No billing data available. Select a coverage period above.
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

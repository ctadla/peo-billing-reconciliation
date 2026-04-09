import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { SummaryCards } from "@/components/reconciliation/SummaryCards";
import { PostCutoffTable } from "@/components/reconciliation/PostCutoffTable";
import { RetroTable } from "@/components/reconciliation/RetroTable";
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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, Loader2, Download, Filter, AlertTriangle, Building2, ArrowLeft, Search, DollarSign, FileText, AlertCircle, ChevronDown } from "lucide-react";
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
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [companySearch, setCompanySearch] = useState("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [coverageFilter, setCoverageFilter] = useState<string>("all");
  const comboboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setComboboxOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const { data: aggregatedData, isLoading: aggLoading } = useQuery({
    queryKey: ["/api/peo/billing", activePeriod, "all"],
    queryFn: async () => {
      const params = new URLSearchParams({ period: activePeriod });
      const res = await fetch(`/api/peo/billing?${params}`);
      return res.json();
    },
    enabled: !!activePeriod && !selectedCompany,
  });

  const { data: companyData, isLoading: companyLoading } = useQuery({
    queryKey: ["/api/peo/billing", activePeriod, selectedCompany],
    queryFn: async () => {
      const params = new URLSearchParams({ period: activePeriod, company: selectedCompany! });
      const res = await fetch(`/api/peo/billing?${params}`);
      return res.json();
    },
    enabled: !!activePeriod && !!selectedCompany,
  });

  const handleMemberClick = (member: any) => {
    setSelectedMember(member);
    setIsSheetOpen(true);
  };

  const handleSelectCompany = (company: string) => {
    setSelectedCompany(company);
    setCoverageFilter("all");
  };

  const handleBackToLanding = () => {
    setSelectedCompany(null);
    setCoverageFilter("all");
  };

  const filteredCompanies = companies?.filter((c: string) =>
    c.toLowerCase().includes(companySearch.toLowerCase())
  ) || [];


  if (selectedCompany) {
    return (
      <CompanyInvoiceView
        companyName={selectedCompany}
        activePeriod={activePeriod}
        periods={periods}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        billingData={companyData}
        isLoading={companyLoading}
        onBack={handleBackToLanding}
        onMemberClick={handleMemberClick}
        coverageFilter={coverageFilter}
        onCoverageFilterChange={setCoverageFilter}
        selectedMember={selectedMember}
        isSheetOpen={isSheetOpen}
        onSheetOpenChange={setIsSheetOpen}
        companies={companies || []}
        onCompanyChange={handleSelectCompany}
      />
    );
  }

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
            <h2 className="text-3xl font-serif font-bold text-slate-800 tracking-tight">PEO Billing</h2>
            <p className="text-muted-foreground mt-1">Aggregated premium data across all groups. Select a company to view details.</p>
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

        {aggLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#3A7D73]" />
          </div>
        ) : aggregatedData?.summary ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="border-l-4 border-l-[#3A7D73] shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Coverage Period</p>
                      <h3 className="text-xl font-bold text-slate-800">
                        {format(new Date(aggregatedData.summary.periodStart + "T00:00:00"), "M/d/yy")} – {format(new Date(aggregatedData.summary.periodEnd + "T00:00:00"), "M/d/yy")}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-2">{aggregatedData.summary.companyCount} groups · {aggregatedData.summary.invoiceCount} invoices</p>
                    </div>
                    <div className="bg-[#3A7D73]/10 p-2 rounded-full text-[#3A7D73]">
                      <Calendar className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Total Premium Remitted</p>
                      <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(aggregatedData.summary.totalRemitted)}</h3>
                      <p className="text-xs text-muted-foreground mt-1">Sum across all companies</p>
                    </div>
                    <div className="bg-emerald-100 p-2 rounded-full text-emerald-700">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Base Premium Total</p>
                      <h3 className="text-xl font-bold text-slate-800">{formatCurrency(aggregatedData.summary.basePremium)}</h3>
                      <p className="text-xs text-muted-foreground mt-1">Sum across all companies</p>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-full text-slate-600">
                      <FileText className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Retro Total (Net)</p>
                      <h3 className={`text-xl font-bold ${aggregatedData.summary.retroTotal < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {formatCurrency(aggregatedData.summary.retroTotal)}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">Sum across all companies</p>
                    </div>
                    <div className="bg-amber-100 p-2 rounded-full text-amber-700">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3 max-w-md">
              <label className="text-sm font-medium text-slate-700">Select a company to view billing details</label>
              <div className="relative" ref={comboboxRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search or select a company..."
                    value={companySearch}
                    onChange={(e) => {
                      setCompanySearch(e.target.value);
                      setComboboxOpen(true);
                    }}
                    onFocus={() => setComboboxOpen(true)}
                    className="pl-9 pr-10 h-11 bg-white border-slate-200 text-base"
                    data-testid="input-company-search"
                  />
                  <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-transform ${comboboxOpen ? "rotate-180" : ""}`} />
                </div>
                {comboboxOpen && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-md border border-slate-200 shadow-lg max-h-[280px] overflow-y-auto">
                    {filteredCompanies.length > 0 ? (
                      filteredCompanies.map((company: string) => (
                        <button
                          key={company}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2 transition-colors border-b border-slate-100 last:border-b-0"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectCompany(company);
                          }}
                          data-testid={`company-option-${company}`}
                        >
                          <Building2 className="h-4 w-4 text-[#3A7D73] shrink-0" />
                          <span className="font-medium text-slate-700">{company}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                        No companies found.
                      </div>
                    )}
                  </div>
                )}
              </div>
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

interface CompanyInvoiceViewProps {
  companyName: string;
  activePeriod: string;
  periods: any;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  billingData: any;
  isLoading: boolean;
  onBack: () => void;
  onMemberClick: (member: any) => void;
  coverageFilter: string;
  onCoverageFilterChange: (filter: string) => void;
  selectedMember: any;
  isSheetOpen: boolean;
  onSheetOpenChange: (open: boolean) => void;
  companies: string[];
  onCompanyChange: (company: string) => void;
}

function CompanyInvoiceView({
  companyName,
  activePeriod,
  periods,
  selectedPeriod,
  onPeriodChange,
  billingData,
  isLoading,
  onBack,
  onMemberClick,
  coverageFilter,
  onCoverageFilterChange,
  selectedMember,
  isSheetOpen,
  onSheetOpenChange,
  companies,
  onCompanyChange,
}: CompanyInvoiceViewProps) {
  const summaryData = billingData?.summary
    ? {
        coveragePeriod: `${format(new Date(billingData.summary.periodStart + "T00:00:00"), "M/d/yy")} – ${format(new Date(billingData.summary.periodEnd + "T00:00:00"), "M/d/yy")}`,
        invoiceDate: billingData.invoices?.length === 1 && billingData.invoices[0]?.invoiceGeneratedAt ? formatTimestamp(billingData.invoices[0].invoiceGeneratedAt) : `${billingData.summary.invoiceCount} invoices`,
        cutoffDate: billingData.invoices?.length === 1 && billingData.invoices[0]?.cutoffTimestamp ? formatTimestamp(billingData.invoices[0].cutoffTimestamp) : "N/A",
        invoiceId: billingData.invoices?.length === 1 ? billingData.invoices[0]?.invoiceId || "—" : `${billingData.summary.invoiceCount} invoices`,
        batchId: billingData.invoices?.length === 1 ? billingData.invoices[0]?.batchId || "—" : "Multiple",
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
    carrier: m.carrier,
    lineOfCoverage: m.lineOfCoverage,
    plan: m.plan,
    tier: m.tier,
    effectiveDate: format(new Date(m.coverageEffectiveDate + "T00:00:00"), "MM/dd/yyyy"),
    monthlyPremium: parseFloat(m.monthlyPremium),
    employeeCost: parseFloat(m.employeeCost),
    dependentCost: parseFloat(m.dependentCost),
  })) || [];

  const retroData = billingData?.retro?.map((r: any) => ({
    id: String(r.id),
    companyName: r.companyName,
    worksite: r.worksite || "",
    name: r.memberName,
    eventType: r.eventType,
    originalPeriod: r.originalPeriod,
    effectiveDate: format(new Date(r.effectiveDate + "T00:00:00"), "MM/dd/yyyy"),
    amount: parseFloat(r.amount),
    reason: r.reasonCode,
    carrier: r.carrier || undefined,
    lineOfCoverage: r.lineOfCoverage || undefined,
    plan: r.plan || undefined,
    tier: r.tier || undefined,
    processedAt: formatTimestamp(r.processedAt),
  })) || [];

  const postCutoffData = billingData?.postCutoff?.map((p: any) => ({
    id: String(p.id),
    worksite: p.worksite || "",
    companyName: p.companyName,
    name: p.memberName,
    eventType: p.eventType,
    effectiveDate: format(new Date(p.effectiveDate + "T00:00:00"), "MM/dd/yyyy"),
    expectedPremium: parseFloat(p.expectedPremium),
    expectedMonth: p.expectedMonth,
    carrier: p.carrier || undefined,
    lineOfCoverage: p.lineOfCoverage || undefined,
    plan: p.plan || undefined,
    tier: p.tier || undefined,
    processedAt: formatTimestamp(p.processedAt),
  })) || [];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <Header activePage="peo-billing" />

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#3A7D73] hover:text-[#2d6359] hover:bg-[#3A7D73]/10 gap-1 mb-3 -ml-2"
            onClick={onBack}
            data-testid="button-back-to-landing"
          >
            <ArrowLeft className="h-4 w-4" /> Back to all companies
          </Button>

          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-5 w-5 text-[#3A7D73]" />
                <span className="text-sm font-medium text-[#3A7D73] uppercase tracking-wider">Company View</span>
              </div>
              <h2 className="text-3xl font-serif font-bold text-slate-800 tracking-tight">{companyName}</h2>
              <p className="text-muted-foreground mt-1">Invoice details and billing data for this company.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Company:</span>
                <Select value={companyName} onValueChange={onCompanyChange}>
                  <SelectTrigger className="w-[240px] bg-white border-slate-200" data-testid="select-company-picker">
                    <Building2 className="w-4 h-4 mr-2 text-slate-500" />
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies?.slice().sort((a, b) => a.localeCompare(b)).map((c: string) => (
                      <SelectItem key={c} value={c} data-testid={`company-picker-${c}`}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Invoice Month:</span>
                <Select value={activePeriod} onValueChange={onPeriodChange}>
                  <SelectTrigger className="w-[260px] bg-white border-slate-200" data-testid="select-company-period">
                    <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                    <SelectValue placeholder="Select coverage period" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods?.slice().reverse().map((p: any) => (
                      <SelectItem key={p.start} value={p.start} data-testid={`company-period-${p.start}`}>
                        {formatPeriodLabel(p.start, p.end)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-serif font-bold text-slate-800">Billed Roster</h3>
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                          {(() => { const filtered = coverageFilter === "all" ? rosterData : rosterData.filter((m: any) => m.lineOfCoverage === coverageFilter); return `${filtered.length} Line Items`; })()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={coverageFilter} onValueChange={onCoverageFilterChange}>
                          <SelectTrigger className="w-[200px] h-8 bg-white border-slate-200 text-sm" data-testid="peo-filter-coverage">
                            <Filter className="h-3.5 w-3.5 mr-2 text-slate-500" />
                            <SelectValue placeholder="All Lines of Coverage" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Lines of Coverage</SelectItem>
                            {Array.from(new Set(rosterData.map((m: any) => m.lineOfCoverage))).sort().map((ct: any) => (
                              <SelectItem key={ct} value={ct}>{ct}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" className="h-8 gap-2" data-testid="peo-export-roster">
                          <Download className="h-3.5 w-3.5" /> Export CSV
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="font-semibold text-slate-600">Member Name</TableHead>
                            <TableHead className="font-semibold text-slate-600">Carrier</TableHead>
                            <TableHead className="font-semibold text-slate-600">Line of Coverage</TableHead>
                            <TableHead className="font-semibold text-slate-600">Plan</TableHead>
                            <TableHead className="font-semibold text-slate-600">Tier</TableHead>
                            <TableHead className="font-semibold text-slate-600">Effective</TableHead>
                            <TableHead className="font-semibold text-slate-600">Premium</TableHead>
                            <TableHead className="font-semibold text-slate-600">Employee Cost</TableHead>
                            <TableHead className="font-semibold text-slate-600">Dependent Cost</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            const filtered = coverageFilter === "all" ? rosterData : rosterData.filter((m: any) => m.lineOfCoverage === coverageFilter);
                            let lastMemberKey = "";
                            return filtered.map((member: any) => {
                              const memberKey = member.employeeId || member.name;
                              const isNewMember = memberKey !== lastMemberKey;
                              lastMemberKey = memberKey;
                              return (
                                <TableRow
                                  key={member.id}
                                  className={`hover:bg-slate-50 cursor-pointer transition-colors ${isNewMember ? "border-t-2 border-slate-200" : ""}`}
                                  onClick={() => onMemberClick(member)}
                                >
                                  <TableCell>
                                    {isNewMember ? (
                                      <span className="font-semibold text-[#3A7D73] hover:underline">{member.name}</span>
                                    ) : (
                                      <span className="text-transparent select-none">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={`text-[10px] h-5 px-1.5 font-normal ${member.carrier === "Aetna" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200"}`}>
                                      {member.carrier}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm">{member.lineOfCoverage}</TableCell>
                                  <TableCell>{member.plan}</TableCell>
                                  <TableCell>{member.tier}</TableCell>
                                  <TableCell>{member.effectiveDate}</TableCell>
                                  <TableCell>{formatCurrency(member.monthlyPremium)}</TableCell>
                                  <TableCell className="text-muted-foreground">{formatCurrency(member.employeeCost)}</TableCell>
                                  <TableCell className="text-muted-foreground">{formatCurrency(member.dependentCost)}</TableCell>
                                </TableRow>
                              );
                            });
                          })()}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {postCutoffData.length > 0 && (
                    <PostCutoffTable data={postCutoffData} showWorksite={false} />
                  )}
                </TabsContent>

                <TabsContent value="retro" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <RetroTable data={retroData} showWorksite={false} />
                </TabsContent>
              </Tabs>
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            No billing data available for this company and period.
          </div>
        )}
      </main>

      <MemberDetailSheet
        member={selectedMember}
        open={isSheetOpen}
        onOpenChange={onSheetOpenChange}
      />
    </div>
  );
}

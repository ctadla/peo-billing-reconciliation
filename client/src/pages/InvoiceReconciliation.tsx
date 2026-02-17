import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { SummaryCards } from "@/components/reconciliation/SummaryCards";
import { BilledRosterTable } from "@/components/reconciliation/BilledRosterTable";
import { RetroTable } from "@/components/reconciliation/RetroTable";
import { PostCutoffTable } from "@/components/reconciliation/PostCutoffTable";
import { MemberDetailSheet } from "@/components/reconciliation/MemberDetailSheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// MOCK DATA
const SUMMARY_DATA = {
  coveragePeriod: "3/1/26 – 3/31/26",
  invoiceDate: "2/5/26 09:12 PT",
  cutoffDate: "2/4/26 23:59 PT",
  invoiceId: "INV-2026-03-9921",
  batchId: "ACH-998211",
  totalRemitted: 24550.00,
  retroTotal: -320.50,
  basePremium: 24870.50,
};

const BILLED_ROSTER_DATA = [
  {
    id: "1",
    worksite: "San Francisco HQ",
    name: "Alice Johnson",
    employeeId: "E001",
    plan: "Kaiser Silver HMO",
    tier: "Employee Only",
    effectiveDate: "01/01/2026",
    monthlyPremium: 650.00,
    employerShare: 500.00,
    employeeShare: 150.00,
  },
  {
    id: "2",
    worksite: "San Francisco HQ",
    name: "Bob Smith",
    employeeId: "E002",
    plan: "Kaiser Gold PPO",
    tier: "Family",
    effectiveDate: "01/01/2025",
    monthlyPremium: 1850.00,
    employerShare: 1200.00,
    employeeShare: 650.00,
    flags: ["Late Event"]
  },
  {
    id: "3",
    worksite: "Remote - NY",
    name: "Charlie Davis",
    employeeId: "E005",
    plan: "Anthem Blue Cross PPO",
    tier: "Employee + Spouse",
    effectiveDate: "03/01/2026",
    monthlyPremium: 1200.00,
    employerShare: 800.00,
    employeeShare: 400.00,
    flags: ["Prorated"]
  },
  {
    id: "4",
    worksite: "San Francisco HQ",
    name: "Diana Prince",
    employeeId: "E008",
    plan: "Kaiser Silver HMO",
    tier: "Employee Only",
    effectiveDate: "01/01/2024",
    monthlyPremium: 650.00,
    employerShare: 500.00,
    employeeShare: 150.00,
  },
  {
    id: "5",
    worksite: "Remote - TX",
    name: "Evan Wright",
    employeeId: "E012",
    plan: "UHC Choice Plus",
    tier: "Employee + Children",
    effectiveDate: "02/15/2026",
    monthlyPremium: 950.00,
    employerShare: 700.00,
    employeeShare: 250.00,
  }
];

const RETRO_DATA = [
  {
    id: "r1",
    worksite: "San Francisco HQ",
    name: "Bob Smith",
    eventType: "Late Enrollment",
    originalPeriod: "Feb 2026",
    effectiveDate: "02/01/2026",
    amount: 185.00,
    reason: "Added dependent retroactively",
    processedAt: "02/02/2026"
  },
  {
    id: "r2",
    worksite: "San Francisco HQ",
    name: "Sarah Connor",
    eventType: "Termination",
    originalPeriod: "Jan 2026",
    effectiveDate: "01/15/2026",
    amount: -505.50,
    reason: "Terminated mid-month",
    processedAt: "02/01/2026"
  }
];

const POST_CUTOFF_DATA = [
  {
    id: "p1",
    worksite: "Remote - NY",
    name: "Frank Castle",
    eventType: "New Hire",
    effectiveDate: "03/15/2026",
    expectedPremium: 325.00, // Prorated
    expectedMonth: "April 2026 Invoice",
    processedAt: "02/06/2026"
  }
];

export default function InvoiceReconciliation() {
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleMemberClick = (member: any) => {
    setSelectedMember(member);
    setIsSheetOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <Header />
      
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-3xl font-serif font-bold text-slate-800 tracking-tight">Invoice Reconciliation</h2>
            <p className="text-muted-foreground mt-1">Audit premiums, retro adjustments, and roster changes for this billing cycle.</p>
          </div>
          <div className="text-sm text-muted-foreground bg-white px-3 py-1 rounded border shadow-sm">
            Last updated: Today at 9:41 AM
          </div>
        </div>

        <SummaryCards data={SUMMARY_DATA} />

        <div className="space-y-6">
          <Tabs defaultValue="roster" className="w-full">
            <TabsList className="bg-white border p-1 h-12 mb-6 w-full justify-start rounded-lg shadow-sm">
              <TabsTrigger value="roster" className="data-[state=active]:bg-[#3A7D73] data-[state=active]:text-white px-6 h-9">
                Current Roster & Billing
              </TabsTrigger>
              <TabsTrigger value="retro" className="data-[state=active]:bg-[#3A7D73] data-[state=active]:text-white px-6 h-9">
                Retro Adjustments
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="roster" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <BilledRosterTable 
                data={BILLED_ROSTER_DATA} 
                onMemberClick={handleMemberClick} 
              />
              <PostCutoffTable data={POST_CUTOFF_DATA} />
            </TabsContent>
            
            <TabsContent value="retro" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <RetroTable data={RETRO_DATA} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <MemberDetailSheet 
        member={selectedMember} 
        open={isSheetOpen} 
        onOpenChange={setIsSheetOpen} 
      />
    </div>
  );
}

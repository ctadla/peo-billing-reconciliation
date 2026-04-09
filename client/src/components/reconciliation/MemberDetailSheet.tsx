import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, User, FileText, History, DollarSign } from "lucide-react";

interface Member {
  id: string;
  worksite: string;
  name: string;
  employeeId: string;
  plan: string;
  tier: string;
  effectiveDate: string;
  monthlyPremium: number;
}

interface MemberDetailSheetProps {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemberDetailSheet({ member, open, onOpenChange }: MemberDetailSheetProps) {
  if (!member) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-2xl font-sans">{member.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                <Badge variant="outline" className="font-normal">{member.employeeId}</Badge>
                <span>•</span>
                <span className="text-slate-600">{member.worksite}</span>
              </SheetDescription>
            </div>
            <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
              Active
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="enrollment" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="enrollment">Enrollment History</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="timeline">Event Timeline</TabsTrigger>
          </TabsList>
          
          <TabsContent value="enrollment" className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                <User className="h-4 w-4" /> Current Coverage
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Plan</p>
                  <p className="font-medium">{member.plan}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Coverage Tier</p>
                  <p className="font-medium">{member.tier}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Effective Date</p>
                  <p className="font-medium">{member.effectiveDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Total Premium</p>
                  <p className="font-medium">${member.monthlyPremium.toFixed(2)}/mo</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                <History className="h-4 w-4" /> History
              </h4>
              <div className="relative border-l border-slate-200 ml-2 space-y-6 pl-6 py-2">
                <div className="relative">
                  <div className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-[#0a8080] ring-4 ring-white"></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-800">Open Enrollment Change</span>
                    <span className="text-xs text-muted-foreground">Effective Jan 1, 2026</span>
                    <div className="mt-2 text-sm bg-white border p-2 rounded text-slate-600">
                      Changed from <strong>Silver HMO</strong> to <strong>Gold PPO</strong>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-slate-300 ring-4 ring-white"></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-800">Initial Enrollment</span>
                    <span className="text-xs text-muted-foreground">Effective Mar 15, 2024</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="financials">
             <div className="space-y-4">
               <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                 <div className="flex items-center gap-3">
                   <div className="bg-slate-100 p-2 rounded text-slate-600">
                     <FileText className="h-4 w-4" />
                   </div>
                   <div>
                     <p className="font-medium text-sm">March 2026 Invoice</p>
                     <p className="text-xs text-muted-foreground">Processed Feb 5, 2026</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="font-bold text-sm">$680.50</p>
                   <p className="text-xs text-emerald-600">Paid</p>
                 </div>
               </div>

               <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                 <div className="flex items-center gap-3">
                   <div className="bg-slate-100 p-2 rounded text-slate-600">
                     <FileText className="h-4 w-4" />
                   </div>
                   <div>
                     <p className="font-medium text-sm">February 2026 Invoice</p>
                     <p className="text-xs text-muted-foreground">Processed Jan 5, 2026</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="font-bold text-sm">$650.00</p>
                   <p className="text-xs text-emerald-600">Paid</p>
                 </div>
               </div>
             </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar, FileCheck, DollarSign, Clock, AlertCircle, FileText } from "lucide-react";

interface SummaryProps {
  data: {
    coveragePeriod: string;
    invoiceDate: string;
    invoiceId: string;
    totalRemitted: number;
    retroTotal: number;
    basePremium: number;
  }
}

export function SummaryCards({ data }: SummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <Card className="border-l-4 border-l-[#0a8080] shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Coverage Period</p>
              <h3 className="text-xl font-bold text-slate-800">{data.coveragePeriod}</h3>
              <div className="flex flex-col gap-1 mt-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileCheck className="h-3 w-3" />
                  <span>ID: {data.invoiceId}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Generated: {data.invoiceDate}</span>
                </div>
              </div>
            </div>
            <div className="bg-[#0a8080]/10 p-2 rounded-full text-[#0a8080]">
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
              <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(data.totalRemitted)}</h3>
              <p className="text-xs text-muted-foreground mt-1">&nbsp;</p>
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
              <h3 className="text-xl font-bold text-slate-800">{formatCurrency(data.basePremium)}</h3>
              <div className="flex flex-col gap-0.5 mt-2">
                 <span className="text-xs text-muted-foreground">Generated: {data.invoiceDate}</span>
              </div>
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
              <h3 className={`text-xl font-bold ${data.retroTotal < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                {formatCurrency(data.retroTotal)}
              </h3>
               <div className="mt-2">&nbsp;</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

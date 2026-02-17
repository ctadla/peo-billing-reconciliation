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
import { Download, AlertTriangle } from "lucide-react";

interface PostCutoffChange {
  id: string;
  worksite: string;
  name: string;
  eventType: string;
  effectiveDate: string;
  expectedPremium: number;
  expectedMonth: string;
  processedAt: string;
}

interface PostCutoffTableProps {
  data: PostCutoffChange[];
}

export function PostCutoffTable({ data }: PostCutoffTableProps) {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
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
              <TableHead className="font-semibold text-slate-500">Worksite</TableHead>
              <TableHead className="font-semibold text-slate-500">Member Name</TableHead>
              <TableHead className="font-semibold text-slate-500">Event Type</TableHead>
              <TableHead className="font-semibold text-slate-500">Effective Date</TableHead>
              <TableHead className="font-semibold text-slate-500">Expected Impact</TableHead>
              <TableHead className="font-semibold text-slate-500 text-right">Est. Premium</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id} className="hover:bg-slate-100">
                <TableCell className="font-medium text-slate-600">{item.worksite}</TableCell>
                <TableCell>
                  <span className="font-semibold text-slate-700">
                    {item.name}
                  </span>
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
  );
}

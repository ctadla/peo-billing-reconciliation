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
import { Download } from "lucide-react";

interface RetroAdjustment {
  id: string;
  worksite: string;
  name: string;
  eventType: string;
  originalPeriod: string;
  effectiveDate: string;
  amount: number;
  reason: string;
  processedAt: string;
}

interface RetroTableProps {
  data: RetroAdjustment[];
}

export function RetroTable({ data }: RetroTableProps) {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
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
              <TableHead className="font-semibold text-slate-600">Member Name</TableHead>
              <TableHead className="font-semibold text-slate-600">Event Type</TableHead>
              <TableHead className="font-semibold text-slate-600">Invoice Impacted</TableHead>
              <TableHead className="font-semibold text-slate-600">Effective</TableHead>
              <TableHead className="font-semibold text-slate-600 text-right">Adjustment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id} className="hover:bg-slate-50">
                <TableCell>
                   <span className="font-semibold text-[#3A7D73] hover:underline cursor-pointer">
                    {item.name}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-normal">
                    {item.eventType}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{item.originalPeriod}</TableCell>
                <TableCell>{item.effectiveDate}</TableCell>
                <TableCell className={`text-right font-medium ${item.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {item.amount > 0 ? '+' : ''}{formatCurrency(item.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

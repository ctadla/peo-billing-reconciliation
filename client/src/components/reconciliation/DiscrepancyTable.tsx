import { Link } from "wouter";
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
import { CheckCircle2 } from "lucide-react";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

export interface DiscrepancyRow {
  id: number;
  invoiceId: number | null;
  companyName: string;
  memberName: string;
  carrier: string;
  lineOfCoverage: string;
  discrepancyType: string;
  expectedPremium: string | null;
  billedPremium: string;
  deltaAmount: string | null;
  status: string;
  faultParty: string | null;
  resolutionNotes: string | null;
}

function statusBadge(status: string) {
  switch (status) {
    case "open":
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">Open</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

interface DiscrepancyTableProps {
  discrepancies: DiscrepancyRow[];
  onResolve: (discrepancy: DiscrepancyRow) => void;
}

export function DiscrepancyTable({ discrepancies, onResolve }: DiscrepancyTableProps) {
  if (discrepancies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center rounded-md border bg-white shadow-sm">
        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        <p className="font-medium text-slate-700">No discrepancies detected</p>
        <p className="text-sm text-muted-foreground">Upload a carrier bill to check it against Active Benefits.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="font-semibold text-slate-600">Customer</TableHead>
            <TableHead className="font-semibold text-slate-600">Member</TableHead>
            <TableHead className="font-semibold text-slate-600">Coverage</TableHead>
            <TableHead className="font-semibold text-slate-600">Expected</TableHead>
            <TableHead className="font-semibold text-slate-600">Billed</TableHead>
            <TableHead className="font-semibold text-slate-600">Delta</TableHead>
            <TableHead className="font-semibold text-slate-600">Status</TableHead>
            <TableHead className="font-semibold text-slate-600">Invoice</TableHead>
            <TableHead className="font-semibold text-slate-600 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {discrepancies.map((d) => {
            const expected = d.expectedPremium ? parseFloat(d.expectedPremium) : null;
            const billed = parseFloat(d.billedPremium);
            const delta = d.deltaAmount ? parseFloat(d.deltaAmount) : null;
            return (
              <TableRow key={d.id} className="hover:bg-slate-50" data-testid={`row-discrepancy-${d.id}`}>
                <TableCell className="text-sm text-slate-600">{d.companyName}</TableCell>
                <TableCell className="font-medium text-slate-800">{d.memberName}</TableCell>
                <TableCell className="text-sm">{d.lineOfCoverage}</TableCell>
                <TableCell>{expected !== null ? formatCurrency(expected) : <span className="text-muted-foreground">not on file</span>}</TableCell>
                <TableCell>{formatCurrency(billed)}</TableCell>
                <TableCell className={delta !== null ? (delta > 0 ? "text-rose-600 font-medium" : "text-emerald-600 font-medium") : ""}>
                  {delta !== null ? formatCurrency(delta) : "—"}
                </TableCell>
                <TableCell>{statusBadge(d.status)}</TableCell>
                <TableCell className="text-sm">
                  {d.invoiceId !== null ? (
                    <Link href={`/?invoiceId=${d.invoiceId}`} className="text-[#0a8080] hover:underline" data-testid={`link-invoice-${d.id}`}>
                      View invoice
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => onResolve(d)} data-testid={`button-resolve-${d.id}`}>
                    Resolve
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

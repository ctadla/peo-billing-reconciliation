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
import { CheckCircle2, AlertTriangle, UserX } from "lucide-react";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

export interface DiscrepancyRow {
  id: number;
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
    case "resolved_gusto_error":
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">Resolved · Gusto</Badge>;
    case "resolved_carrier_error":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">Resolved · Carrier</Badge>;
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
            <TableHead className="font-semibold text-slate-600">Member</TableHead>
            <TableHead className="font-semibold text-slate-600">Carrier</TableHead>
            <TableHead className="font-semibold text-slate-600">Coverage</TableHead>
            <TableHead className="font-semibold text-slate-600">Expected</TableHead>
            <TableHead className="font-semibold text-slate-600">Billed</TableHead>
            <TableHead className="font-semibold text-slate-600">Delta</TableHead>
            <TableHead className="font-semibold text-slate-600">Status</TableHead>
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
                <TableCell className="font-medium text-slate-800">
                  <div className="flex items-center gap-2">
                    {d.discrepancyType === "unmatched_member" ? (
                      <UserX className="h-3.5 w-3.5 text-rose-500" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    {d.memberName}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] h-5 px-1.5 font-normal ${d.carrier === "Aetna" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200"}`}>
                    {d.carrier}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{d.lineOfCoverage}</TableCell>
                <TableCell>{expected !== null ? formatCurrency(expected) : <span className="text-muted-foreground">not on file</span>}</TableCell>
                <TableCell>{formatCurrency(billed)}</TableCell>
                <TableCell className={delta !== null ? (delta > 0 ? "text-rose-600 font-medium" : "text-emerald-600 font-medium") : ""}>
                  {delta !== null ? formatCurrency(delta) : "—"}
                </TableCell>
                <TableCell>{statusBadge(d.status)}</TableCell>
                <TableCell className="text-right">
                  {d.status === "open" ? (
                    <Button size="sm" variant="outline" onClick={() => onResolve(d)} data-testid={`button-resolve-${d.id}`}>
                      Resolve
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">{d.resolutionNotes ? "Noted" : "—"}</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

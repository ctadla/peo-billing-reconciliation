import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

export interface ExpectedAdjustmentRow {
  id: number;
  memberName: string;
  carrier: string;
  lineOfCoverage: string;
  amount: string;
  direction: string;
  status: string;
}

interface ExpectedAdjustmentsTableProps {
  adjustments: ExpectedAdjustmentRow[];
}

export function ExpectedAdjustmentsTable({ adjustments }: ExpectedAdjustmentsTableProps) {
  if (adjustments.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-sans font-bold text-slate-800">Expected Carrier Adjustments</h3>
      <p className="text-sm text-muted-foreground -mt-2">
        Carrier billing errors logged here should true up on a future bill from the carrier.
      </p>
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-600">Member</TableHead>
              <TableHead className="font-semibold text-slate-600">Carrier</TableHead>
              <TableHead className="font-semibold text-slate-600">Coverage</TableHead>
              <TableHead className="font-semibold text-slate-600">Amount</TableHead>
              <TableHead className="font-semibold text-slate-600">Direction</TableHead>
              <TableHead className="font-semibold text-slate-600">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adjustments.map((a) => (
              <TableRow key={a.id} data-testid={`row-adjustment-${a.id}`}>
                <TableCell className="font-medium text-slate-800">{a.memberName}</TableCell>
                <TableCell>{a.carrier}</TableCell>
                <TableCell className="text-sm">{a.lineOfCoverage}</TableCell>
                <TableCell>{formatCurrency(parseFloat(a.amount))}</TableCell>
                <TableCell className="text-sm">
                  {a.direction === "credit_owed_to_us" ? "Credit owed to us" : "Debit owed to carrier"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={a.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}>
                    {a.status === "pending" ? "Pending" : "Received"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

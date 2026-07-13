import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

export interface ExpectedAdjustmentRow {
  id: number;
  discrepancyId: number;
  invoiceId: number | null;
  companyName: string;
  memberName: string;
  carrier: string;
  lineOfCoverage: string;
  amount: string;
  direction: string;
  status: string;
}

function directionText(carrier: string, direction: string, amount: number) {
  return direction === "credit_owed_to_us"
    ? `${carrier} owes Gusto ${formatCurrency(amount)} on a future bill.`
    : `Gusto owes ${carrier} ${formatCurrency(amount)} on a future bill.`;
}

interface ExpectedAdjustmentsTableProps {
  adjustments: ExpectedAdjustmentRow[];
  onEdit: (adjustment: ExpectedAdjustmentRow) => void;
  onReopen: (adjustment: ExpectedAdjustmentRow) => void;
  locked: boolean;
}

export function ExpectedAdjustmentsTable({ adjustments, onEdit, onReopen, locked }: ExpectedAdjustmentsTableProps) {
  if (adjustments.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-sans font-bold text-slate-800">Resolved Discrepancies</h3>
      <p className="text-sm text-muted-foreground -mt-2">
        Carrier billing errors logged here should true up on a future bill from the carrier.
      </p>
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-600">Customer</TableHead>
              <TableHead className="font-semibold text-slate-600">Member</TableHead>
              <TableHead className="font-semibold text-slate-600">Coverage</TableHead>
              <TableHead className="font-semibold text-slate-600">Amount</TableHead>
              <TableHead className="font-semibold text-slate-600">Direction</TableHead>
              <TableHead className="font-semibold text-slate-600">Invoice</TableHead>
              <TableHead className="font-semibold text-slate-600 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adjustments.map((a) => (
              <TableRow key={a.id} data-testid={`row-adjustment-${a.id}`}>
                <TableCell className="text-sm text-slate-600">{a.companyName}</TableCell>
                <TableCell className="font-medium text-slate-800">{a.memberName}</TableCell>
                <TableCell className="text-sm">{a.lineOfCoverage}</TableCell>
                <TableCell>{formatCurrency(parseFloat(a.amount))}</TableCell>
                <TableCell className="text-sm">{directionText(a.carrier, a.direction, parseFloat(a.amount))}</TableCell>
                <TableCell className="text-sm">
                  {a.invoiceId !== null ? (
                    <Link href={`/?invoiceId=${a.invoiceId}`} className="text-[#0a8080] hover:underline" data-testid={`link-invoice-adjustment-${a.id}`}>
                      View invoice
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-500"
                      disabled={locked}
                      title={locked ? "Locked — bill already paid" : undefined}
                      onClick={() => onReopen(a)}
                      data-testid={`button-reopen-adjustment-${a.id}`}
                    >
                      Reopen
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={locked}
                      title={locked ? "Locked — bill already paid" : undefined}
                      onClick={() => onEdit(a)}
                      data-testid={`button-edit-adjustment-${a.id}`}
                    >
                      Edit
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { EditAdjustmentDialog, type EditableAdjustment } from "@/components/reconciliation/EditAdjustmentDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileWarning, Loader2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

function extractErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const jsonPart = raw.replace(/^\d+:\s*/, "");
  try {
    return JSON.parse(jsonPart).message || jsonPart;
  } catch {
    return jsonPart;
  }
}

function directionText(carrier: string, direction: string, amount: number) {
  return direction === "credit_owed_to_us"
    ? `${carrier} owes Gusto ${formatCurrency(amount)} on a future bill.`
    : `Gusto owes ${carrier} ${formatCurrency(amount)} on a future bill.`;
}

interface OpenAdjustmentRow {
  id: number;
  companyName: string;
  memberName: string;
  carrier: string;
  lineOfCoverage: string;
  amount: string;
  direction: string;
  status: string;
  invoiceDate: string | null;
  locked: boolean;
}

export default function ExpectedAdjustments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editTarget, setEditTarget] = useState<OpenAdjustmentRow | null>(null);

  const { data, isLoading } = useQuery<{ adjustments: OpenAdjustmentRow[] }>({
    queryKey: ["/api/expected-adjustments"],
    queryFn: async () => (await fetch("/api/expected-adjustments")).json(),
  });

  const editMutation = useMutation({
    mutationFn: async (params: { id: number; amount: string; direction: "credit_owed_to_us" | "debit_owed_to_carrier"; status: "pending" | "received" }) => {
      const res = await apiRequest("POST", `/api/expected-adjustments/${params.id}`, {
        amount: params.amount,
        direction: params.direction,
        status: params.status,
      });
      return res.json();
    },
    onSuccess: () => {
      setEditTarget(null);
      queryClient.invalidateQueries({ queryKey: ["/api/expected-adjustments"] });
      toast({ title: "Adjustment updated" });
    },
    onError: (err) => toast({ title: "Couldn't update adjustment", description: extractErrorMessage(err), variant: "destructive" }),
  });

  const adjustments = data?.adjustments || [];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <Header activePage="expected-adjustments" />

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <FileWarning className="h-5 w-5 text-[#0a8080]" />
            <span className="text-sm font-medium text-[#0a8080] uppercase tracking-wider">Bill Reconciliation</span>
          </div>
          <h2 className="text-3xl font-sans font-bold text-slate-800 tracking-tight">Expected Adjustments</h2>
          <p className="text-muted-foreground mt-1">Every open carrier billing correction across all carriers and coverage periods.</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#0a8080]" />
          </div>
        ) : adjustments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center rounded-md border bg-white shadow-sm">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <p className="font-medium text-slate-700">No open adjustments</p>
            <p className="text-sm text-muted-foreground">Every expected carrier correction has been received.</p>
          </div>
        ) : (
          <div className="rounded-md border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-600">Customer</TableHead>
                  <TableHead className="font-semibold text-slate-600">Member</TableHead>
                  <TableHead className="font-semibold text-slate-600">Carrier</TableHead>
                  <TableHead className="font-semibold text-slate-600">Coverage</TableHead>
                  <TableHead className="font-semibold text-slate-600">Invoice Date</TableHead>
                  <TableHead className="font-semibold text-slate-600">Amount</TableHead>
                  <TableHead className="font-semibold text-slate-600">Direction</TableHead>
                  <TableHead className="font-semibold text-slate-600 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((a) => (
                  <TableRow key={a.id} data-testid={`row-open-adjustment-${a.id}`}>
                    <TableCell className="text-sm text-slate-600">{a.companyName}</TableCell>
                    <TableCell className="font-medium text-slate-800">{a.memberName}</TableCell>
                    <TableCell>
                      <span className={`text-[10px] h-5 px-1.5 inline-flex items-center rounded border font-normal ${a.carrier === "Aetna" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200"}`}>
                        {a.carrier}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{a.lineOfCoverage}</TableCell>
                    <TableCell className="text-sm">
                      {a.invoiceDate ? (
                        <Link
                          href={`/bill-reconciliation?carrier=${encodeURIComponent(a.carrier)}&period=${encodeURIComponent(a.invoiceDate)}`}
                          className="text-[#0a8080] hover:underline"
                          data-testid={`link-invoice-date-${a.id}`}
                        >
                          {format(new Date(a.invoiceDate + "T00:00:00"), "MMM yyyy")}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(parseFloat(a.amount))}</TableCell>
                    <TableCell className="text-sm">
                      {directionText(a.carrier, a.direction, parseFloat(a.amount))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={a.locked}
                        title={a.locked ? "Locked — bill already paid" : undefined}
                        onClick={() => setEditTarget(a)}
                        data-testid={`button-edit-open-adjustment-${a.id}`}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      <EditAdjustmentDialog
        adjustment={editTarget as EditableAdjustment | null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        onSubmit={({ amount, direction, status }) => {
          if (!editTarget) return;
          editMutation.mutate({ id: editTarget.id, amount, direction, status });
        }}
        isSubmitting={editMutation.isPending}
      />
    </div>
  );
}

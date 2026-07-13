import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface EditableAdjustment {
  id: number;
  memberName: string;
  carrier: string;
  lineOfCoverage: string;
  amount: string;
  direction: string;
  status: string;
}

interface EditAdjustmentDialogProps {
  adjustment: EditableAdjustment | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (params: { amount: string; direction: "credit_owed_to_us" | "debit_owed_to_carrier"; status: "pending" | "received" }) => void;
  isSubmitting: boolean;
}

export function EditAdjustmentDialog({ adjustment, onOpenChange, onSubmit, isSubmitting }: EditAdjustmentDialogProps) {
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"credit_owed_to_us" | "debit_owed_to_carrier">("credit_owed_to_us");
  const [status, setStatus] = useState<"pending" | "received">("pending");

  useEffect(() => {
    if (adjustment) {
      setAmount(adjustment.amount);
      setDirection(adjustment.direction as "credit_owed_to_us" | "debit_owed_to_carrier");
      setStatus(adjustment.status as "pending" | "received");
    }
  }, [adjustment]);

  if (!adjustment) return null;

  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount >= 0;

  return (
    <Dialog open={!!adjustment} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-testid="dialog-edit-adjustment">
        <DialogHeader>
          <DialogTitle>Edit Expected Adjustment — {adjustment.memberName}</DialogTitle>
          <DialogDescription>
            {adjustment.carrier} · {adjustment.lineOfCoverage}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="adjustment-amount">Amount</Label>
            <Input
              id="adjustment-amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              data-testid="input-adjustment-amount"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Direction</Label>
            <RadioGroup value={direction} onValueChange={(v) => setDirection(v as "credit_owed_to_us" | "debit_owed_to_carrier")}>
              <div className="flex items-center gap-3 rounded-md border border-slate-200 p-3">
                <RadioGroupItem value="credit_owed_to_us" id="direction-credit" />
                <Label htmlFor="direction-credit" className="cursor-pointer font-normal">{adjustment.carrier} owes Gusto</Label>
              </div>
              <div className="flex items-center gap-3 rounded-md border border-slate-200 p-3">
                <RadioGroupItem value="debit_owed_to_carrier" id="direction-debit" />
                <Label htmlFor="direction-debit" className="cursor-pointer font-normal">Gusto owes {adjustment.carrier}</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <RadioGroup value={status} onValueChange={(v) => setStatus(v as "pending" | "received")}>
              <div className="flex items-center gap-3 rounded-md border border-slate-200 p-3">
                <RadioGroupItem value="pending" id="status-pending" />
                <Label htmlFor="status-pending" className="cursor-pointer font-normal">Pending</Label>
              </div>
              <div className="flex items-center gap-3 rounded-md border border-slate-200 p-3">
                <RadioGroupItem value="received" id="status-received" />
                <Label htmlFor="status-received" className="cursor-pointer font-normal">Received</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-edit-adjustment">
            Cancel
          </Button>
          <Button
            className="bg-[#0a8080] hover:bg-[#086a6a]"
            disabled={!isValidAmount || isSubmitting}
            onClick={() => onSubmit({ amount: parsedAmount.toFixed(2), direction, status })}
            data-testid="button-submit-edit-adjustment"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

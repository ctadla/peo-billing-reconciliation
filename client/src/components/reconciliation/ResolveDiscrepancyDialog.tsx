import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

export interface ResolvableDiscrepancy {
  id: number;
  memberName: string;
  carrier: string;
  lineOfCoverage: string;
  discrepancyType: string;
  expectedPremium: string | null;
  billedPremium: string;
}

interface ResolveDiscrepancyDialogProps {
  discrepancy: ResolvableDiscrepancy | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (params: { faultParty: "gusto" | "carrier"; resolutionNotes: string }) => void;
  isSubmitting: boolean;
}

export function ResolveDiscrepancyDialog({ discrepancy, onOpenChange, onSubmit, isSubmitting }: ResolveDiscrepancyDialogProps) {
  const [faultParty, setFaultParty] = useState<"gusto" | "carrier">("gusto");
  const [notes, setNotes] = useState("");

  if (!discrepancy) return null;

  const expected = discrepancy.expectedPremium ? parseFloat(discrepancy.expectedPremium) : 0;
  const billed = parseFloat(discrepancy.billedPremium);
  const delta = billed - expected;
  const direction = delta > 0 ? "credit_owed_to_us" : "debit_owed_to_carrier";

  const handleClose = (next: boolean) => {
    if (!next) {
      setFaultParty("gusto");
      setNotes("");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={!!discrepancy} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" data-testid="dialog-resolve-discrepancy">
        <DialogHeader>
          <DialogTitle>Resolve Discrepancy — {discrepancy.memberName}</DialogTitle>
          <DialogDescription>
            {discrepancy.carrier} · {discrepancy.lineOfCoverage} · Expected {discrepancy.expectedPremium ? formatCurrency(expected) : "not on file"}, carrier billed {formatCurrency(billed)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={faultParty} onValueChange={(v) => setFaultParty(v as "gusto" | "carrier")}>
            <div className="flex items-start gap-3 rounded-md border border-slate-200 p-3">
              <RadioGroupItem value="gusto" id="fault-gusto" className="mt-0.5" />
              <Label htmlFor="fault-gusto" className="cursor-pointer">
                <span className="font-medium text-slate-800">Gusto error</span>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Active Benefits has been corrected. Next month's retro adjustment will true this up — no adjustment record needed.
                </p>
              </Label>
            </div>
            <div className="flex items-start gap-3 rounded-md border border-slate-200 p-3">
              <RadioGroupItem value="carrier" id="fault-carrier" className="mt-0.5" />
              <Label htmlFor="fault-carrier" className="cursor-pointer">
                <span className="font-medium text-slate-800">Carrier error</span>
                <p className="text-sm text-muted-foreground mt-0.5">
                  The carrier billed us incorrectly. We'll still pay this bill and log an expected adjustment for the carrier's next invoice.
                </p>
              </Label>
            </div>
          </RadioGroup>

          {faultParty === "carrier" && (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900" data-testid="text-adjustment-preview">
              Expected adjustment: <span className="font-semibold">{formatCurrency(Math.abs(delta))}</span>{" "}
              <Badge variant="outline" className="ml-1 bg-white">
                {direction === "credit_owed_to_us" ? "credit owed to us" : "debit owed to carrier"}
              </Badge>{" "}
              on a future bill.
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="resolution-notes">Resolution notes</Label>
            <Textarea
              id="resolution-notes"
              placeholder="What happened, and what action was taken?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              data-testid="input-resolution-notes"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} data-testid="button-cancel-resolve">
            Cancel
          </Button>
          <Button
            className="bg-[#0a8080] hover:bg-[#086a6a]"
            disabled={isSubmitting}
            onClick={() => onSubmit({ faultParty, resolutionNotes: notes })}
            data-testid="button-submit-resolve"
          >
            {isSubmitting ? "Saving..." : "Mark Resolved"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

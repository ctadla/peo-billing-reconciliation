import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Sparkles } from "lucide-react";

interface ParsedLineItem {
  memberName: string;
  carrier: string;
  lineOfCoverage: string;
  plan?: string;
  tier?: string;
  billedPremium: string;
}

interface RosterMemberLike {
  memberName: string;
  carrier: string;
  lineOfCoverage: string;
  plan: string;
  tier: string;
  monthlyPremium: string;
}

interface UploadBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roster: RosterMemberLike[];
  onSubmit: (lineItems: ParsedLineItem[]) => void;
  isSubmitting: boolean;
}

function parseCsv(text: string): ParsedLineItem[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const colIndex = (names: string[]) => names.map((n) => header.indexOf(n)).find((i) => i >= 0) ?? -1;

  const nameIdx = colIndex(["membername", "member name", "member"]);
  const carrierIdx = colIndex(["carrier"]);
  const coverageIdx = colIndex(["lineofcoverage", "line of coverage", "coverage"]);
  const planIdx = colIndex(["plan"]);
  const tierIdx = colIndex(["tier"]);
  const premiumIdx = colIndex(["billedpremium", "billed premium", "premium"]);

  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    return {
      memberName: cells[nameIdx] ?? "",
      carrier: cells[carrierIdx] ?? "",
      lineOfCoverage: cells[coverageIdx] ?? "",
      plan: planIdx >= 0 ? cells[planIdx] : undefined,
      tier: tierIdx >= 0 ? cells[tierIdx] : undefined,
      billedPremium: cells[premiumIdx] ?? "0",
    };
  });
}

function buildSampleBill(roster: RosterMemberLike[]): ParsedLineItem[] {
  const items: ParsedLineItem[] = roster.map((m) => ({
    memberName: m.memberName,
    carrier: m.carrier,
    lineOfCoverage: m.lineOfCoverage,
    plan: m.plan,
    tier: m.tier,
    billedPremium: m.monthlyPremium,
  }));

  if (items.length > 0) {
    items[0] = { ...items[0], billedPremium: (parseFloat(items[0].billedPremium) + 150).toFixed(2) };
  }
  if (items.length > 1) {
    items[1] = { ...items[1], billedPremium: (parseFloat(items[1].billedPremium) - 50).toFixed(2) };
  }

  items.push({
    memberName: "Grace Hopper",
    carrier: roster[0]?.carrier || "Aetna",
    lineOfCoverage: roster[0]?.lineOfCoverage || "Medical",
    plan: "Unknown",
    tier: "Employee Only",
    billedPremium: "610.00",
  });

  return items;
}

export function UploadBillDialog({ open, onOpenChange, roster, onSubmit, isSubmitting }: UploadBillDialogProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedLineItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length === 0) {
      setError("Couldn't find any rows in that file. Expected columns: memberName, carrier, lineOfCoverage, billedPremium.");
      setParsedItems([]);
      setFileName(null);
      return;
    }
    setFileName(file.name);
    setParsedItems(rows);
  };

  const handleLoadSample = () => {
    setError(null);
    setFileName("sample-carrier-bill.csv (generated)");
    setParsedItems(buildSampleBill(roster));
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      setFileName(null);
      setParsedItems([]);
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" data-testid="dialog-upload-bill">
        <DialogHeader>
          <DialogTitle>Upload Carrier Bill</DialogTitle>
          <DialogDescription>
            Upload a carrier bill CSV to check it against Active Benefits. We'll flag any member whose billed
            premium doesn't tie out.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            data-testid="dropzone-upload-bill"
          >
            <Upload className="h-6 w-6 text-slate-400" />
            <p className="text-sm text-slate-600">
              <span className="font-medium text-[#0a8080]">Click to choose a CSV</span> or drag it here
            </p>
            <p className="text-xs text-muted-foreground">Columns: memberName, carrier, lineOfCoverage, plan, tier, billedPremium</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
              data-testid="input-bill-file"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={handleLoadSample}
            disabled={roster.length === 0}
            data-testid="button-load-sample-bill"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#0a8080]" />
            Load a sample carrier bill with a few discrepancies
          </Button>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          {fileName && parsedItems.length > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
              <FileText className="h-4 w-4 text-slate-500" />
              <span className="font-medium text-slate-700">{fileName}</span>
              <span className="text-muted-foreground">— {parsedItems.length} line items parsed</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} data-testid="button-cancel-upload">
            Cancel
          </Button>
          <Button
            className="bg-[#0a8080] hover:bg-[#086a6a]"
            disabled={parsedItems.length === 0 || isSubmitting}
            onClick={() => onSubmit(parsedItems)}
            data-testid="button-submit-upload"
          >
            {isSubmitting ? "Checking..." : "Upload & Check for Discrepancies"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

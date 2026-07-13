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
import { Upload, FileText } from "lucide-react";

interface UploadReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (receiptFileName: string) => void;
  isSubmitting: boolean;
}

export function UploadReceiptDialog({ open, onOpenChange, onSubmit, isSubmitting }: UploadReceiptDialogProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" data-testid="dialog-upload-receipt">
        <DialogHeader>
          <DialogTitle>Upload Receipt of Payment</DialogTitle>
          <DialogDescription>
            Attach proof that this carrier bill was paid — a confirmation email, bank receipt, or payment screenshot.
          </DialogDescription>
        </DialogHeader>

        <div
          className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center cursor-pointer hover:bg-slate-100 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          data-testid="dropzone-upload-receipt"
        >
          <Upload className="h-6 w-6 text-slate-400" />
          <p className="text-sm text-slate-600">
            <span className="font-medium text-[#0a8080]">Click to choose a file</span> or drag it here
          </p>
          <p className="text-xs text-muted-foreground">PDF, image, or screenshot of the payment confirmation</p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            data-testid="input-receipt-file"
          />
        </div>

        {fileName && (
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
            <FileText className="h-4 w-4 text-slate-500" />
            <span className="font-medium text-slate-700">{fileName}</span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} data-testid="button-cancel-upload-receipt">
            Cancel
          </Button>
          <Button
            className="bg-[#0a8080] hover:bg-[#086a6a]"
            disabled={!fileName || isSubmitting}
            onClick={() => fileName && onSubmit(fileName)}
            data-testid="button-submit-upload-receipt"
          >
            {isSubmitting ? "Marking Complete..." : "Mark as Complete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

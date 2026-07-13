import { Loader2 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface DevModeToggleProps {
  mode: "awaiting" | "ingested";
  onModeChange: (mode: "awaiting" | "ingested") => void;
  isBusy?: boolean;
}

export function DevModeToggle({ mode, onModeChange, isBusy }: DevModeToggleProps) {
  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 backdrop-blur px-2 py-1.5 shadow-lg"
      data-testid="dev-mode-toggle"
    >
      <span className="pl-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Dev</span>
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(v) => v && !isBusy && onModeChange(v as "awaiting" | "ingested")}
        className="gap-0.5"
      >
        <ToggleGroupItem
          value="awaiting"
          disabled={isBusy}
          className="h-7 rounded-full px-3 text-xs data-[state=on]:bg-slate-800 data-[state=on]:text-white"
          data-testid="dev-toggle-awaiting"
        >
          Awaiting Bill
        </ToggleGroupItem>
        <ToggleGroupItem
          value="ingested"
          disabled={isBusy}
          className="h-7 rounded-full px-3 text-xs data-[state=on]:bg-[#0a8080] data-[state=on]:text-white"
          data-testid="dev-toggle-ingested"
        >
          Bill Ingested
        </ToggleGroupItem>
      </ToggleGroup>
      {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400 mr-1" />}
    </div>
  );
}

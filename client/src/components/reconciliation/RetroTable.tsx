import { useState, Fragment } from "react";
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
import { Download, ChevronRight, ChevronDown } from "lucide-react";

interface RetroAdjustment {
  id: string;
  worksite: string;
  name: string;
  eventType: string;
  originalPeriod: string;
  effectiveDate: string;
  amount: number;
  reason: string;
  processedAt: string;
  carrier?: string;
  lineOfCoverage?: string;
  plan?: string;
  tier?: string;
}

interface RetroTableProps {
  data: RetroAdjustment[];
  showWorksite?: boolean;
}

interface RetroGroup {
  key: string;
  name: string;
  worksite: string;
  eventType: string;
  originalPeriod: string;
  effectiveDate: string;
  totalAmount: number;
  lines: RetroAdjustment[];
}

export function RetroTable({ data, showWorksite = true }: RetroTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const grouped: RetroGroup[] = [];
  const groupMap = new Map<string, RetroGroup>();
  for (const item of data) {
    const key = `${item.name}-${item.eventType}-${item.effectiveDate}`;
    let group = groupMap.get(key);
    if (!group) {
      group = {
        key,
        name: item.name,
        worksite: item.worksite,
        eventType: item.eventType,
        originalPeriod: item.originalPeriod,
        effectiveDate: item.effectiveDate,
        totalAmount: 0,
        lines: [],
      };
      groupMap.set(key, group);
      grouped.push(group);
    }
    group.totalAmount += item.amount;
    group.lines.push(item);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif font-bold text-slate-800">Retro Adjustments Included</h3>
        <Button variant="outline" size="sm" className="h-8 gap-2" data-testid="button-export-retro">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead className="font-semibold text-slate-600">Member Name</TableHead>
              {showWorksite && <TableHead className="font-semibold text-slate-600">Worksite</TableHead>}
              <TableHead className="font-semibold text-slate-600">Event Type</TableHead>
              <TableHead className="font-semibold text-slate-600">Invoice Impacted</TableHead>
              <TableHead className="font-semibold text-slate-600">Effective</TableHead>
              <TableHead className="font-semibold text-slate-600 text-right">Adjustment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grouped.map((group) => {
              const isExpanded = expandedRows.has(group.key);
              const hasMultipleLines = group.lines.length > 1;
              return (
                <Fragment key={group.key}>
                  <TableRow
                    className={`hover:bg-slate-100 ${hasMultipleLines ? "cursor-pointer" : ""}`}
                    onClick={() => hasMultipleLines && toggleRow(group.key)}
                  >
                    <TableCell className="w-8 pr-0">
                      {hasMultipleLines && (
                        isExpanded
                          ? <ChevronDown className="h-4 w-4 text-slate-400" />
                          : <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-[#3A7D73] hover:underline cursor-pointer">
                        {group.name}
                      </span>
                    </TableCell>
                    {showWorksite && <TableCell className="font-medium text-slate-600">{group.worksite}</TableCell>}
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-normal">
                        {group.eventType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{group.originalPeriod}</TableCell>
                    <TableCell>{group.effectiveDate}</TableCell>
                    <TableCell className={`text-right font-medium ${group.totalAmount < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {group.totalAmount > 0 ? "+" : ""}{formatCurrency(group.totalAmount)}
                    </TableCell>
                  </TableRow>
                  {isExpanded && group.lines.map((line) => (
                    <TableRow key={line.id} className="bg-white/60">
                      <TableCell></TableCell>
                      <TableCell className="pl-8">
                        <Badge variant="outline" className={`text-[10px] h-5 px-1.5 font-normal ${line.carrier === "Aetna" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200"}`}>
                          {line.carrier}
                        </Badge>
                        <span className="ml-2 text-sm text-slate-600">{line.lineOfCoverage}</span>
                        <span className="ml-2 text-xs text-slate-400">{line.plan} · {line.tier}</span>
                      </TableCell>
                      {showWorksite && <TableCell></TableCell>}
                      <TableCell></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{line.originalPeriod}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{line.effectiveDate}</TableCell>
                      <TableCell className={`text-right font-medium ${line.amount < 0 ? "text-rose-500" : "text-emerald-500"}`}>
                        {line.amount > 0 ? "+" : ""}{formatCurrency(line.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              );
            })}
            {grouped.length === 0 && (
              <TableRow>
                <TableCell colSpan={showWorksite ? 7 : 6} className="text-center py-8 text-muted-foreground">
                  No retro adjustments for this period.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

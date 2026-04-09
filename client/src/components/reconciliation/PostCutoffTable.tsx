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
import { Download, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";

interface PostCutoffChange {
  id: string;
  worksite: string;
  name: string;
  eventType: string;
  effectiveDate: string;
  expectedPremium: number;
  expectedMonth: string;
  carrier?: string;
  lineOfCoverage?: string;
  plan?: string;
  tier?: string;
  processedAt: string;
}

interface GroupedMember {
  key: string;
  name: string;
  worksite: string;
  eventType: string;
  effectiveDate: string;
  expectedMonth: string;
  totalPremium: number;
  lines: PostCutoffChange[];
}

interface PostCutoffTableProps {
  data: PostCutoffChange[];
  showWorksite?: boolean;
}

function groupByMember(data: PostCutoffChange[]): GroupedMember[] {
  const groups: Record<string, GroupedMember> = {};
  for (const item of data) {
    const key = `${item.name}-${item.eventType}-${item.effectiveDate}`;
    if (!groups[key]) {
      groups[key] = {
        key,
        name: item.name,
        worksite: item.worksite,
        eventType: item.eventType,
        effectiveDate: item.effectiveDate,
        expectedMonth: item.expectedMonth,
        totalPremium: 0,
        lines: [],
      };
    }
    groups[key].totalPremium += item.expectedPremium;
    groups[key].lines.push(item);
  }
  return Object.values(groups);
}

export function PostCutoffTable({ data, showWorksite = true }: PostCutoffTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const toggleRow = (key: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const grouped = groupByMember(data);
  const colCount = showWorksite ? 6 : 5;

  return (
    <div className="space-y-4 border-t border-slate-200 pt-8 mt-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-serif font-bold text-slate-800">Post-Cutoff Changes</h3>
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 shadow-none font-normal gap-1">
              <AlertTriangle className="h-3 w-3" /> Not Billed Yet
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Changes processed after the invoice cutoff. These will be reflected in the next billing cycle.
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      <div className="rounded-md border bg-slate-50/50 border-slate-200 shadow-sm overflow-hidden opacity-90">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-8"></TableHead>
              <TableHead className="font-semibold text-slate-500">Member</TableHead>
              {showWorksite && <TableHead className="font-semibold text-slate-500">Worksite</TableHead>}
              <TableHead className="font-semibold text-slate-500">Event Type</TableHead>
              <TableHead className="font-semibold text-slate-500">Effective Date</TableHead>
              <TableHead className="font-semibold text-slate-500">Expected Impact</TableHead>
              <TableHead className="font-semibold text-slate-500 text-right">Est. Premium</TableHead>
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
                      <span className="font-semibold text-slate-700">{group.name}</span>
                    </TableCell>
                    {showWorksite && <TableCell className="font-medium text-slate-600">{group.worksite}</TableCell>}
                    <TableCell>
                      <Badge variant="outline" className="bg-white text-slate-600 border-slate-200 font-normal">
                        {group.eventType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">{group.effectiveDate}</TableCell>
                    <TableCell className="text-slate-600">{group.expectedMonth}</TableCell>
                    <TableCell className="text-right font-medium text-slate-600">
                      {formatCurrency(group.totalPremium)}
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
                      <TableCell className="text-sm text-muted-foreground">{line.effectiveDate}</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right font-medium text-slate-500">
                        {formatCurrency(line.expectedPremium)}
                      </TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

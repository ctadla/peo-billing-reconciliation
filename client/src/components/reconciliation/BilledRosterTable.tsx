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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Filter } from "lucide-react";
import { useState } from "react";

interface Member {
  id: string;
  worksite: string;
  name: string;
  employeeId: string;
  carrier: string;
  lineOfCoverage: string;
  plan: string;
  tier: string;
  effectiveDate: string;
  termDate?: string;
  monthlyPremium: number;
  employeeCost: number;
  dependentCost: number;
  flags?: string[];
}

interface BilledRosterProps {
  data: Member[];
  onMemberClick: (member: Member) => void;
}

export function BilledRosterTable({ data, onMemberClick }: BilledRosterProps) {
  const [coverageFilter, setCoverageFilter] = useState<string>("all");

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const filteredData = coverageFilter === "all"
    ? data
    : data.filter(m => m.lineOfCoverage === coverageFilter);

  const coverageTypes = Array.from(new Set(data.map(m => m.lineOfCoverage))).sort();

  let lastMemberKey = "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-serif font-bold text-slate-800">Billed Roster</h3>
          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
            {filteredData.length} Line Items
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select value={coverageFilter} onValueChange={setCoverageFilter}>
            <SelectTrigger className="w-[200px] h-8 bg-white border-slate-200 text-sm" data-testid="filter-coverage">
              <Filter className="h-3.5 w-3.5 mr-2 text-slate-500" />
              <SelectValue placeholder="All Lines of Coverage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lines of Coverage</SelectItem>
              {coverageTypes.map(ct => (
                <SelectItem key={ct} value={ct} data-testid={`filter-coverage-${ct}`}>{ct}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 gap-2" data-testid="export-roster-csv">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-600">Worksite</TableHead>
              <TableHead className="font-semibold text-slate-600">Member Name</TableHead>
              <TableHead className="font-semibold text-slate-600">Carrier</TableHead>
              <TableHead className="font-semibold text-slate-600">Line of Coverage</TableHead>
              <TableHead className="font-semibold text-slate-600">Plan</TableHead>
              <TableHead className="font-semibold text-slate-600">Tier</TableHead>
              <TableHead className="font-semibold text-slate-600">Effective</TableHead>
              <TableHead className="font-semibold text-slate-600">Premium</TableHead>
              <TableHead className="font-semibold text-slate-600">Employee Cost</TableHead>
              <TableHead className="font-semibold text-slate-600">Dependent Cost</TableHead>
              <TableHead className="font-semibold text-slate-600 text-right">Flags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((member) => {
              const memberKey = `${member.worksite}-${member.name}`;
              const isNewMember = memberKey !== lastMemberKey;
              lastMemberKey = memberKey;
              return (
                <TableRow 
                  key={member.id} 
                  className={`hover:bg-slate-50 cursor-pointer transition-colors ${isNewMember ? "border-t-2 border-slate-200" : ""}`}
                  onClick={() => onMemberClick(member)}
                >
                  <TableCell className="font-medium text-slate-700">{isNewMember ? member.worksite : ""}</TableCell>
                  <TableCell>
                    {isNewMember ? (
                      <span className="font-semibold text-[#3A7D73] hover:underline">{member.name}</span>
                    ) : (
                      <span className="text-transparent select-none">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] h-5 px-1.5 font-normal ${member.carrier === "Aetna" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200"}`}>
                      {member.carrier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{member.lineOfCoverage}</TableCell>
                  <TableCell>{member.plan}</TableCell>
                  <TableCell>{member.tier}</TableCell>
                  <TableCell>{member.effectiveDate}</TableCell>
                  <TableCell>{formatCurrency(member.monthlyPremium)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatCurrency(member.employeeCost)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatCurrency(member.dependentCost)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {member.flags?.map(flag => (
                        <Badge key={flag} variant="secondary" className="text-[10px] h-5 px-1.5 bg-amber-50 text-amber-700 border-amber-200">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

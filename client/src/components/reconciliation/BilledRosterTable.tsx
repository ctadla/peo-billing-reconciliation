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
import { Download, Filter } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface Member {
  id: string;
  worksite: string;
  name: string;
  employeeId: string;
  plan: string;
  tier: string;
  effectiveDate: string;
  termDate?: string;
  monthlyPremium: number;
  employerShare: number;
  employeeShare: number;
  flags?: string[];
}

interface BilledRosterProps {
  data: Member[];
  onMemberClick: (member: Member) => void;
}

export function BilledRosterTable({ data, onMemberClick }: BilledRosterProps) {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-serif font-bold text-slate-800">Billed Roster</h3>
          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
            {data.length} Members
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-2">
            <Filter className="h-3.5 w-3.5" /> Filter
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-2">
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
              <TableHead className="font-semibold text-slate-600">ID</TableHead>
              <TableHead className="font-semibold text-slate-600">Plan</TableHead>
              <TableHead className="font-semibold text-slate-600">Tier</TableHead>
              <TableHead className="font-semibold text-slate-600">Effective</TableHead>
              <TableHead className="font-semibold text-slate-600">Premium</TableHead>
              <TableHead className="font-semibold text-slate-600">ER Share</TableHead>
              <TableHead className="font-semibold text-slate-600">EE Share</TableHead>
              <TableHead className="font-semibold text-slate-600 text-right">Flags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((member) => (
              <TableRow 
                key={member.id} 
                className="hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => onMemberClick(member)}
              >
                <TableCell className="font-medium text-slate-700">{member.worksite}</TableCell>
                <TableCell>
                  <span className="font-semibold text-[#3A7D73] hover:underline">
                    {member.name}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">{member.employeeId}</TableCell>
                <TableCell>{member.plan}</TableCell>
                <TableCell>{member.tier}</TableCell>
                <TableCell>{member.effectiveDate}</TableCell>
                <TableCell>{formatCurrency(member.monthlyPremium)}</TableCell>
                <TableCell className="text-muted-foreground">{formatCurrency(member.employerShare)}</TableCell>
                <TableCell className="text-muted-foreground">{formatCurrency(member.employeeShare)}</TableCell>
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

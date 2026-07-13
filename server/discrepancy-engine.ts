import type { BilledRosterMember, CarrierBillLineItem } from "@shared/schema";

export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export interface DetectedDiscrepancy {
  billLineItemId: number;
  rosterMemberId: number | null;
  memberName: string;
  carrier: string;
  lineOfCoverage: string;
  discrepancyType: "premium_mismatch" | "unmatched_member";
  expectedPremium: string | null;
  billedPremium: string;
  deltaAmount: string | null;
}

/**
 * Compares carrier bill line items against the roster (Active Benefits snapshot)
 * for the same invoice and returns one discrepancy per line item that doesn't
 * tie out. Line items that match cleanly are omitted.
 */
export function detectDiscrepancies(
  roster: BilledRosterMember[],
  billLineItems: CarrierBillLineItem[]
): DetectedDiscrepancy[] {
  const byCompositeKey = new Map<string, BilledRosterMember>();
  const namesInRoster = new Set<string>();

  for (const member of roster) {
    const nameNorm = normalizeName(member.memberName);
    namesInRoster.add(nameNorm);
    byCompositeKey.set(`${nameNorm}|${member.carrier}|${member.lineOfCoverage}`, member);
  }

  const results: DetectedDiscrepancy[] = [];

  for (const item of billLineItems) {
    const nameNorm = normalizeName(item.memberNameRaw);
    const rosterMatch = byCompositeKey.get(`${nameNorm}|${item.carrier}|${item.lineOfCoverage}`);

    if (rosterMatch) {
      const expected = parseFloat(rosterMatch.monthlyPremium);
      const billed = parseFloat(item.billedPremium);
      if (Math.abs(expected - billed) >= 0.01) {
        results.push({
          billLineItemId: item.id,
          rosterMemberId: rosterMatch.id,
          memberName: rosterMatch.memberName,
          carrier: item.carrier,
          lineOfCoverage: item.lineOfCoverage,
          discrepancyType: "premium_mismatch",
          expectedPremium: rosterMatch.monthlyPremium,
          billedPremium: item.billedPremium,
          deltaAmount: (billed - expected).toFixed(2),
        });
      }
      continue;
    }

    if (namesInRoster.has(nameNorm)) {
      // Member exists on the roster, but not for this carrier/coverage line -
      // treat what we have on file as $0 so the carrier's amount is the full delta.
      results.push({
        billLineItemId: item.id,
        rosterMemberId: null,
        memberName: item.memberNameRaw,
        carrier: item.carrier,
        lineOfCoverage: item.lineOfCoverage,
        discrepancyType: "premium_mismatch",
        expectedPremium: null,
        billedPremium: item.billedPremium,
        deltaAmount: item.billedPremium,
      });
      continue;
    }

    results.push({
      billLineItemId: item.id,
      rosterMemberId: null,
      memberName: item.memberNameRaw,
      carrier: item.carrier,
      lineOfCoverage: item.lineOfCoverage,
      discrepancyType: "unmatched_member",
      expectedPremium: null,
      billedPremium: item.billedPremium,
      deltaAmount: null,
    });
  }

  return results;
}

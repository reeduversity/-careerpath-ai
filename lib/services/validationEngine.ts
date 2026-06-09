import { ResolvedConstraints } from './domainResolver';

export interface Candidate {
  id?: string;
  name: string;
  domain: string;
  requiredExam?: string;
  requiredStream?: string;
  feesINR?: number;
  feesUSD?: number;
  country: string;
  metadata?: any;
}

export interface ValidationResult {
  candidate: Candidate;
  passed: boolean;
  blockReason?: string;
  matchScore: number;
  eligibilityScore: number;
}

export function validateCandidates(candidates: Candidate[], constraints: ResolvedConstraints): ValidationResult[] {
  return candidates.map(candidate => {
    let passed = true;
    let blockReason = "";
    let matchScore = 100;
    let eligibilityScore = 100;

    // 1. Mandatory Metadata Check
    if (!candidate.domain || !candidate.country) {
      passed = false;
      blockReason = "Missing mandatory metadata (domain/country)";
      eligibilityScore = 0;
    }

    // Parse fees safely
    let feesINR = typeof candidate.feesINR === 'string' ? parseInt((candidate.feesINR as string).replace(/[^0-9]/g, '')) : candidate.feesINR;
    let feesUSD = typeof candidate.feesUSD === 'string' ? parseInt((candidate.feesUSD as string).replace(/[^0-9]/g, '')) : candidate.feesUSD;
    if (isNaN(feesINR as number)) feesINR = 0;
    if (isNaN(feesUSD as number)) feesUSD = 0;

    // 2. Strict Domain/Blocklist Check
    if (passed && constraints.strictlyBlockedDomains.includes(candidate.domain)) {
      passed = false;
      blockReason = `Domain ${candidate.domain} is strictly blocked for this profile`;
      eligibilityScore = 0;
    }

    // 3. Exam Validation
    if (passed && candidate.requiredExam && candidate.requiredExam !== "None") {
      // If the candidate strictly requires an exam the user doesn't have
      if (constraints.allowedExams.length > 0 && !constraints.allowedExams.includes(candidate.requiredExam)) {
        passed = false;
        blockReason = `Requires ${candidate.requiredExam} which the user has not taken or is ineligible for`;
        eligibilityScore -= 50;
      }
    }

    // 4. Budget Validation
    if (passed) {
      if (candidate.country === "India") {
        if (feesINR && feesINR > constraints.budgetLimitINR) {
          passed = false;
          blockReason = `Exceeds INR budget limit (${feesINR} > ${constraints.budgetLimitINR})`;
          matchScore -= 50;
        }
      } else {
        if (feesUSD && feesUSD > constraints.budgetLimitUSD) {
          passed = false;
          blockReason = `Exceeds USD budget limit (${feesUSD} > ${constraints.budgetLimitUSD})`;
          matchScore -= 50;
        }
      }
    }

    // 5. Country Validation
    if (passed && !constraints.allowedCountries.includes(candidate.country)) {
      passed = false;
      blockReason = `Country ${candidate.country} does not match preferences or budget`;
      matchScore -= 30;
    }

    if (!passed) {
      console.log(`[Validation Blocked] ${candidate.name} - ${blockReason}`);
    }

    return {
      candidate,
      passed,
      blockReason,
      matchScore,
      eligibilityScore
    };
  });
}

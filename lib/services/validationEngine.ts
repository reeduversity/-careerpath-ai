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
  officialWebsite?: string;
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
    let strINR = typeof candidate.feesINR === 'string' ? (candidate.feesINR as string).toLowerCase() : "";
    let strUSD = typeof candidate.feesUSD === 'string' ? (candidate.feesUSD as string).toLowerCase() : "";
    let feesINR = typeof candidate.feesINR === 'string' ? parseFloat(strINR.replace(/[^0-9.]/g, '')) : candidate.feesINR;
    let feesUSD = typeof candidate.feesUSD === 'string' ? parseFloat(strUSD.replace(/[^0-9.]/g, '')) : candidate.feesUSD;
    if (isNaN(feesINR as number)) feesINR = 0;
    if (isNaN(feesUSD as number)) feesUSD = 0;

    // Normalizer: Convert decimal Lakhs (e.g. 1.2, 15, 120 Lakhs) or decimal USD to full integers
    if (feesINR && feesINR < 1000 && (strINR.includes("lakh") || strINR.includes("lac") || feesINR < 100)) feesINR = Math.round(feesINR * 100000);
    if (feesUSD && feesUSD < 1000 && (strUSD.includes("k") || feesUSD < 100)) feesUSD = Math.round(feesUSD * 1000);

    candidate.feesINR = feesINR;
    candidate.feesUSD = feesUSD;

    // 2. Strict Domain/Blocklist Check
    if (passed && constraints.strictlyBlockedDomains.includes(candidate.domain)) {
      passed = false;
      blockReason = `Domain ${candidate.domain} is strictly blocked for this profile`;
      eligibilityScore = 0;
    }

    // 3. Exam Validation
    if (passed && candidate.requiredExam && candidate.requiredExam !== "None") {
      // If user has NO exams (allowedExams is only ["None"]), block any college requiring a real exam
      const userHasNoExams = constraints.allowedExams.length === 1 && constraints.allowedExams[0] === "None";
      if (userHasNoExams) {
        passed = false;
        blockReason = `Requires ${candidate.requiredExam} but you are applying via Board Marks only`;
        eligibilityScore -= 50;
      } else if (constraints.allowedExams.length > 0 && !constraints.allowedExams.includes(candidate.requiredExam)) {
        // User has specific exams but not this one
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

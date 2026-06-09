import { EligibilityResult } from './eligibilityEngine';
import fs from 'fs';
import path from 'path';

// Read knowledge base
const examsDB = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib/knowledge/exams.json'), 'utf-8'));
const careersDB = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib/knowledge/careers.json'), 'utf-8'));
const countriesDB = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib/knowledge/countries.json'), 'utf-8'));

export interface ResolvedConstraints {
  targetDomains: string[];
  strictlyBlockedDomains: string[];
  allowedExams: string[];
  allowedCountries: string[];
  budgetLimitUSD: number;
  budgetLimitINR: number;
}

function parseBudgetToNumber(budgetStr: string, currency: "INR" | "USD"): number {
  if (!budgetStr) return 99999999;
  const lower = budgetStr.toLowerCase();
  let num = parseInt(lower.replace(/[^0-9]/g, ''), 10);
  if (isNaN(num)) return 99999999;

  if (currency === "INR") {
    if (lower.includes('lakh') || lower.includes('l')) {
      num = num * 100000;
    }
  } else if (currency === "USD") {
    if (lower.includes('lakh') || lower.includes('l')) {
      num = (num * 100000) / 80; // approximate USD conversion
    }
  }
  return num;
}

export function resolveDomains(eligibility: EligibilityResult): ResolvedConstraints {
  const constraints: ResolvedConstraints = {
    targetDomains: [...eligibility.eligibleDomains],
    strictlyBlockedDomains: [...eligibility.blockedDomains],
    allowedExams: [],
    allowedCountries: [],
    budgetLimitUSD: parseBudgetToNumber(eligibility.criteria.maxBudgetStr, "USD"),
    budgetLimitINR: parseBudgetToNumber(eligibility.criteria.maxBudgetStr, "INR"),
  };

  // Cross-reference with Exams Knowledge Base
  for (const exam of examsDB) {
    if (exam.requiredStream !== "ANY" && eligibility.criteria.stream !== "ANY") {
      if (exam.requiredStream !== eligibility.criteria.stream) {
        constraints.strictlyBlockedDomains.push(`EXAM_${exam.id.toUpperCase()}`);
        continue;
      }
    }
    
    if (eligibility.criteria.requiredExams.includes(exam.name) || eligibility.criteria.requiredExams.includes("None")) {
      constraints.allowedExams.push(exam.name);
    }
  }

  // Determine allowed countries based on exam/budget
  for (const country of countriesDB) {
    // If international, check budget and exams
    if (eligibility.eligibleDomains.includes("INTERNATIONAL")) {
      if (constraints.budgetLimitUSD >= country.minBudgetUSD) {
        constraints.allowedCountries.push(country.name);
      }
    } else {
      if (country.id === "India") {
        constraints.allowedCountries.push(country.name);
      }
    }
  }

  return constraints;
}

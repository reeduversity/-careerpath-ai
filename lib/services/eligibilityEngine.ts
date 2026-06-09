export interface EligibilityResult {
  eligibleDomains: string[];
  blockedDomains: string[];
  eligibilityReasons: string[];
  warnings: string[];
  contradictions: string[];
  hasContradiction: boolean;
  confidenceScore: number;
  criteria: {
    maxBudgetStr: string;
    targetLocation: string;
    stream: string;
    requiredExams: string[];
  };
}

export function evaluateEligibility(profile: any): EligibilityResult {
  const result: EligibilityResult = {
    eligibleDomains: [],
    blockedDomains: [],
    eligibilityReasons: [],
    warnings: [],
    contradictions: [],
    hasContradiction: false,
    confidenceScore: 100,
    criteria: {
      maxBudgetStr: profile.budget || "1000000",
      targetLocation: profile.domesticProfile?.preferredStudyLocation || profile.internationalProfile?.preferredCountry || "India",
      stream: "ANY",
      requiredExams: ["None"]
    }
  };

  const isInternational = !!profile.internationalProfile;
  const goal = (profile.careerGoal?.goalName || "").toUpperCase();
  const examsLower = (profile.domesticProfile?.entranceExamScores || "").toLowerCase();

  // 1. Detect Stream and Contradictions
  let determinedStream = "ANY";
  if (goal.includes("ENGINEER") || goal.includes("B.TECH") || goal.includes("CSE") || goal.includes("TECH")) {
    determinedStream = "PCM";
  } else if (goal.includes("MBBS") || goal.includes("DOCTOR") || goal.includes("MEDICAL") || goal.includes("BDS")) {
    determinedStream = "PCB";
  } else if (goal.includes("CA") || goal.includes("COMMERCE") || goal.includes("B.COM") || goal.includes("ACCOUNT")) {
    determinedStream = "COMMERCE";
  }

  result.criteria.stream = determinedStream;

  // Check Contradictions
  if (determinedStream === "PCM" && examsLower.includes("neet")) {
    result.contradictions.push("You are preparing for NEET (Medical) but your goal is Engineering (PCM). This is a direct contradiction.");
    result.hasContradiction = true;
    result.confidenceScore -= 50;
  }
  if (determinedStream === "PCB" && (examsLower.includes("jee") || examsLower.includes("jee main"))) {
    result.contradictions.push("You are preparing for JEE (Engineering) but your goal is Medical (PCB). This is a direct contradiction.");
    result.hasContradiction = true;
    result.confidenceScore -= 50;
  }

  if (isInternational) {
    const intl = profile.internationalProfile;
    result.eligibleDomains.push("INTERNATIONAL");
    result.blockedDomains.push("DOMESTIC");
    
    if (intl.sat) {
      result.eligibleDomains.push("INTERNATIONAL_UG");
      result.criteria.requiredExams.push("SAT");
    } else if (intl.gre) {
      result.eligibleDomains.push("INTERNATIONAL_PG_MS");
      result.criteria.requiredExams.push("GRE");
    } else if (intl.gmat) {
      result.eligibleDomains.push("INTERNATIONAL_PG_MBA");
      result.criteria.requiredExams.push("GMAT");
    } else if (intl.ielts || intl.toefl || intl.pte) {
      result.eligibleDomains.push("INTERNATIONAL_CONDITIONAL");
      if (intl.ielts) result.criteria.requiredExams.push("IELTS");
    }

  } else {
    // Domestic Evaluation
    result.eligibleDomains.push("DOMESTIC");
    result.blockedDomains.push("INTERNATIONAL");

    if (examsLower === "none" || examsLower.includes("board marks")) {
      result.eligibleDomains.push("DIRECT_ADMISSION");
      result.blockedDomains.push("JEE_TIER", "NEET_TIER", "GFTI", "NIT", "IIT", "STATE_ENGG");
      result.eligibilityReasons.push("User has no competitive exam score, eligible only for merit-based direct admission.");
    } else {
      if (examsLower.includes("jee adv")) {
        result.eligibleDomains.push("IIT_TIER", "NIT_TIER");
        result.criteria.requiredExams.push("JEE Advanced");
      }
      if (examsLower.includes("jee main")) {
        result.eligibleDomains.push("NIT_TIER", "GFTI");
        result.blockedDomains.push("IIT_TIER");
        result.criteria.requiredExams.push("JEE Main");
      }
      if (examsLower.includes("neet")) {
        result.eligibleDomains.push("MEDICAL");
        result.blockedDomains.push("ENGINEERING");
        result.criteria.requiredExams.push("NEET");
      }
      if (examsLower.includes("cat") || examsLower.includes("mat")) {
        result.eligibleDomains.push("MBA");
        result.criteria.requiredExams.push("CAT");
      }
      if (examsLower.includes("cuet")) {
        result.eligibleDomains.push("CENTRAL_UNIV");
        result.criteria.requiredExams.push("CUET");
      }
    }
  }

  return result;
}

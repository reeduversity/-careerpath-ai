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
  const qualification = (profile.currentQualification || "").toUpperCase();

  if (goal.includes("ENGINEER") || goal.includes("B.TECH") || goal.includes("CSE") || goal.includes("TECH") || qualification.includes("PCM")) {
    determinedStream = "PCM";
  } else if (goal.includes("MBBS") || goal.includes("DOCTOR") || goal.includes("MEDICAL") || goal.includes("BDS") || qualification.includes("PCB")) {
    determinedStream = "PCB";
  } else if (goal.includes("CA") || goal.includes("COMMERCE") || goal.includes("B.COM") || goal.includes("ACCOUNT") || qualification.includes("COMMERCE")) {
    determinedStream = "COMMERCE";
  } else if (qualification.includes("ARTS") || qualification.includes("HUMANITIES")) {
    determinedStream = "ARTS";
  }

  result.criteria.stream = determinedStream;

  // STRICT DOMAIN BLOCKING (PHASE 2)
  if (determinedStream === "PCM") {
    result.eligibleDomains.push("ENGINEERING", "DEFENCE", "SCIENCE", "MANAGEMENT_UG", "LAW", "ARTS", "COMMERCE");
    result.blockedDomains.push("MEDICAL");
  } else if (determinedStream === "PCB") {
    result.eligibleDomains.push("MEDICAL", "BIOTECH", "SCIENCE", "MANAGEMENT_UG", "LAW", "ARTS");
    result.blockedDomains.push("ENGINEERING", "DEFENCE");
  } else if (determinedStream === "COMMERCE") {
    result.eligibleDomains.push("COMMERCE", "FINANCE", "BANKING", "MANAGEMENT_UG", "LAW", "ARTS");
    result.blockedDomains.push("ENGINEERING", "MEDICAL", "DEFENCE", "SCIENCE");
  } else if (determinedStream === "ARTS") {
    result.eligibleDomains.push("ARTS", "LAW", "TEACHING", "MANAGEMENT_UG");
    result.blockedDomains.push("ENGINEERING", "MEDICAL", "DEFENCE", "SCIENCE", "COMMERCE");
  }

  // SAFETY OVERRIDE: Ensure the target career goal is never blocked and is explicitly allowed
  const normalizedGoal = goal.toLowerCase();
  if (normalizedGoal.includes("engineer") || normalizedGoal.includes("tech") || normalizedGoal.includes("cse") || normalizedGoal.includes("b.tech")) {
    result.blockedDomains = result.blockedDomains.filter((d: string) => d !== "ENGINEERING");
    if (!result.eligibleDomains.includes("ENGINEERING")) result.eligibleDomains.push("ENGINEERING");
  }
  if (normalizedGoal.includes("doctor") || normalizedGoal.includes("mbbs") || normalizedGoal.includes("medical") || normalizedGoal.includes("bds")) {
    result.blockedDomains = result.blockedDomains.filter((d: string) => d !== "MEDICAL");
    if (!result.eligibleDomains.includes("MEDICAL")) result.eligibleDomains.push("MEDICAL");
  }
  if (normalizedGoal.includes("law") || normalizedGoal.includes("advocate") || normalizedGoal.includes("clat") || normalizedGoal.includes("llb")) {
    result.blockedDomains = result.blockedDomains.filter((d: string) => d !== "LAW");
    if (!result.eligibleDomains.includes("LAW")) result.eligibleDomains.push("LAW");
  }
  if (normalizedGoal.includes("management") || normalizedGoal.includes("business") || normalizedGoal.includes("bba") || normalizedGoal.includes("mba")) {
    result.blockedDomains = result.blockedDomains.filter((d: string) => d !== "MANAGEMENT_UG" && d !== "MANAGEMENT" && d !== "MBA");
    if (!result.eligibleDomains.includes("MANAGEMENT_UG")) result.eligibleDomains.push("MANAGEMENT_UG");
  }
  if (normalizedGoal.includes("commerce") || normalizedGoal.includes("finance") || normalizedGoal.includes("ca") || normalizedGoal.includes("b.com")) {
    result.blockedDomains = result.blockedDomains.filter((d: string) => d !== "COMMERCE");
    if (!result.eligibleDomains.includes("COMMERCE")) result.eligibleDomains.push("COMMERCE");
  }
  if (normalizedGoal.includes("arts") || normalizedGoal.includes("humanities") || normalizedGoal.includes("design")) {
    result.blockedDomains = result.blockedDomains.filter((d: string) => d !== "ARTS");
    if (!result.eligibleDomains.includes("ARTS")) result.eligibleDomains.push("ARTS");
  }

  // Check Contradictions
  if (determinedStream === "PCM" && examsLower.includes("neet")) {
    result.contradictions.push("You are preparing for NEET (Medical) but your stream/goal is PCM. This is a direct contradiction.");
    result.hasContradiction = true;
    result.confidenceScore -= 50;
  }
  if (determinedStream === "PCB" && (examsLower.includes("jee") || examsLower.includes("jee main"))) {
    result.contradictions.push("You are preparing for JEE (Engineering) but your stream/goal is Medical (PCB). This is a direct contradiction.");
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

    if (!examsLower || examsLower === "" || examsLower === "none" || examsLower.includes("board marks") || examsLower.includes("board")) {
      result.eligibleDomains.push("DIRECT_ADMISSION");
      result.blockedDomains.push("JEE_TIER", "NEET_TIER", "GFTI", "NIT", "IIT", "STATE_ENGG");
      result.eligibilityReasons.push("User has no competitive exam score, eligible only for merit-based direct admission.");
      // CRITICAL: Keep requiredExams as ["None"] so domainResolver knows user has NO exams
    } else {
      // Split by '|' or ',' and extract exam names
      const examParts = examsLower.split(/[|,]/);
      let hasJeeMain = false;
      let hasJeeAdv = false;
      let hasNeet = false;
      let hasCat = false;
      let hasMat = false;
      let hasCuet = false;
      let hasBitsat = false;
      let hasGate = false;
      
      for (const part of examParts) {
        const trimmed = part.trim();
        if (trimmed.includes("jee adv")) {
          hasJeeAdv = true;
          if (!result.criteria.requiredExams.includes("JEE Advanced")) {
            result.criteria.requiredExams.push("JEE Advanced");
          }
        } else if (trimmed.includes("jee main")) {
          hasJeeMain = true;
          if (!result.criteria.requiredExams.includes("JEE Main")) {
            result.criteria.requiredExams.push("JEE Main");
          }
        } else if (trimmed.includes("neet")) {
          hasNeet = true;
          if (!result.criteria.requiredExams.includes("NEET")) {
            result.criteria.requiredExams.push("NEET");
          }
        } else if (trimmed.includes("cat")) {
          hasCat = true;
          if (!result.criteria.requiredExams.includes("CAT")) {
            result.criteria.requiredExams.push("CAT");
          }
        } else if (trimmed.includes("mat")) {
          hasMat = true;
          if (!result.criteria.requiredExams.includes("MAT")) {
            result.criteria.requiredExams.push("MAT");
          }
        } else if (trimmed.includes("cuet")) {
          hasCuet = true;
          if (!result.criteria.requiredExams.includes("CUET")) {
            result.criteria.requiredExams.push("CUET");
          }
        } else if (trimmed.includes("bitsat")) {
          hasBitsat = true;
          if (!result.criteria.requiredExams.includes("BITSAT")) {
            result.criteria.requiredExams.push("BITSAT");
          }
        } else if (trimmed.includes("gate")) {
          hasGate = true;
          if (!result.criteria.requiredExams.includes("GATE")) {
            result.criteria.requiredExams.push("GATE");
          }
        } else {
          // If there is any other exam, parse its name and add it
          const nameMatch = trimmed.match(/^([a-zA-Z0-9\s.-]+)/);
          if (nameMatch) {
            const cleanName = nameMatch[1].trim();
            // Capitalize first letters of each word
            const capName = cleanName.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            if (capName && capName.toLowerCase() !== "none" && !result.criteria.requiredExams.includes(capName)) {
              result.criteria.requiredExams.push(capName);
            }
          }
        }
      }

      // If we added real exams, remove "None" from requiredExams
      if (result.criteria.requiredExams.length > 1) {
        result.criteria.requiredExams = result.criteria.requiredExams.filter((e: string) => e !== "None");
      }

      // Add eligible domains based on exams taken
      if (hasJeeAdv) {
        result.eligibleDomains.push("IIT_TIER", "NIT_TIER", "GFTI");
      }
      if (hasJeeMain) {
        result.eligibleDomains.push("NIT_TIER", "GFTI");
      }
      if (hasNeet) {
        result.eligibleDomains.push("MEDICAL_TIER");
      }
      if (hasCat || hasMat) {
        result.eligibleDomains.push("MBA", "MANAGEMENT_UG");
      }
      if (hasCuet) {
        result.eligibleDomains.push("CENTRAL_UNIV");
      }
      if (hasBitsat) {
        result.eligibleDomains.push("BITS_TIER");
      }
      if (hasGate) {
        result.eligibleDomains.push("GATE_TIER");
      }

      // Block IIT_TIER only if the user did NOT take JEE Advanced
      if (!hasJeeAdv) {
        result.blockedDomains.push("IIT_TIER");
      }
      // Block NIT_TIER and GFTI only if they took neither JEE Main nor JEE Advanced
      if (!hasJeeMain && !hasJeeAdv) {
        result.blockedDomains.push("NIT_TIER", "GFTI");
      }
      // Block Medical Tier if no NEET
      if (!hasNeet) {
        result.blockedDomains.push("MEDICAL_TIER");
      }
    }
  }

  return result;
}

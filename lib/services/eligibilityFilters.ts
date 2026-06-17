import fs from 'fs';
import path from 'path';

let collegeCutoffs: any[] = [];
let jobEligibility: any[] = [];

try {
  collegeCutoffs = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib/knowledge/collegeCutoffs.json'), 'utf-8'));
  jobEligibility = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib/knowledge/jobEligibility.json'), 'utf-8'));
} catch (error) {
  console.warn("Could not load eligibility JSONs, fallback to empty arrays.");
}

export function enforceCollegeCutoffs(candidates: any[], profile: any): any[] {
  let twelfthPct = profile.twelfthPercentage || profile.percentage || 0;
  
  // If the percentage is 10 or less, it's likely a CGPA. Convert it to a rough percentage.
  if (twelfthPct > 0 && twelfthPct <= 10) {
    twelfthPct = twelfthPct * 9.5;
  }

  const tenthPct = profile.tenthPercentage || 0;
  const category = profile.category || "General";
  const stream = (profile.currentQualification || "").toUpperCase();

  // If we don't have enough data, we won't strictly drop everything, but we will apply basic checks if provided.
  
  return candidates.map(candidate => {
    let passed = true;
    let blockReason = "";

    // Check against Cutoffs mapping
    const matchedCutoff = collegeCutoffs.find(c => c.examples.some((ex: string) => candidate.name.toLowerCase().includes(ex.toLowerCase())));
    
    if (matchedCutoff) {
      // Stream Check
      if (!matchedCutoff.requiredStream.includes("ANY")) {
        const hasValidStream = matchedCutoff.requiredStream.some((rs: string) => stream.includes(rs));
        if (!hasValidStream) {
          passed = false;
          blockReason = `Requires ${matchedCutoff.requiredStream.join("/")} stream, but user has ${stream}.`;
        }
      }

      // Percentage Check
      let requiredPct = matchedCutoff.min12thPercentage;
      if (category === "SC" || category === "ST") {
        requiredPct -= 5; // 5% relaxation for SC/ST
      }

      if (twelfthPct > 0 && twelfthPct < requiredPct) {
        passed = false;
        blockReason = `Requires minimum ${requiredPct}% in 12th, user has ${twelfthPct}%.`;
      }
    }

    // Hardcoded safety rules based on domain
    if (candidate.domain === "ENGINEERING") {
      if (stream && !stream.includes("PCM") && !stream.includes("SCIENCE") && !stream.includes("TECH") && !stream.includes("ENGG") && !stream.includes("ENGINEERING") && !stream.includes("BCA") && !stream.includes("MCA") && !stream.includes("CS") && !stream.includes("IT")) {
         passed = false;
         blockReason = "Engineering strictly requires PCM, Science, or Technical background.";
      }
    } else if (candidate.domain === "MEDICAL") {
      if (stream && !stream.includes("PCB") && !stream.includes("SCIENCE") && !stream.includes("MBBS") && !stream.includes("BDS") && !stream.includes("PHARM") && !stream.includes("NURSING")) {
         passed = false;
         blockReason = "Medical strictly requires PCB or Medical/Life Sciences background.";
      }
    }

    // --- GROUND TRUTH VALIDATOR: STOP AI HALLUCINATIONS ACROSS ALL DISCIPLINES ---
    let groundTruthExam = candidate.requiredExam;
    const lowerName = candidate.name.toLowerCase();

    // 1. Engineering (JEE Main / JEE Advanced / BITSAT / State CETs)
    const jeeKeywords = [
      "iit", "indian institute of technology", "nit", "national institute of technology", 
      "iiit", "indian institute of information technology", "dtu", "delhi technological", 
      "nsut", "netaji subhas", "bits", "birla institute", "jadavpur", "vjti", "coep", "pec", 
      "punjab engineering college", "thapar", "rvce", "bms", "anna university",
      "maharaja agrasen", "maharaja surajmal", "bharati vidyapeeth", "ggsipu", "indraprastha university", 
      "ip university", "lnmiit", "lnm institute", "da-iict", "dhirubhai ambani", "nirma university", 
      "jaypee institute", "jiit", "coimbatore institute", "rv college", "bms college", "msrit"
    ];
    if (jeeKeywords.some(kw => lowerName.includes(kw))) {
      groundTruthExam = "JEE Main";
    }

    // 2. Medical (NEET) - MBBS, BDS, and major medical institutes strictly require NEET
    const neetKeywords = [
      "aiims", "all india institute", "cmc", "christian medical", "jipmer", "afmc", "armed forces", 
      "mamc", "maulana azad", "kem", "king edward", "lady hardinge", "grant medical", "madras medical", 
      "vmmc", "safdarjung", "mbbs", "bds", "medical college", "medical institute", "institute of medical sciences"
    ];
    if (neetKeywords.some(kw => lowerName.includes(kw))) {
      groundTruthExam = "NEET";
    }

    // 3. Management (CAT/GMAT) - Top business schools (Postgraduate MBA)
    const catKeywords = [
      "iim", "indian institute of management", "fms", "faculty of management", "xlri", "spjimr", 
      "mdi", "gurgaon", "jbims", "jamnalal bajaj", "isb", "indian school of business", "nmims", 
      "symbiosis institute of business", "sibm", "tiss", "iift"
    ];
    if (catKeywords.some(kw => lowerName.includes(kw))) {
      groundTruthExam = "CAT";
    }

    // 4. Law (CLAT) - National Law Universities (NLUs) and top law schools
    const lawKeywords = [
      "nlsiu", "national law school", "nalsar", "nlu", "national law university", "nliu", 
      "nujs", "symbiosis law", "jindal global law", "ils law", "government law college"
    ];
    if (lawKeywords.some(kw => lowerName.includes(kw))) {
      groundTruthExam = "CLAT";
    }

    // 5. Architecture (NATA/JEE Paper 2)
    const archKeywords = [
      "spa", "school of planning and architecture", "cept", "sir jj", "nit architecture", 
      "iit architecture", "nata"
    ];
    if (archKeywords.some(kw => lowerName.includes(kw))) {
      groundTruthExam = "NATA";
    }

    // 6. Commerce, Arts & Humanities (CUET) - Central universities like DU, BHU, JNU, and their top colleges
    const cuetKeywords = [
      "du", "delhi university", "bhu", "banaras hindu", "jnu", "jawaharlal nehru", 
      "srcc", "shri ram college", "hindu college", "st. stephen", "lady shri ram", "lsr", 
      "hansraj", "miranda house", "ramjas", "kirori mal", "jamia millia", "aligarh muslim", "amu"
    ];
    if (cuetKeywords.some(kw => lowerName.includes(kw))) {
      groundTruthExam = "CUET";
    }

    // 7. International Tier 1 (SAT/ACT/GRE)
    const intlKeywords = [
      "mit", "massachusetts institute", "harvard", "stanford", "oxford", "cambridge", 
      "caltech", "princeton", "yale", "imperial college", "eth zurich", "ucl", 
      "university college london", "columbia", "cornell", "upenn", "berkeley", "ucla"
    ];
    if (intlKeywords.some(kw => lowerName.includes(kw))) {
      groundTruthExam = "SAT";
    }

    // FORCE OVERRIDE if AI says "None" but Ground Truth dictates an exam
    if (groundTruthExam && groundTruthExam !== "None" && (!candidate.requiredExam || candidate.requiredExam === "None" || candidate.requiredExam.toLowerCase() === "board marks" || candidate.requiredExam.toLowerCase() === "merit")) {
       console.log(`[Ground Truth Override] AI hallucinated 'None' for ${candidate.name}. Forcing exam requirement to '${groundTruthExam}'.`);
       candidate.requiredExam = groundTruthExam;
    }
    // --- END GROUND TRUTH VALIDATOR ---

    return { ...candidate, passedCutoff: passed, cutoffBlockReason: blockReason };
  });
}

export function enforceJobEligibility(jobs: string[], profile: any, targetRole: string): { job: string, passed: boolean, reason: string }[] {
  const cgpa = profile.cgpa || 0;
  const degree = (profile.degree || "").toUpperCase();
  const twelfthPct = profile.twelfthPercentage || 0;

  return jobs.map(job => {
    let passed = true;
    let blockReason = "";

    // Check Government Jobs
    if (job.toUpperCase().includes("UPSC") || job.toUpperCase().includes("SSC CGL") || job.toUpperCase().includes("BANK PO")) {
       if (profile.educationLevel === "12th" || profile.educationLevel === "10th") {
         passed = false;
         blockReason = `${job} strictly requires a Graduation Degree. You are currently ${profile.educationLevel} pass.`;
       }
    }

    if (job.toUpperCase().includes("NDA")) {
       if (twelfthPct > 0 && twelfthPct < 50) {
         passed = false;
         blockReason = "NDA requires minimum 50% in 12th.";
       }
    }

    // Check against Eligibility JSON
    const matchedEligibility = jobEligibility.find(j => targetRole.toLowerCase().includes(j.domain.toLowerCase()) || job.toLowerCase().includes(j.domain.toLowerCase()));
    
    if (matchedEligibility) {
      if (cgpa > 0 && cgpa < matchedEligibility.minCgpa) {
        passed = false;
        blockReason = `Requires minimum CGPA of ${matchedEligibility.minCgpa}, user has ${cgpa}.`;
      }

      if (!matchedEligibility.requiredDegrees.includes("ANY")) {
        const hasValidDegree = matchedEligibility.requiredDegrees.some((rd: string) => degree.includes(rd.toUpperCase()));
        if (!hasValidDegree) {
          passed = false;
          blockReason = `Requires degrees like ${matchedEligibility.requiredDegrees.join(", ")}, user has ${degree}.`;
        }
      }
    }

    return { job, passed, reason: blockReason };
  });
}

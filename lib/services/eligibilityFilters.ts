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
  const twelfthPct = profile.twelfthPercentage || profile.percentage || 0;
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
      if (stream && !stream.includes("PCM") && !stream.includes("SCIENCE")) {
         passed = false;
         blockReason = "Engineering strictly requires PCM stream.";
      }
    } else if (candidate.domain === "MEDICAL") {
      if (stream && !stream.includes("PCB") && !stream.includes("SCIENCE")) {
         passed = false;
         blockReason = "Medical strictly requires PCB stream.";
      }
    }

    // --- GROUND TRUTH VALIDATOR: STOP AI HALLUCINATIONS ---
    // Engineering (JEE/State Exams)
    const jeeKeywords = [
      "IIT", "Indian Institute of Technology", "NIT", "National Institute of Technology", 
      "IIIT", "Indian Institute of Information Technology", "DTU", "Delhi Technological", 
      "NSUT", "Netaji Subhas", "BITS", "Birla Institute", "Jadavpur", "VJTI", "COEP", "PEC", 
      "Punjab Engineering College", "Thapar", "RVCE", "BMS", "Anna University",
      "Maharaja Agrasen", "Maharaja Surajmal", "Bharati Vidyapeeth", "GGSIPU", "Indraprastha University", 
      "IP University", "LNMIIT", "LNM Institute", "DA-IICT", "Dhirubhai Ambani", "Nirma University", 
      "Jaypee Institute", "JIIT"
    ];
    // Medical (NEET)
    const neetKeywords = ["AIIMS", "All India Institute", "CMC", "Christian Medical", "JIPMER", "AFMC", "Armed Forces", "MAMC", "Maulana Azad", "KEM", "King Edward", "Lady Hardinge", "Grant Medical", "Madras Medical", "VMMC", "Safdarjung"];
    // Management (CAT/GMAT)
    const catKeywords = ["IIM", "Indian Institute of Management", "FMS", "Faculty of Management", "XLRI", "SPJIMR", "MDI", "Gurgaon", "JBIMS", "Jamnalal Bajaj", "ISB", "Indian School of Business", "NMIMS", "Symbiosis", "SIBM", "TISS"];
    // Law (CLAT)
    const lawKeywords = ["NLSIU", "National Law School", "NALSAR", "NLU", "National Law University", "NLIU", "NUJS", "Symbiosis Law", "Jindal Global Law"];
    // Architecture (NATA/JEE Paper 2)
    const archKeywords = ["SPA", "School of Planning and Architecture", "CEPT", "Sir JJ", "NIT Architecture", "IIT Architecture"];
    // International Tier 1 (SAT/ACT/GRE)
    const intlKeywords = ["MIT", "Massachusetts Institute", "Harvard", "Stanford", "Oxford", "Cambridge", "Caltech", "Princeton", "Yale", "Imperial College", "ETH Zurich", "UCL", "University College London", "Columbia", "Cornell", "UPenn", "Berkeley", "UCLA"];
    
    let groundTruthExam = candidate.requiredExam;
    const lowerName = candidate.name.toLowerCase();

    if (jeeKeywords.some(kw => lowerName.includes(kw.toLowerCase()))) groundTruthExam = "JEE Main";
    if (neetKeywords.some(kw => lowerName.includes(kw.toLowerCase()))) groundTruthExam = "NEET";
    if (catKeywords.some(kw => lowerName.includes(kw.toLowerCase()))) groundTruthExam = "CAT";
    if (lawKeywords.some(kw => lowerName.includes(kw.toLowerCase()))) groundTruthExam = "CLAT";
    if (archKeywords.some(kw => lowerName.includes(kw.toLowerCase()))) groundTruthExam = "NATA";
    if (intlKeywords.some(kw => lowerName.includes(kw.toLowerCase()))) groundTruthExam = "SAT"; // Or GRE, just needs a top-tier international exam

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

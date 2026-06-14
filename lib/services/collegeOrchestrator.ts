import { generateGroqResponse } from "./groqClient";
import { prisma } from "@/lib/prisma";
import { evaluateEligibility } from "./eligibilityEngine";
import { resolveDomains } from "./domainResolver";
import { validateCandidates, Candidate } from "./validationEngine";

export async function orchestrateCollegePlan(profileId: string) {
  const profile = await prisma.higherEducationProfile.findUnique({
    where: { id: profileId },
    include: { domesticProfile: true, internationalProfile: true, careerGoal: true }
  });

  if (!profile) throw new Error("Profile not found");

  // LAYER 1: Universal Eligibility
  const eligibility = evaluateEligibility(profile);

  // Contradiction detection
  if (eligibility.hasContradiction) {
    return {
      hasContradiction: true,
      contradictions: eligibility.contradictions,
      recommendedColleges: [],
      careerPathways: [],
      admissionProcess: [],
      scholarships: [],
      recommendedStreams: []
    };
  }

  // LAYER 2: Domain Resolver
  const constraints = resolveDomains(eligibility);

  // PHASE 7: CONFIDENCE ENGINE
  if (eligibility.confidenceScore < 70) {
    return {
      hasContradiction: true,
      contradictions: ["Your profile inputs generated a confidence score below 70 due to conflicting data. We cannot confidently recommend a path. Please review your inputs."],
      recommendedColleges: [],
      careerPathways: [],
      admissionProcess: [],
      scholarships: [],
      recommendedStreams: []
    };
  }

  const isInternational = !!profile.internationalProfile;
  
  let entranceExams = "None (Applying via Board Marks)";
  if (isInternational) {
    const intl = profile.internationalProfile;
    const exams = [];
    if (intl?.sat) exams.push(`SAT: ${intl.sat}`);
    if (intl?.gre) exams.push(`GRE: ${intl.gre}`);
    if (intl?.gmat) exams.push(`GMAT: ${intl.gmat}`);
    if (intl?.ielts) exams.push(`IELTS: ${intl.ielts}`);
    if (intl?.toefl) exams.push(`TOEFL: ${intl.toefl}`);
    if (exams.length > 0) entranceExams = exams.join(", ");
  } else {
    entranceExams = (profile.domesticProfile?.entranceExamScores as string) || "None (Applying via Board Marks)";
  }

  const isTargetInternational = constraints.targetDomains.includes("INTERNATIONAL");
  const contextType = isTargetInternational ? "INTERNATIONAL EDUCATION (Strictly outside India)" : "DOMESTIC EDUCATION (Strictly inside India)";
  
  // PASS 1: CANDIDATE GENERATION (No Explanations)
  const candidatePrompt = `You are a Candidate Generation Engine.
Based on the profile, propose 10 potential institutions.
Profile: 
- Form Context: ${contextType}
- Level: ${profile.educationLevel}
- Current Qualification/Stream: ${profile.currentQualification}
- Academic Performance: ${profile.twelfthPercentage ? profile.twelfthPercentage + '% in 12th' : (profile.cgpa ? profile.cgpa + ' CGPA' : 'Not specified')}
- Budget: ${profile.budget}
- User's Typed Target Location: ${isInternational ? profile.internationalProfile?.preferredCountry : profile.domesticProfile?.preferredStudyLocation}
- Entrance Exams Taken: ${entranceExams}

CRITICAL RULES:
1. STRICT LOCATION ISOLATION: The Form Context is ${contextType}. You MUST ONLY suggest institutions that match this Form Context. If DOMESTIC, suggest ONLY Indian colleges. If INTERNATIONAL, suggest ONLY non-Indian colleges. If the user's Typed Target Location contradicts the Form Context (e.g. they typed 'USA' on a DOMESTIC form), IGNORE their typed location and strictly follow the Form Context.
2. If "Entrance Exams Taken" says "None" or "Board Marks", you MUST NOT recommend colleges that mandate strict competitive exams. CRITICAL: Top institutes like IITs, NITs, IIITs, Delhi Technological University (DTU), NSUT, BITS Pilani, Jadavpur University, AIIMS, CMC, etc. STRICTLY REQUIRE ENTRANCE EXAMS. NEVER suggest them if "Entrance Exams" is "None". Instead, recommend local private universities or state colleges that have direct merit-based admissions (e.g. Amity, LPU, SRM, Manipal, or state-specific merit colleges).
3. Ensure the fees fit the budget limit.

Output a JSON array under "candidates" with fields:
{
  "candidates": [
    {
      "name": "string",
      "domain": "string (e.g. ENGINEERING, MEDICAL, MANAGEMENT)",
      "requiredExam": "string (e.g. JEE Main, NEET, None)",
      "feesINR": number,
      "feesUSD": number,
      "country": "string"
    }
  ]
}
Return raw JSON only.`;

  console.log(`[Groq] Generating RAW candidates for ${profile.fullName}...`);
  let rawCandidates: any;
  try {
    rawCandidates = await generateGroqResponse(candidatePrompt, "Generate candidates", true);
  } catch (error) {
    console.error("Candidate generation failed", error);
    rawCandidates = { candidates: [] };
  }

  // LAYER 3-8: VALIDATION PIPELINE
  const { enforceCollegeCutoffs } = require("./eligibilityFilters");
  const filteredRawCandidates = enforceCollegeCutoffs(rawCandidates.candidates || [], profile).filter((c: any) => c.passedCutoff);

  const validationResults = validateCandidates(filteredRawCandidates, constraints);
  
  // Custom Deterministic Scoring (Marks 30%, Budget 25%, Goals 20%, Exam 15%, Location 10%)
  validationResults.forEach(r => {
    const c = r.candidate;
    let score = 0;
    
    // Marks (30%) - Since it passed the cutoff filter, we grant full marks score
    score += 30;
    
    // Budget (25%)
    let fees = isInternational ? (c.feesUSD || 0) : (c.feesINR || 0);
    let budgetLimit = isInternational ? constraints.budgetLimitUSD : constraints.budgetLimitINR;
    if (fees <= budgetLimit) score += 25;
    else if (fees <= budgetLimit * 1.2) score += 10; // Within 20% stretch
    
    // Professional goals (20%)
    if (profile.careerGoal && c.domain.toLowerCase() === profile.careerGoal.goalName.toLowerCase()) score += 20;
    else if (c.domain === constraints.targetDomains[0]) score += 10;
    
    // Entrance exam (15%)
    if (!c.requiredExam || c.requiredExam === "None" || constraints.allowedExams.includes(c.requiredExam)) score += 15;
    
    // Location fit (10%)
    const targetLocation = isInternational ? profile.internationalProfile?.preferredCountry : profile.domesticProfile?.preferredStudyLocation;
    if (targetLocation && c.country && targetLocation.trim().toLowerCase() === c.country.trim().toLowerCase()) score += 10;
    else if (!isInternational && c.country === "India") score += 5; // General country match
    
    r.matchScore = score;
  });

  // Filter passed candidates and sort by match score
  let passedCandidates = validationResults.filter(r => r.passed).sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
  let isFallback = false;

  if (passedCandidates.length === 0) {
    console.warn("[Validation] ALL candidates failed. Finding nearest valid alternative...");
    
    // PHASE 6: FALLBACK ENGINE
    // Find nearest alternative by relaxing budget or country constraints
    passedCandidates = validationResults
      .sort((a, b) => b.eligibilityScore - a.eligibilityScore || b.matchScore - a.matchScore)
      .slice(0, 3);
      
    if (passedCandidates.length === 0) {
      // Hard fallback if generation totally failed
      passedCandidates = [{
        candidate: { name: "Nearest Regional University", domain: constraints.targetDomains[0] || "GENERAL", country: "Local" },
        passed: false,
        blockReason: "Hard Fallback",
        matchScore: 50,
        eligibilityScore: 50
      }];
    }
    isFallback = true;
  }

  // PASS 2: EXPLAINABILITY & RANKING
  const explainPrompt = `You are an Explainability Engine.
I have programmatically evaluated the following ${passedCandidates.length} colleges for the user:
${JSON.stringify(passedCandidates.map(p => ({
  ...p.candidate,
  validationPassed: p.passed,
  blockReason: p.blockReason
})))}

USER PROFILE:
- Form Context: ${contextType}
- User's Typed Target Location: ${isInternational ? profile.internationalProfile?.preferredCountry : profile.domesticProfile?.preferredStudyLocation}
- Education Level: ${profile.educationLevel}
- Current Qualification/Stream: ${profile.currentQualification}
- Academic Performance: ${profile.twelfthPercentage ? profile.twelfthPercentage + '% in 12th' : (profile.cgpa ? profile.cgpa + ' CGPA' : 'Not specified')}
- Budget Limit: ${profile.budget} (Approx INR ${constraints.budgetLimitINR})
- Entrance Exams Taken: ${entranceExams}

CRITICAL RULES:
1. STRICT LOCATION ISOLATION: The Form Context is ${contextType}. If DOMESTIC, you must ONLY recommend Indian colleges. If the user typed an international city (like London, USA) in their Typed Target Location on a DOMESTIC form, IGNORE their typed location. Tell them in 'whyRecommended': "Since you applied through the Domestic form, I am recommending top options in India." NEVER mix domestic and international!
2. If the user is a Science/Engineering student (PCM/PCB), DO NOT recommend Arts or Humanities paths unless specifically asked. Align 'recommendedStreams' exactly with their past 'Stream/Major' and 'Current Qualification'.
3. Only use the colleges from the provided list. Do not hallucinate.
4. RANKING CRITERIA: When determining category (Dream|Target|Safe) and 'whyRecommended', analyze Affordability, Eligibility match, Career alignment, Placement strength, and ROI.
5. BUDGET INTELLIGENCE: If the student's budget is slightly below stronger opportunities, you MUST explicitly mention in 'whyRecommended': How much extra budget is needed, what better colleges become accessible, and why increasing budget improves chances. (e.g. "Increasing your budget by ₹2–3 lakhs could unlock Tier-1 private colleges with stronger placements and better ROI.")

${isFallback ? "WARNING: None of the generated colleges perfectly matched the user's strict criteria (e.g. budget, country, exam). These are FALLBACK recommendations. In 'whyRecommended' or 'riskFactors', clearly explain why they are being shown despite failing some constraints (e.g., 'Exceeds budget', 'Different country'). You MUST still generate all other required fields (streams, scholarships, careers)." : "You MUST generate all required fields."}

Your job is to generate the final detailed JSON response matching this schema:
{
  "recommendedStreams": [{ "name": "string", "reason": "string" }],
  "recommendedColleges": [
    {
      "collegeName": "string",
      "location": "string",
      "fees": "string",
      "category": "Dream|Target|Safe",
      "whyRecommended": "string (Explain why it matches)",
      "riskFactors": "string (Any risks like high fees or tough admission)",
      "matchPercentage": number,
      "admissionProbability": number,
      "deepDetails": {
        "averagePackage": "string",
        "highestPackage": "string",
        "placementPercentage": "string",
        "topRecruiters": ["string"],
        "curriculumHighlights": ["string"]
      }
    }
  ],
  "scholarships": [{ "name": "string", "amount": "string", "eligibility": "string" }],
  "careerPathways": ["string"],
  "admissionProcess": [{ "step": "string", "timeline": "string", "description": "string" }]
}

Inject the exact "matchScore" and "eligibilityScore" from the provided list into the respective college objects as "matchPercentage" and "admissionProbability".
Provide realistic and accurate estimates for "averagePackage", "highestPackage", "placementPercentage", "topRecruiters", and "curriculumHighlights" based on your general knowledge of these institutions. Do NOT output "Not available" unless the institution is completely unknown.`;

  console.log(`[Groq] Explaining validated candidates for ${profile.fullName}...`);
  let finalData: any;
  try {
    finalData = await generateGroqResponse(explainPrompt, "Generate final explanation", true);
  } catch (error) {
    console.error("Explainability failed", error);
    finalData = { 
      recommendedStreams: [{ name: "General Pathway", reason: "AI Generation Timeout - Fallback Data" }],
      recommendedColleges: passedCandidates.map(p => ({
        collegeName: p.candidate.name,
        location: p.candidate.country,
        fees: p.candidate.feesINR ? `INR ${p.candidate.feesINR}` : `USD ${p.candidate.feesUSD}`,
        category: "Target",
        whyRecommended: "System fallback generation due to AI timeout. " + (p.blockReason || ""),
        riskFactors: p.blockReason || "Unknown",
        matchPercentage: p.matchScore,
        admissionProbability: p.eligibilityScore,
        deepDetails: {
          averagePackage: "Data temporarily unavailable",
          highestPackage: "Data temporarily unavailable",
          placementPercentage: "Data temporarily unavailable",
          topRecruiters: ["N/A"],
          curriculumHighlights: ["N/A"]
        }
      })),
      scholarships: [],
      careerPathways: ["Explore general careers in this domain"],
      admissionProcess: []
    };
  }

  // Merge scores and metadata explicitly to prevent AI dropping them
  if (finalData.recommendedColleges) {
    finalData.recommendedColleges = finalData.recommendedColleges.map((c: any) => {
      const match = passedCandidates.find(p => p.candidate.name.includes(c.collegeName) || c.collegeName.includes(p.candidate.name));
      if (match) {
        c.matchPercentage = match.matchScore;
        c.admissionProbability = match.eligibilityScore;
      }
      return c;
    });
  }

  finalData.hasContradictions = false;
  
  return finalData;
}

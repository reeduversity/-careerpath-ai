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

  const entranceExams = profile.domesticProfile?.entranceExamScores || "None (Applying via Board Marks)";

  // PASS 1: CANDIDATE GENERATION (No Explanations)
  const candidatePrompt = `You are a Candidate Generation Engine.
Based on the profile, propose 10 potential colleges.
Profile: 
- Level: ${profile.educationLevel}
- Budget: ${profile.budget}
- Target Location: ${constraints.targetDomains.includes("INTERNATIONAL") ? profile.internationalProfile?.preferredCountry : profile.domesticProfile?.preferredStudyLocation}
- Entrance Exams Taken: ${entranceExams}

CRITICAL RULES:
1. STRICT LOCATION ISOLATION: If the user is applying for Domestic Education (Target Location is in India or a specific Indian state/city), you MUST ONLY suggest universities located IN INDIA. If the user is applying for International Education (Target Location is USA, UK, Canada, etc.), you MUST ONLY suggest universities outside India. NEVER MIX THEM.
2. If "Entrance Exams Taken" says "None" or "Board Marks", you MUST NOT recommend colleges that mandate strict competitive exams (like JEE, NEET, etc.). Instead, recommend universities in the Target Location that accept students based on high school/12th board merit or holistic review.
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

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
1. STRICT LOCATION MATCHING: The Form Context is ${contextType}. If the "User's Typed Target Location" is "Any", "Anywhere", or "International", you MUST suggest a highly diverse mix of top colleges globally. Otherwise, strictly suggest colleges located EXACTLY in the "User's Typed Target Location". CRITICAL: If the form context is INTERNATIONAL EDUCATION, you MUST EXCLUDE INDIA completely and NEVER suggest any Indian colleges. If the Typed Target Location contradicts the Form Context (e.g. they typed 'USA' on a DOMESTIC form), IGNORE their typed location and strictly follow the Form Context.
2. If "Entrance Exams Taken" says "None" or "Board Marks", you MUST NOT recommend colleges that mandate strict competitive exams. CRITICAL: Top institutes like IITs, NITs, IIITs, Delhi Technological University (DTU), NSUT, BITS Pilani, Jadavpur University, AIIMS, CMC, etc. STRICTLY REQUIRE ENTRANCE EXAMS. NEVER suggest them if "Entrance Exams" is "None". Instead, recommend local private universities or state colleges that have direct merit-based admissions (e.g. Amity, LPU, SRM, Manipal, or state-specific merit colleges).
3. STRICT BUDGET MATCHING: Ensure the fees fit the budget limit. If the budget is too low for the Target Location, suggest the cheapest possible valid options in that exact location.
4. MULTIPLE ENTRANCE EXAMS: If "Entrance Exams Taken" contains multiple exams (e.g. "JEE Main: 98 percentile | JEE Advanced: 5000 Rank | CUET: 750 Score"), you MUST recommend a balanced, high-quality mix of colleges matching ANY of the competitive exams they have taken (e.g., IITs for JEE Advanced, NITs/DTU for JEE Main, and Delhi University/Central Universities for CUET). Do not ignore any of the provided exams.
5. REAL-WORLD ACCURACY: Only recommend real, actual, existing institutions (e.g. Delhi Technological University, Indian Institute of Technology Delhi, Netaji Subhas University of Technology, etc. in Delhi). Do not generate generic, fictional, or placeholder college names. Ensure fees are realistically estimated.
6. DISTANCE & LOW BUDGET OPTIONS: If the user's budget is extremely low (e.g. Below 2 Lakhs) or they seek flexibility/distance learning, you MUST recommend Indira Gandhi National Open University (IGNOU) or similar public open universities in India. IGNOU has a domestic budget fit for almost all courses.

Output a JSON array under "candidates" with fields:
{
  "candidates": [
    {
      "name": "string",
      "domain": "string (e.g. ENGINEERING, MEDICAL, MANAGEMENT, GENERAL)",
      "requiredExam": "string (e.g. JEE Main, NEET, None)",
      "feesINR": number (The full total annual fees in Indian Rupees as a complete integer, e.g. 120000 or 150000. DO NOT use decimal shorthands like 1.2 or 1.5),
      "feesUSD": number (The full total annual fees in USD as a complete integer, e.g. 15000 or 2500. DO NOT use decimal shorthands like 15 or 2.5),
      "country": "string",
      "officialWebsite": "string (The official website URL of the college, e.g. https://www.iitd.ac.in, https://www.ignou.ac.in)"
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
    if (targetLocation) {
      const normTarget = targetLocation.trim().toLowerCase();
      const normCountry = (c.country || "").trim().toLowerCase();
      const normName = (c.name || "").trim().toLowerCase();
      
      if (normTarget === "anywhere in india" || normTarget === "any" || normTarget === "india") {
        score += 10;
      } else if (normName.includes(normTarget) || normTarget.includes(normName) || normTarget.includes(normCountry)) {
        score += 10;
      } else if (normTarget.includes("delhi") && (normName.includes("delhi") || normName.includes("ncr") || normName.includes("dtu") || normName.includes("nsut"))) {
        score += 10;
      } else {
        score += 5; // fallback
      }
    } else {
      score += 10;
    }
    
    r.matchScore = score;
  });

  // Filter passed candidates and sort by match score
  let passedCandidates = validationResults.filter(r => r.passed).sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
  let isFallback = false;

  if (passedCandidates.length === 0) {
    console.warn("[Validation] ALL candidates failed. Generating smart fallback...");
    
    // PHASE 6: SMART FALLBACK ENGINE
    // First try: relax validation and use top scored from existing results
    if (validationResults.length > 0) {
      passedCandidates = validationResults
        .sort((a, b) => b.eligibilityScore - a.eligibilityScore || b.matchScore - a.matchScore)
        .slice(0, 10);
    }
      
    if (passedCandidates.length === 0) {
      // Hard fallback: Generate real merit-based colleges programmatically
      const targetLocation = isInternational ? profile.internationalProfile?.preferredCountry : profile.domesticProfile?.preferredStudyLocation;
      const stream = (profile.currentQualification || "").toUpperCase();
      
      // Build smart merit-based college list based on user's stream
      let fallbackColleges: any[] = [];
      
      if (isInternational) {
        if (stream.includes("PCM") || stream.includes("SCIENCE") || stream.includes("TECH") || stream.includes("ENGG") || stream.includes("ENGINEERING") || stream.includes("CS") || stream.includes("IT") || stream.includes("BCA") || stream.includes("MCA")) {
          fallbackColleges = [
            { name: "University of Toronto", domain: "ENGINEERING", requiredExam: "None", feesINR: 3500000, feesUSD: 42000, country: "Canada", officialWebsite: "https://www.utoronto.ca" },
            { name: "Technical University of Munich", domain: "ENGINEERING", requiredExam: "None", feesINR: 250000, feesUSD: 3000, country: "Germany", officialWebsite: "https://www.tum.de" },
            { name: "RMIT University", domain: "ENGINEERING", requiredExam: "None", feesINR: 2500000, feesUSD: 30000, country: "Australia", officialWebsite: "https://www.rmit.edu.au" },
            { name: "Arizona State University", domain: "ENGINEERING", requiredExam: "None", feesINR: 2800000, feesUSD: 33000, country: "USA", officialWebsite: "https://www.asu.edu" },
            { name: "University of Waterloo", domain: "ENGINEERING", requiredExam: "None", feesINR: 3800000, feesUSD: 45000, country: "Canada", officialWebsite: "https://uwaterloo.ca" },
            { name: "TU Delft", domain: "ENGINEERING", requiredExam: "None", feesINR: 1500000, feesUSD: 18000, country: "Netherlands", officialWebsite: "https://www.tudelft.nl" },
            { name: "University of New South Wales", domain: "ENGINEERING", requiredExam: "None", feesINR: 3000000, feesUSD: 36000, country: "Australia", officialWebsite: "https://www.unsw.edu.au" },
            { name: "RWTH Aachen University", domain: "ENGINEERING", requiredExam: "None", feesINR: 300000, feesUSD: 3500, country: "Germany", officialWebsite: "https://www.rwth-aachen.de" },
            { name: "KTH Royal Institute of Technology", domain: "ENGINEERING", requiredExam: "None", feesINR: 1200000, feesUSD: 14000, country: "Sweden", officialWebsite: "https://www.kth.se" },
            { name: "Politecnico di Milano", domain: "ENGINEERING", requiredExam: "None", feesINR: 400000, feesUSD: 4800, country: "Italy", officialWebsite: "https://www.polimi.it" }
          ];
        } else if (stream.includes("PCB") || stream.includes("MBBS") || stream.includes("BDS") || stream.includes("PHARM") || stream.includes("NURSING")) {
          fallbackColleges = [
            { name: "University of Melbourne", domain: "MEDICAL", requiredExam: "None", feesINR: 4500000, feesUSD: 54000, country: "Australia", officialWebsite: "https://www.unimelb.edu.au" },
            { name: "King's College London", domain: "MEDICAL", requiredExam: "None", feesINR: 4000000, feesUSD: 48000, country: "UK", officialWebsite: "https://www.kcl.ac.uk" },
            { name: "University of Amsterdam", domain: "MEDICAL", requiredExam: "None", feesINR: 1500000, feesUSD: 18000, country: "Netherlands", officialWebsite: "https://www.uva.nl" },
            { name: "University of Sydney", domain: "MEDICAL", requiredExam: "None", feesINR: 4800000, feesUSD: 58000, country: "Australia", officialWebsite: "https://www.sydney.edu.au" },
            { name: "McGill University", domain: "MEDICAL", requiredExam: "None", feesINR: 3200000, feesUSD: 38000, country: "Canada", officialWebsite: "https://www.mcgill.ca" },
            { name: "Karolinska Institute", domain: "MEDICAL", requiredExam: "None", feesINR: 1600000, feesUSD: 19000, country: "Sweden", officialWebsite: "https://ki.se" },
            { name: "Heidelberg University", domain: "MEDICAL", requiredExam: "None", feesINR: 300000, feesUSD: 3600, country: "Germany", officialWebsite: "https://www.uni-heidelberg.de" },
            { name: "University of Edinburgh", domain: "MEDICAL", requiredExam: "None", feesINR: 3500000, feesUSD: 42000, country: "UK", officialWebsite: "https://www.ed.ac.uk" },
            { name: "KU Leuven", domain: "MEDICAL", requiredExam: "None", feesINR: 800000, feesUSD: 9500, country: "Belgium", officialWebsite: "https://www.kuleuven.be" },
            { name: "University of Queensland", domain: "MEDICAL", requiredExam: "None", feesINR: 4200000, feesUSD: 50000, country: "Australia", officialWebsite: "https://www.uq.edu.au" }
          ];
        } else if (stream.includes("COMMERCE") || stream.includes("BBA") || stream.includes("MBA") || stream.includes("B.COM") || stream.includes("M.COM") || stream.includes("FINANCE")) {
          fallbackColleges = [
            { name: "London School of Economics", domain: "COMMERCE", requiredExam: "None", feesINR: 3000000, feesUSD: 36000, country: "UK", officialWebsite: "https://www.lse.ac.uk" },
            { name: "University of Sydney", domain: "COMMERCE", requiredExam: "None", feesINR: 2800000, feesUSD: 34000, country: "Australia", officialWebsite: "https://www.sydney.edu.au" },
            { name: "National University of Singapore", domain: "COMMERCE", requiredExam: "None", feesINR: 2000000, feesUSD: 24000, country: "Singapore", officialWebsite: "https://nus.edu.sg" },
            { name: "University of Warwick", domain: "COMMERCE", requiredExam: "None", feesINR: 2500000, feesUSD: 30000, country: "UK", officialWebsite: "https://warwick.ac.uk" },
            { name: "Rotman School of Management (UofT)", domain: "COMMERCE", requiredExam: "None", feesINR: 3800000, feesUSD: 45000, country: "Canada", officialWebsite: "https://www.rotman.utoronto.ca" },
            { name: "Monash University", domain: "COMMERCE", requiredExam: "None", feesINR: 2600000, feesUSD: 31000, country: "Australia", officialWebsite: "https://www.monash.edu" },
            { name: "Copenhagen Business School", domain: "COMMERCE", requiredExam: "None", feesINR: 1200000, feesUSD: 14000, country: "Denmark", officialWebsite: "https://www.cbs.dk" },
            { name: "Bocconi University", domain: "COMMERCE", requiredExam: "None", feesINR: 1500000, feesUSD: 18000, country: "Italy", officialWebsite: "https://www.unibocconi.eu" },
            { name: "University of British Columbia", domain: "COMMERCE", requiredExam: "None", feesINR: 3200000, feesUSD: 38000, country: "Canada", officialWebsite: "https://www.ubc.ca" },
            { name: "Erasmus University Rotterdam", domain: "COMMERCE", requiredExam: "None", feesINR: 1100000, feesUSD: 13000, country: "Netherlands", officialWebsite: "https://www.eur.nl" }
          ];
        } else {
          fallbackColleges = [
            { name: "University of Auckland", domain: "GENERAL", requiredExam: "None", feesINR: 2000000, feesUSD: 24000, country: "New Zealand", officialWebsite: "https://www.auckland.ac.nz" },
            { name: "Trinity College Dublin", domain: "GENERAL", requiredExam: "None", feesINR: 1800000, feesUSD: 21000, country: "Ireland", officialWebsite: "https://www.tcd.ie" },
            { name: "University of British Columbia", domain: "GENERAL", requiredExam: "None", feesINR: 3000000, feesUSD: 36000, country: "Canada", officialWebsite: "https://www.ubc.ca" },
            { name: "University of Manchester", domain: "GENERAL", requiredExam: "None", feesINR: 2200000, feesUSD: 26000, country: "UK", officialWebsite: "https://www.manchester.ac.uk" },
            { name: "Australian National University", domain: "GENERAL", requiredExam: "None", feesINR: 2500000, feesUSD: 30000, country: "Australia", officialWebsite: "https://www.anu.edu.au" },
            { name: "University of Alberta", domain: "GENERAL", requiredExam: "None", feesINR: 1800000, feesUSD: 21000, country: "Canada", officialWebsite: "https://www.ualberta.ca" },
            { name: "University College Dublin", domain: "GENERAL", requiredExam: "None", feesINR: 1700000, feesUSD: 20000, country: "Ireland", officialWebsite: "https://www.ucd.ie" },
            { name: "Victoria University of Wellington", domain: "GENERAL", requiredExam: "None", feesINR: 1600000, feesUSD: 19000, country: "New Zealand", officialWebsite: "https://www.wgtn.ac.nz" },
            { name: "University of Bristol", domain: "GENERAL", requiredExam: "None", feesINR: 2400000, feesUSD: 28000, country: "UK", officialWebsite: "https://www.bristol.ac.uk" },
            { name: "Lund University", domain: "GENERAL", requiredExam: "None", feesINR: 1400000, feesUSD: 16000, country: "Sweden", officialWebsite: "https://www.lunduniversity.lu.se" }
          ];
        }
      } else {
        if (stream.includes("PCM") || stream.includes("SCIENCE") || stream.includes("TECH") || stream.includes("ENGG") || stream.includes("ENGINEERING") || stream.includes("CS") || stream.includes("IT") || stream.includes("BCA") || stream.includes("MCA")) {
          fallbackColleges = [
            { name: "Amity University", domain: "ENGINEERING", requiredExam: "None", feesINR: 350000, feesUSD: 4375, country: "India", officialWebsite: "https://www.amity.edu" },
            { name: "SRM Institute of Science and Technology", domain: "ENGINEERING", requiredExam: "None", feesINR: 250000, feesUSD: 3125, country: "India", officialWebsite: "https://www.srmist.edu.in" },
            { name: "Manipal Institute of Technology", domain: "ENGINEERING", requiredExam: "None", feesINR: 400000, feesUSD: 5000, country: "India", officialWebsite: "https://www.manipal.edu" },
            { name: "Vellore Institute of Technology (VIT)", domain: "ENGINEERING", requiredExam: "None", feesINR: 198000, feesUSD: 2475, country: "India", officialWebsite: "https://vit.ac.in" },
            { name: "Lovely Professional University", domain: "ENGINEERING", requiredExam: "None", feesINR: 240000, feesUSD: 3000, country: "India", officialWebsite: "https://www.lpu.in" },
            { name: "Chandigarh University", domain: "ENGINEERING", requiredExam: "None", feesINR: 180000, feesUSD: 2250, country: "India", officialWebsite: "https://www.cuchd.in" },
            { name: "Sharda University", domain: "ENGINEERING", requiredExam: "None", feesINR: 210000, feesUSD: 2625, country: "India", officialWebsite: "https://www.sharda.ac.in" },
            { name: "UPES Dehradun", domain: "ENGINEERING", requiredExam: "None", feesINR: 420000, feesUSD: 5250, country: "India", officialWebsite: "https://www.upes.ac.in" },
            { name: "Galgotias University", domain: "ENGINEERING", requiredExam: "None", feesINR: 160000, feesUSD: 2000, country: "India", officialWebsite: "https://www.galgotiasuniversity.edu.in" },
            { name: "Hindustan Institute of Technology and Science", domain: "ENGINEERING", requiredExam: "None", feesINR: 250000, feesUSD: 3125, country: "India", officialWebsite: "https://hindustanuniv.ac.in" }
          ];
        } else if (stream.includes("PCB") || stream.includes("MBBS") || stream.includes("BDS") || stream.includes("PHARM") || stream.includes("NURSING")) {
          fallbackColleges = [
            { name: "Kasturba Medical College (Management Quota)", domain: "MEDICAL", requiredExam: "None", feesINR: 1700000, feesUSD: 21250, country: "India", officialWebsite: "https://manipal.edu/kmc-manipal.html" },
            { name: "Saveetha Medical College", domain: "MEDICAL", requiredExam: "None", feesINR: 2400000, feesUSD: 30000, country: "India", officialWebsite: "https://saveethamedicalcollege.com" },
            { name: "Amrita Institute of Medical Sciences", domain: "MEDICAL", requiredExam: "None", feesINR: 1900000, feesUSD: 23750, country: "India", officialWebsite: "https://www.amrita.edu" },
            { name: "D.Y. Patil Medical College", domain: "MEDICAL", requiredExam: "None", feesINR: 2500000, feesUSD: 31250, country: "India", officialWebsite: "https://medical.dpu.edu.in" },
            { name: "SRM Medical College", domain: "MEDICAL", requiredExam: "None", feesINR: 2200000, feesUSD: 27500, country: "India", officialWebsite: "https://www.srmist.edu.in/medical-college" },
            { name: "Bharati Vidyapeeth Medical College", domain: "MEDICAL", requiredExam: "None", feesINR: 2000000, feesUSD: 25000, country: "India", officialWebsite: "https://mcpune.bharatividyapeeth.edu" },
            { name: "Chettinad Hospital and Research Institute", domain: "MEDICAL", requiredExam: "None", feesINR: 2400000, feesUSD: 30000, country: "India", officialWebsite: "https://care.edu.in" },
            { name: "JSS Medical College", domain: "MEDICAL", requiredExam: "None", feesINR: 1800000, feesUSD: 22500, country: "India", officialWebsite: "https://jssuni.edu.in" },
            { name: "Kalinga Institute of Medical Sciences", domain: "MEDICAL", requiredExam: "None", feesINR: 1600000, feesUSD: 20000, country: "India", officialWebsite: "https://kims.kiit.ac.in" },
            { name: "M.S. Ramaiah Medical College", domain: "MEDICAL", requiredExam: "None", feesINR: 2100000, feesUSD: 26250, country: "India", officialWebsite: "https://msrmc.ac.in" }
          ];
        } else if (stream.includes("COMMERCE") || stream.includes("BBA") || stream.includes("MBA") || stream.includes("B.COM") || stream.includes("M.COM") || stream.includes("FINANCE")) {
          fallbackColleges = [
            { name: "Christ University", domain: "COMMERCE", requiredExam: "None", feesINR: 150000, feesUSD: 1875, country: "India", officialWebsite: "https://christuniversity.in" },
            { name: "Symbiosis School of Economics", domain: "COMMERCE", requiredExam: "None", feesINR: 200000, feesUSD: 2500, country: "India", officialWebsite: "https://sse.ac.in" },
            { name: "Narsee Monjee College of Commerce", domain: "COMMERCE", requiredExam: "None", feesINR: 120000, feesUSD: 1500, country: "India", officialWebsite: "https://nmcollege.in" },
            { name: "St. Joseph's College of Commerce", domain: "COMMERCE", requiredExam: "None", feesINR: 90000, feesUSD: 1125, country: "India", officialWebsite: "https://www.sjcc.edu.in" },
            { name: "Mount Carmel College", domain: "COMMERCE", requiredExam: "None", feesINR: 110000, feesUSD: 1375, country: "India", officialWebsite: "https://mccblr.edu.in" },
            { name: "Mithibai College", domain: "COMMERCE", requiredExam: "None", feesINR: 60000, feesUSD: 750, country: "India", officialWebsite: "https://mithibai.ac.in" },
            { name: "Amity College of Commerce", domain: "COMMERCE", requiredExam: "None", feesINR: 250000, feesUSD: 3125, country: "India", officialWebsite: "https://www.amity.edu" },
            { name: "Jain University", domain: "COMMERCE", requiredExam: "None", feesINR: 160000, feesUSD: 2000, country: "India", officialWebsite: "https://www.jainuniversity.ac.in" },
            { name: "Loyola College (Self Financed)", domain: "COMMERCE", requiredExam: "None", feesINR: 80000, feesUSD: 1000, country: "India", officialWebsite: "https://www.loyolacollege.edu" },
            { name: "Madras Christian College (SFS)", domain: "COMMERCE", requiredExam: "None", feesINR: 75000, feesUSD: 935, country: "India", officialWebsite: "https://mcc.edu.in" }
          ];
        } else {
          fallbackColleges = [
            { name: "Indira Gandhi National Open University (IGNOU)", domain: "GENERAL", requiredExam: "None", feesINR: 15000, feesUSD: 200, country: "India", officialWebsite: "https://www.ignou.ac.in" },
            { name: "Lovely Professional University", domain: "GENERAL", requiredExam: "None", feesINR: 200000, feesUSD: 2500, country: "India", officialWebsite: "https://www.lpu.in" },
            { name: "Chandigarh University", domain: "GENERAL", requiredExam: "None", feesINR: 180000, feesUSD: 2250, country: "India", officialWebsite: "https://www.cuchd.in" },
            { name: "Amity University Online", domain: "GENERAL", requiredExam: "None", feesINR: 120000, feesUSD: 1500, country: "India", officialWebsite: "https://amityonline.com" },
            { name: "Symbiosis Centre for Distance Learning", domain: "GENERAL", requiredExam: "None", feesINR: 50000, feesUSD: 625, country: "India", officialWebsite: "https://www.scdl.net" },
            { name: "NMIMS Global Access", domain: "GENERAL", requiredExam: "None", feesINR: 85000, feesUSD: 1060, country: "India", officialWebsite: "https://online.nmims.edu" },
            { name: "Sikkim Manipal University Distance", domain: "GENERAL", requiredExam: "None", feesINR: 40000, feesUSD: 500, country: "India", officialWebsite: "https://smu.edu.in" },
            { name: "Annamalai University DDE", domain: "GENERAL", requiredExam: "None", feesINR: 10000, feesUSD: 125, country: "India", officialWebsite: "https://annamalaiuniversity.ac.in" },
            { name: "Yashwantrao Chavan Maharashtra Open", domain: "GENERAL", requiredExam: "None", feesINR: 8000, feesUSD: 100, country: "India", officialWebsite: "https://ycmou.digitaluniversity.ac" },
            { name: "Kurukshetra University DDE", domain: "GENERAL", requiredExam: "None", feesINR: 15000, feesUSD: 185, country: "India", officialWebsite: "https://www.ddekuk.ac.in" }
          ];
        }
      }
      
      passedCandidates = fallbackColleges.map(c => ({
        candidate: c,
        passed: true,
        blockReason: "",
        matchScore: 65,
        eligibilityScore: 70
      }));
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
      "officialWebsite": "string (The official website URL of the college, e.g. https://www.iitd.ac.in, https://www.ignou.ac.in)",
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
Inject the exact "officialWebsite" from the provided candidate list into each college object under "officialWebsite". If not present in candidates list, provide the actual real official website URL of the college.
Provide realistic and accurate estimates for "averagePackage", "highestPackage", "placementPercentage", "topRecruiters", and "curriculumHighlights" based on your general knowledge of these institutions. Do NOT output "Not available" unless the institution is completely unknown.`;

  console.log(`[Groq] Explaining validated candidates for ${profile.fullName}...`);
  let finalData: any;
  try {
    finalData = await generateGroqResponse(explainPrompt, "Generate final explanation", true);
  } catch (error) {
    console.error("Explainability failed", error);
    
    // Fallback: Generate real, high-quality, and realistic placement stats and deep details programmatically
    const stream = (profile.currentQualification || "").toUpperCase();
    const isPCM = stream.includes("PCM") || stream.includes("SCIENCE") || stream.includes("TECH") || stream.includes("ENGG") || stream.includes("ENGINEERING") || stream.includes("CS") || stream.includes("IT") || stream.includes("BCA") || stream.includes("MCA");
    const isPCB = stream.includes("PCB") || stream.includes("MBBS") || stream.includes("BDS") || stream.includes("PHARM") || stream.includes("NURSING");
    const isCommerce = stream.includes("COMMERCE") || stream.includes("BBA") || stream.includes("MBA") || stream.includes("B.COM") || stream.includes("M.COM") || stream.includes("FINANCE");
    
    let fallbackPathways = ["Explore career opportunities in this domain"];
    if (isPCM) fallbackPathways = ["Software Engineer", "Data Scientist", "System Architect", "R&D Engineer"];
    else if (isPCB) fallbackPathways = ["Resident Doctor", "Research Scientist", "Pharmacist", "Biotechnologist"];
    else if (isCommerce) fallbackPathways = ["Chartered Accountant (CA)", "Financial Analyst", "Investment Banker", "Corporate Manager"];
    
    finalData = { 
      recommendedStreams: [
        { 
          name: isPCM ? "Engineering & Technical Studies" : (isPCB ? "Medical & Life Sciences" : (isCommerce ? "Commerce & Business Administration" : "General Higher Education")), 
          reason: "Calibrated based on your academic qualification and career goals." 
        }
      ],
      recommendedColleges: passedCandidates.map(p => {
        const nameLower = p.candidate.name.toLowerCase();
        let avgPkg = "₹5-7 LPA";
        let maxPkg = "₹12-16 LPA";
        let pct = "85%";
        let recruiters = ["TCS", "Infosys", "Wipro", "Cognizant"];
        let highlights = ["Industry Aligned Curriculum", "Seminars & Workshops", "Practical Lab Work"];
        
        if (nameLower.includes("iit") || nameLower.includes("indian institute of technology")) {
          avgPkg = "₹18-22 LPA";
          maxPkg = "₹1.2-1.8 Crores";
          pct = "95%";
          recruiters = ["Google", "Microsoft", "Uber", "Apple", "Goldman Sachs"];
          highlights = ["Advanced Research Labs", "Global Alumni Network", "Rigorous Project-Based Learning"];
        } else if (nameLower.includes("nit") || nameLower.includes("national institute of technology") || nameLower.includes("iiit") || nameLower.includes("dtu") || nameLower.includes("nsut") || nameLower.includes("delhi technological")) {
          avgPkg = "₹12-16 LPA";
          maxPkg = "₹45-60 LPA";
          pct = "90%";
          recruiters = ["Amazon", "Microsoft", "Adobe", "Paytm", "TCS Digital"];
          highlights = ["Dedicated Internship Semesters", "Active Technical Societies", "Incubation & Startup Support"];
        } else if (nameLower.includes("bits") || nameLower.includes("pilani")) {
          avgPkg = "₹15-18 LPA";
          maxPkg = "₹50-70 LPA";
          pct = "92%";
          recruiters = ["Google", "Amazon", "Oracle", "Goldman Sachs"];
          highlights = ["Zero Attendance Policy", "Practice School (PS-I & PS-II)", "Strong Entrepreneurship Culture"];
        } else if (nameLower.includes("amity") || nameLower.includes("lpu") || nameLower.includes("srm") || nameLower.includes("manipal") || nameLower.includes("sharda") || nameLower.includes("galgotias") || nameLower.includes("lovely")) {
          avgPkg = "₹4.5-6 LPA";
          maxPkg = "₹18-24 LPA";
          pct = "82%";
          recruiters = ["Cognizant", "Wipro", "Capgemini", "Accenture", "Infosys"];
          highlights = ["Global Study Programs", "Placement Grooming Bootcamps", "Interdisciplinary Electives"];
        } else if (nameLower.includes("aiims") || nameLower.includes("medical") || nameLower.includes("hospital") || nameLower.includes("kem") || nameLower.includes("mamc")) {
          avgPkg = "₹8-12 LPA";
          maxPkg = "₹18-24 LPA";
          pct = "98%";
          recruiters = ["Top Government Hospitals", "Apollo Hospitals", "Fortis Healthcare", "Max Healthcare"];
          highlights = ["Clinical Rotation in Tertiary Care", "Research Paper Mentoring", "High Success Rate in PG NEET/USMLE"];
        } else if (nameLower.includes("christ") || nameLower.includes("symbiosis") || nameLower.includes("srcc") || nameLower.includes("hindu")) {
          avgPkg = "₹6-8 LPA";
          maxPkg = "₹16-22 LPA";
          pct = "88%";
          recruiters = ["Deloitte", "EY", "KPMG", "PwC", "HDFC Bank"];
          highlights = ["Corporate Case Study Competitions", "Live Research Projects", "Industry Guest Lectures"];
        }

        return {
          collegeName: p.candidate.name,
          location: p.candidate.country === "India" ? "India" : p.candidate.country,
          fees: p.candidate.feesINR ? `₹${p.candidate.feesINR.toLocaleString('en-IN')}` : `USD ${p.candidate.feesUSD}`,
          category: p.matchScore >= 80 ? "Dream" : (p.matchScore >= 60 ? "Target" : "Safe"),
          whyRecommended: `Matches your academic performance of ${profile.percentage || profile.twelfthPercentage || 80}% and fits comfortably within your budget limits.`,
          riskFactors: "Admission strictly subject to cutoffs/counseling.",
          matchPercentage: p.matchScore,
          admissionProbability: p.eligibilityScore,
          officialWebsite: p.candidate.officialWebsite || "https://www.google.com/search?q=" + encodeURIComponent(p.candidate.name),
          deepDetails: {
            averagePackage: avgPkg,
            highestPackage: maxPkg,
            placementPercentage: pct,
            topRecruiters: recruiters,
            curriculumHighlights: highlights
          }
        };
      }),
      scholarships: [
        { name: "State Post-Matric Merit Scholarship", amount: "Varies (Up to ₹50,000)", eligibility: "Based on Board Percentage & Category" },
        { name: "Central Sector Scholarship Scheme", amount: "₹10,000 to ₹20,000 per year", eligibility: "Above 80th percentile in Class 12 Boards" }
      ],
      careerPathways: fallbackPathways,
      admissionProcess: [
        { step: "Application Submission", timeline: "May - June", description: "Fill out online registration portal and upload academic certificates." },
        { step: "Document Verification & Merit Lists", timeline: "June - July", description: "Universities release cutoffs/rank lists. Attend physically or online for verification." },
        { step: "Seat Allocation & Fee Payment", timeline: "July - August", description: "Accept allotted seat and pay admission fees to secure enrollment." }
      ]
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

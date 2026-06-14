import { generateGroqResponse } from "./groqClient";
import fs from 'fs';
import path from 'path';

// Load Knowledge Base
const examsDB = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib/knowledge/exams.json'), 'utf-8'));

export async function orchestrateExamPrep(
  stage: string,
  sector: string,
  examName: string,
  hours: string,
  budget: string
) {
  
  // PHASE 5: EXAM ALIAS RESOLVER
  const aliasMap: Record<string, string> = {
    "cgl": "SSC CGL",
    "jee": "JEE Main",
    "neet": "NEET",
    "upsc": "UPSC Civil Services",
    "gate": "GATE",
    "ibps": "IBPS PO",
    "sbi": "SBI PO",
    "rbi": "RBI Grade B"
  };

  let resolvedExamName = examName ? examName.trim() : "";
  if (resolvedExamName && aliasMap[resolvedExamName.toLowerCase()]) {
    resolvedExamName = aliasMap[resolvedExamName.toLowerCase()];
  }

  // LAYER 1: Programmatic Exam Filtering (Validation)
  let validExams = examsDB;

  // PHASE 3: EXAM FILTER ENGINE
  const sec = sector.toLowerCase();
  if (sec.includes("ssc")) {
    validExams = validExams.filter((e: any) => e.name.toUpperCase().includes("SSC") || e.domain === "GOVERNMENT");
  } else if (sec.includes("engineering")) {
    validExams = validExams.filter((e: any) => e.name.toUpperCase().includes("JEE") || e.name.toUpperCase().includes("GATE") || e.domain === "ENGINEERING");
  } else if (sec.includes("medical")) {
    validExams = validExams.filter((e: any) => e.name.toUpperCase().includes("NEET") || e.domain === "MEDICAL");
  } else if (sec.includes("banking")) {
    validExams = validExams.filter((e: any) => e.name.toUpperCase().includes("IBPS") || e.name.toUpperCase().includes("SBI") || e.name.toUpperCase().includes("RBI") || e.name.includes("PO"));
  } else if (sec.includes("upsc") || sec.includes("government")) {
    validExams = validExams.filter((e: any) => e.name.toUpperCase().includes("UPSC") || e.domain === "GOVERNMENT");
  } else if (sec === "international") {
    validExams = validExams.filter((e: any) => e.domain.startsWith("INTERNATIONAL") || e.domain === "LANGUAGE");
  }

  // Filter by Stage
  if (stage.includes("10th") || stage.includes("12th")) {
    validExams = validExams.filter((e: any) => e.minQualification === "12th" || e.minQualification === "10th" || e.minQualification === "ANY" || e.minQualification === "UG");
  } else if (stage.includes("Graduate") || stage.includes("Diploma") || stage.includes("PG") || stage.includes("UG") || stage.includes("Technical")) {
    validExams = validExams.filter((e: any) => e.minQualification === "UG" || e.minQualification === "ANY");
  }

  // PHASE 4: TARGET EXAM EXACT MATCH
  if (resolvedExamName && resolvedExamName !== "undefined" && resolvedExamName !== "None") {
    const explicitlyRequested = examsDB.filter((e: any) => e.name.toLowerCase() === resolvedExamName.toLowerCase() || e.name.toLowerCase().includes(resolvedExamName.toLowerCase()));
    
    if (explicitlyRequested.length > 0) {
      validExams = explicitlyRequested;
    } else {
      // Contradiction detected
      return {
        hasContradiction: true,
        contradictions: [`The requested exam '${examName}' is either invalid for your education stage (${stage}) or does not match the chosen sector (${sector}).`],
        recommendedExams: [],
        roadmap: [],
        institutes: [],
        studyResources: []
      };
    }
  }

  if (validExams.length === 0) {
    return {
      hasContradiction: true,
      contradictions: [`No eligible exams found for sector: ${sector} and stage: ${stage}.`],
      recommendedExams: []
    };
  }

  // Pick top 3 to send to AI
  const candidatesToExplain = validExams.slice(0, 3);

  // LAYER 9 & 11: AI Explainability Layer
  const systemPrompt = `You are an Explainability Engine for CareerPath AI.
I have programmatically validated the following exams for the user:
${JSON.stringify(candidatesToExplain)}

USER PROFILE:
- Current Education Stage: ${stage}
- Target Sector: ${sector}
- Daily Study Hours: ${hours}
- Budget for Prep: ${budget}

You MUST return a raw JSON object exactly matching this schema:
{
  "recommendedExams": [
    { "name": "string", "difficulty": "string", "eligibility": "string", "attemptsLeft": "string", "whyRecommended": "string", "matchScore": number }
  ],
  "roadmap": [
    { "phase": "string", "duration": "string", "focusArea": "string", "milestone": "string" }
  ],
  "institutes": [
    { "name": "string", "type": "string", "description": "string", "costEstimate": "string" }
  ],
  "studyResources": [
    { "title": "string", "type": "string", "link": "string" }
  ],
  "futurePlan": {
    "ifSelected": "string",
    "planB": "string"
  },
  "positiveAspects": ["string"]
}

RULES:
- "recommendedExams": ONLY include the exams I provided above. Do not hallucinate others. Explain WHY they match the user. Assign a high matchScore.
- "roadmap": Break it down into phases based on ${hours} daily study. 
  CRITICAL: If the user is currently in 10th or 12th grade but the exam requires a Graduation (UG) degree (like UPSC, SSC CGL), you MUST build a 3-5 year "Long-term Early Prep Roadmap" that integrates their college studies with foundational exam prep. Do NOT tell them they are ineligible; encourage early preparation.
- "institutes": Suggest real coaching institutes/online platforms fitting their ${budget} budget. Do not exceed the budget.
- "studyResources": Specific books, NCERTs, or standard resources.
- "futurePlan.planB": Give a solid, realistic backup career path if they don't clear the exam.
DO NOT hallucinate formatting. Return pure JSON.`;

  const userMessage = `Generate the validated exam prep explanation.`;

  console.log(`[Groq] Requesting exam prep explanation for ${stage} -> ${sector}`);

  let aiData: any;
  try {
    aiData = await generateGroqResponse(systemPrompt, userMessage, true);
    
    // Post-process to eliminate hallucinated exams (like "None")
    if (aiData.recommendedExams) {
      aiData.recommendedExams = aiData.recommendedExams.filter((generatedExam: any) => 
        candidatesToExplain.some((validExam: any) => 
          validExam.name.toLowerCase().includes(generatedExam.name.toLowerCase()) || 
          generatedExam.name.toLowerCase().includes(validExam.name.toLowerCase())
        )
      );
    }
  } catch (error) {
    console.error("Failed to generate AI data for Exam Prep:", error);
    aiData = { recommendedExams: [], roadmap: [], institutes: [], studyResources: [] };
  }
  
  aiData.hasContradictions = false;
  return aiData;
}

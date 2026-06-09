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
  
  // LAYER 1: Programmatic Exam Filtering (Validation)
  let validExams = examsDB;

  // Filter by sector/domain
  if (sector === "Engineering") {
    validExams = validExams.filter((e: any) => e.domain === "ENGINEERING");
  } else if (sector === "Medical") {
    validExams = validExams.filter((e: any) => e.domain === "MEDICAL");
  } else if (sector === "Government/UPSC") {
    validExams = validExams.filter((e: any) => e.domain === "GOVERNMENT");
  } else if (sector === "International") {
    validExams = validExams.filter((e: any) => e.domain.startsWith("INTERNATIONAL") || e.domain === "LANGUAGE");
  } else if (sector === "Banking") {
    validExams = validExams.filter((e: any) => e.name.includes("PO") || e.name.includes("Clerk"));
  }

  // Filter by Stage
  if (stage === "12th") {
    validExams = validExams.filter((e: any) => e.minQualification === "12th" || e.minQualification === "10th" || e.minQualification === "ANY");
  } else if (stage === "Graduate") {
    validExams = validExams.filter((e: any) => e.minQualification === "UG" || e.minQualification === "ANY");
  }

  // If user requested a specific exam, filter to that if it's in the valid list
  if (examName && examName !== "undefined" && examName.trim() !== "") {
    const explicitlyRequested = validExams.filter((e: any) => e.name.toLowerCase().includes(examName.toLowerCase()));
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
- "institutes": Suggest real coaching institutes/online platforms fitting their ${budget} budget. Do not exceed the budget.
- "studyResources": Specific books, NCERTs, or standard resources.
- "futurePlan.planB": Give a solid, realistic backup career path if they don't clear the exam.
DO NOT hallucinate formatting. Return pure JSON.`;

  const userMessage = `Generate the validated exam prep explanation.`;

  console.log(`[Groq] Requesting exam prep explanation for ${stage} -> ${sector}`);

  let aiData: any;
  try {
    aiData = await generateGroqResponse(systemPrompt, userMessage, true);
  } catch (error) {
    console.error("Failed to generate AI data for Exam Prep:", error);
    aiData = { recommendedExams: [], roadmap: [], institutes: [], studyResources: [] };
  }
  
  aiData.hasContradictions = false;
  return aiData;
}

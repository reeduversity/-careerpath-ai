import { generateGroqResponse } from "./groqClient";

export async function orchestrateExamPrep(
  stage: string,
  sector: string,
  examName: string,
  hours: string,
  budget: string
) {
  const systemPrompt = `You are an elite Government & Global Exam Mentor for CareerPath AI.
Your job is to generate a comprehensive, advanced roadmap for a student who wants to clear a competitive exam.

USER PROFILE:
- Current Education Stage: ${stage}
- Target Sector: ${sector}
- Target Exam: ${examName || 'Recommend one based on sector'}
- Daily Study Hours: ${hours}
- Budget for Prep: ${budget}

You MUST return a raw JSON object exactly matching this schema:
{
  "recommendedExams": [
    { "name": "string", "difficulty": "string", "eligibility": "string", "attemptsLeft": "string" }
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
- "recommendedExams": List 2-3 exams fitting the user's stage and sector. Be precise.
- "roadmap": Break it down into phases (e.g., Foundation, Core Syllabus, Mock Tests, Interview).
- "institutes": Suggest real coaching institutes/online platforms fitting their budget.
- "studyResources": Specific books, NCERTs, or standard resources.
- "futurePlan.planB": Give a solid, realistic backup career path if they don't clear the exam.
- "positiveAspects": Motivating benefits of cracking these exams.
DO NOT hallucinate formatting. Return pure JSON.`;

  const userMessage = `Create the exam prep roadmap for a ${stage} student targeting ${sector}.`;

  console.log(`[Groq] Requesting exam prep roadmap for ${stage} -> ${sector}`);

  let aiData: any;
  try {
    aiData = await generateGroqResponse(systemPrompt, userMessage, true);
  } catch (error) {
    console.error("Failed to generate AI data for Exam Prep:", error);
    aiData = {
      recommendedExams: [],
      roadmap: [],
      institutes: [],
      studyResources: [],
      futurePlan: { ifSelected: "N/A", planB: "N/A" },
      positiveAspects: []
    };
  }

  return aiData;
}

import { PrismaClient } from "@prisma/client";
import { analyzeSkillGap } from "./skillGapAnalyzer";
import { generateGroqResponse } from "./groqClient";

const prisma = new PrismaClient();

export async function orchestrateCareerPlan(
  resumeProfileId: string, 
  careerRoleId: string,
  jobInterest?: string,
  examName?: string,
  profileType?: string
) {
  // Step 1: Fetch Career Role (or fallback to raw string if UUID not provided/found)
  let careerRoleTitle = careerRoleId; // Assume it's a raw string initially
  try {
    const careerRole = await prisma.careerRole.findUnique({
      where: { id: careerRoleId }
    });
    if (careerRole) {
      careerRoleTitle = careerRole.title;
    }
  } catch (e) {
    // If Prisma fails (e.g. invalid UUID format because it's a raw string), we fallback to the string
    console.log(`Fallback: Using raw string '${careerRoleId}' as career role title.`);
  }

  if (!careerRoleTitle || careerRoleTitle.trim() === "") {
    careerRoleTitle = "Software Engineer"; // Ultimate fallback
  }

  // Step 2: Run Skill Gap Engine
  // This calculates existing and missing skills dynamically
  const skillGap = await analyzeSkillGap(resumeProfileId, careerRoleTitle);

  const existingSkills = skillGap.existingSkills || [];
  const missingSkills = skillGap.missingSkills || [];

  // Step 3: Generate dynamic frameworks via Groq AI
  const systemPrompt = `You are an elite Omni-Career Guidance AI for CareerPath AI.
Your job is to generate a massive, personalized career transformation plan for a user aiming for "${careerRoleTitle}".
They currently have the following skills: ${existingSkills.join(", ")}.
${missingSkills.length > 0 ? `They are known to be missing: ${missingSkills.join(", ")}` : 'Analyze their existing skills against the target role and infer what critical skills they are missing.'}

USER PREFERENCES:
- Job Interest: ${jobInterest || 'Both Private and Government'}
- Profile Type: ${profileType || 'Mixed'}
- Target Exam (if any): ${examName || 'None'}

You MUST return a raw JSON object exactly matching this schema:
{
  "inferredMissingSkills": ["string"],
  "atsScore": 0,
  "resumeFeedback": "string",
  "privateJobPath": {
    "roles": ["string"],
    "salaryEstimate": "string",
    "topCompanies": ["string"]
  },
  "netflixLearningPath": {
    "series": [
      { "title": "string", "episodes": ["string"] }
    ]
  },
  "readinessScore": {
    "score": 0,
    "weakAreas": ["string"],
    "improvementPlan": "string"
  },
  "gamification": {
    "xp": 0,
    "badges": ["string"]
  },
  "marketIntelligence": {
    "trendingSkills": ["string"],
    "futureDemand": "string"
  },
  "certifications": ["string"],
  "projects": ["string"],
  "roadmap": [
    { "stage": "string", "focus": "string", "details": "string" }
  ]
}

RULES:
- "inferredMissingSkills": If the missing skills provided are empty, infer exactly what is missing based on their existing skills and the target role.
- "atsScore": 0-100 score based strictly on missing vs existing skills.
- "resumeFeedback": Critical feedback to increase ATS score.
- "privateJobPath": Suggest realistic private jobs, salary in ₹ and $, and top companies hiring.
- "netflixLearningPath": Create a 3-4 series "Binge Learning" plan (Beginner, Intermediate, Advanced) with specific episodes.
- "readinessScore": Job/Interview readiness score out of 100.
- "gamification": Award XP points (e.g. 500 XP) and badges (e.g. "Govt Aspirant", "Tech Ninja").
- "roadmap": 0-3 months, 3-6 months, 6-12 months.
- "certifications": Real, 100% genuine certifications. Do NOT hallucinate.`;

  const userMessage = `Generate the career plan and ATS score for a ${careerRoleTitle} with ${profileType || 'General'} profile. Existing skills: ${existingSkills.join(", ")}. Known missing skills: ${missingSkills.join(", ")}.`;
  
  console.log(`[Groq] Requesting orchestration for ${careerRoleTitle} with profileType: ${profileType}`);
  
  let aiData: any;
  try {
    aiData = await generateGroqResponse(systemPrompt, userMessage, true);
  } catch (error) {
    console.error("Failed to generate AI data, falling back to empty structures:", error);
    aiData = {
      inferredMissingSkills: ["Relevant core skills for " + careerRoleTitle],
      atsScore: 40,
      resumeFeedback: "We could not generate detailed feedback at this time. Please try again later.",
      privateJobPath: { roles: [], salaryEstimate: "N/A", topCompanies: [] },
      netflixLearningPath: { series: [] },
      readinessScore: { score: 40, weakAreas: [], improvementPlan: "Review skills" },
      gamification: { xp: 100, badges: ["Beginner"] },
      marketIntelligence: { trendingSkills: [], futureDemand: "Unknown" },
      certifications: [],
      projects: [],
      roadmap: []
    };
  }

  // Step 5: Merge all outputs into one response
  const finalMissingSkills = missingSkills.length > 0 ? missingSkills : (aiData.inferredMissingSkills || []);

  return {
    careerRole: careerRoleTitle,
    skillGap: {
      existingSkills: existingSkills,
      missingSkills: finalMissingSkills
    },
    learningPath: aiData.netflixLearningPath?.series || [],
    certifications: aiData.certifications || [],
    projects: aiData.projects || [],
    jobRoles: aiData.privateJobPath?.roles || [],
    salaryRange: aiData.privateJobPath?.salaryEstimate || "Not available",
    roadmap: aiData.roadmap || [],
    atsScore: aiData.atsScore || 40,
    resumeFeedback: aiData.resumeFeedback || "Your resume needs more keywords related to the target role.",
    omniData: {
      privateJobPath: aiData.privateJobPath || { roles: [], salaryEstimate: "N/A", topCompanies: [] },
      netflixLearningPath: aiData.netflixLearningPath || { series: [] },
      readinessScore: aiData.readinessScore || { score: 40, weakAreas: [], improvementPlan: "N/A" },
      gamification: aiData.gamification || { xp: 100, badges: [] },
      marketIntelligence: aiData.marketIntelligence || { trendingSkills: [], futureDemand: "N/A" }
    }
  };
}

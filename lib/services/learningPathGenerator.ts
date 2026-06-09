
import { analyzeSkillGap } from "./skillGapAnalyzer";

import { prisma } from "@/lib/prisma";

export async function generateLearningPath(resumeProfileId: string, careerRoleId: string) {
  // Step 1: Fetch CareerRole
  const careerRole = await prisma.careerRole.findUnique({
    where: { id: careerRoleId },
    include: {
      requirements: {
        include: { skillMaster: true }
      }
    }
  });

  if (!careerRole) {
    throw new Error("Career role not found");
  }

  // Step 2: Fetch required skills
  if (!careerRole.requirements || careerRole.requirements.length === 0) {
    return { message: "No learning data available" };
  }

  // Step 3: Run SkillGapAnalyzer
  // Note: analyzeSkillGap currently expects the role title string as its second argument based on our Phase 10 logic.
  const gapAnalysis = await analyzeSkillGap(resumeProfileId, careerRole.title);

  if (gapAnalysis.missingSkills.length === 0) {
    return {
      message: "No learning data available",
      careerRole: careerRole.title,
      missingSkills: []
    };
  }

  // Step 4: Generate structured learning stages framework for each missing skill using Groq AI
  const { generateGroqResponse } = require("./groqClient");
  
  const systemPrompt = `You are an elite Career Pathway Generator. For each missing skill/subject in the provided list, create a learning path.
If the role is an academic/government exam (e.g., NEET, UPSC, CAT), provide syllabus modules (e.g., Physics/Chemistry/Bio for NEET).
If the role involves International Exams:
- GRE: Provide Quant, Verbal, AWA roadmap.
- GMAT: Provide Quant, Verbal, Data Insights roadmap.
- IELTS/TOEFL/PTE: Provide rigorous English Language preparation roadmap (Reading, Writing, Listening, Speaking).
If it is a technical role (e.g. Software Engineer), provide technical milestones.
Return a JSON array of objects exactly like this:
[
  {
    "skill": "skill_name_here",
    "beginner": ["milestone 1", "milestone 2"],
    "intermediate": ["milestone 1", "milestone 2"],
    "advanced": ["milestone 1", "milestone 2"]
  }
]`;

  let learningPath;
  try {
    learningPath = await generateGroqResponse(
      systemPrompt, 
      `Role: ${careerRole.title}. Missing Skills/Subjects: ${gapAnalysis.missingSkills.join(", ")}`, 
      true
    );
  } catch (error) {
    console.error("Failed to generate AI learning path, using fallbacks:", error);
    learningPath = gapAnalysis.missingSkills.map((skill: string) => {
      return {
        skill,
        beginner: [`${skill} fundamentals`],
        intermediate: [`${skill} intermediate concepts`],
        advanced: [`${skill} advanced application`]
      };
    });
  }

  return {
    careerRole: careerRole.title,
    missingSkills: gapAnalysis.missingSkills,
    learningPath
  };
}

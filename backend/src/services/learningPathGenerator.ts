import { PrismaClient } from "@prisma/client";
import { analyzeSkillGap } from "./skillGapAnalyzer";

const prisma = new PrismaClient();

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

  // Step 4: Generate structured learning stages framework for each missing skill
  const learningPath = gapAnalysis.missingSkills.map((skill: string) => {
    return {
      skill,
      beginner: [`${skill} fundamentals placeholder`],
      intermediate: [`${skill} projects placeholder`],
      advanced: [`${skill} real-world system placeholder`]
    };
  });

  return {
    careerRole: careerRole.title,
    missingSkills: gapAnalysis.missingSkills,
    learningPath
  };
}

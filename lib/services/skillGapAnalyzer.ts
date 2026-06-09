import { prisma } from "@/lib/prisma";

export async function analyzeSkillGap(resumeProfileId: string, careerGoal: string) {
  // 1. Fetch ResumeAnalysis
  const resumeAnalysis = await prisma.resumeAnalysis.findUnique({
    where: { resumeProfileId }
  });

  if (!resumeAnalysis) {
    throw new Error("Resume analysis not found");
  }

  const existingSkillsRaw = (resumeAnalysis.skills as string[]) || [];
  const technicalSkillsRaw = (resumeAnalysis.technicalSkills as string[]) || [];
  
  // Normalize existing skills to lowercase for comparison
  const combinedExisting = [...existingSkillsRaw, ...technicalSkillsRaw];
  const existingSkillsSet = new Set(combinedExisting.map(s => s.toLowerCase().trim()));

  // 2. Read CareerPathRequirement dynamically from database
  const requirements = await prisma.careerPathRequirement.findMany({
    where: { careerRole: { title: careerGoal } },
    include: { skillMaster: true }
  });

  // If no requirements exist in database (NO FALLBACK LISTS rule)
  if (requirements.length === 0) {
    return {
      message: "No career requirements configured",
      existingSkills: combinedExisting,
      requiredSkills: [],
      missingSkills: [],
      readinessPercentage: 0
    };
  }

  const requiredSkillsRaw = requirements.map(req => req.skillMaster.name);
  const requiredSkills = [];
  const missingSkills = [];
  let matchCount = 0;

  for (const reqSkill of requiredSkillsRaw) {
    requiredSkills.push(reqSkill);
    if (existingSkillsSet.has(reqSkill.toLowerCase().trim())) {
      matchCount++;
    } else {
      missingSkills.push(reqSkill);
    }
  }

  const readinessPercentage = Math.round((matchCount / requiredSkills.length) * 100);

  // Store results in database
  const savedAnalysis = await prisma.skillGapAnalysis.upsert({
    where: { resumeProfileId },
    update: {
      careerGoal,
      existingSkills: combinedExisting,
      requiredSkills,
      missingSkills,
      readinessPercentage
    },
    create: {
      resumeProfileId,
      careerGoal,
      existingSkills: combinedExisting,
      requiredSkills,
      missingSkills,
      readinessPercentage
    }
  });

  // Update SkillGapDetails
  await prisma.skillGapDetail.deleteMany({
    where: { skillGapAnalysisId: savedAnalysis.id }
  });

  const detailCreates = requirements.map(req => {
    const isMissing = !existingSkillsSet.has(req.skillMaster.name.toLowerCase().trim());
    return {
      skillGapAnalysisId: savedAnalysis.id,
      skillMasterId: req.skillMaster.id,
      status: isMissing ? "Missing" : "Existing"
    };
  });

  if (detailCreates.length > 0) {
    await prisma.skillGapDetail.createMany({
      data: detailCreates
    });
  }

  return {
    existingSkills: combinedExisting,
    requiredSkills,
    missingSkills,
    readinessPercentage
  };
}

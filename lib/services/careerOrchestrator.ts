import { analyzeSkillGap } from "./skillGapAnalyzer";
import { generateGroqResponse } from "./groqClient";

import { prisma } from "@/lib/prisma";

export async function orchestrateCareerPlan(
  resumeProfileId: string, 
  careerRoleId: string,
  jobInterest?: string,
  examName?: string,
  profileType?: string,
  jobSeekerProfileId?: string
) {
  // Step 1: Fetch Career Role
  let careerRoleTitle = careerRoleId; 
  try {
    const careerRole = await prisma.careerRole.findUnique({
      where: { id: careerRoleId }
    });
    if (careerRole) {
      careerRoleTitle = careerRole.title;
    }
  } catch (e) {
    console.log(`Fallback: Using raw string '${careerRoleId}' as career role title.`);
  }

  if (!careerRoleTitle || careerRoleTitle.trim() === "" || careerRoleTitle === "undefined") {
    careerRoleTitle = "Software Engineer"; 
  }

  // Step 1.5: Fetch JobSeekerProfile if available
  let jobPreferences = "";
  let isInternational = false;
  let userExperienceLevel = "Unknown";
  if (jobSeekerProfileId) {
    try {
      const seeker = await prisma.jobSeekerProfile.findUnique({
        where: { id: jobSeekerProfileId }
      });
      if (seeker) {
        isInternational = seeker.jobSearchType === "international";
        userExperienceLevel = seeker.experienceLevel || "Unknown";
        jobPreferences = `
- Job Search Type: ${seeker.jobSearchType?.toUpperCase()}
- Preferred Location/Country: ${seeker.preferredLocation} ${seeker.preferredCountry ? `(${seeker.preferredCountry})` : ''}
- Salary Expectation: ${seeker.salaryExpectation}
- Experience Level: ${seeker.experienceLevel}
- Work Preference: ${seeker.workPreference}
`;
      }
    } catch (err) {
      console.log("Failed to fetch job seeker profile:", err);
    }
  }

  // Step 2: Run Skill Gap Engine
  const skillGap = await analyzeSkillGap(resumeProfileId, careerRoleTitle);

  const existingSkills = skillGap.existingSkills || [];
  const missingSkills = skillGap.missingSkills || [];

  const isGov = (jobInterest || "").toLowerCase().includes("government") || (examName || "").match(/upsc|ssc|banking|ibps|sbi|railway|psc|nda|cds/i);
  let targetSectorRule = isGov ? 
    `USER IS A GOVERNMENT JOB ASPIRANT. STRICTLY suggest government jobs (UPSC, SSC CGL/CHSL, Banking IBPS/SBI, Railway, State PSC, Defence) under "privateJobPath". DO NOT suggest private corporate roles. Salaries must reflect Indian Government Pay Scales (e.g. 7th CPC).` :
    `USER IS A PRIVATE SECTOR ASPIRANT. Suggest private jobs, top multinational companies, and market-standard salaries.`;

  if (!isGov && isInternational) {
    targetSectorRule += ` Salary estimates MUST be given in the local currency of their preferred country (e.g. USD for USA, GBP for UK). Ensure roles and companies are internationally relevant.`;
  } else if (!isGov && !isInternational) {
    targetSectorRule += ` Salary estimates MUST be given in INR (e.g. LPA). Ensure roles and companies are relevant to the domestic market.`;
  }

  const systemPrompt = `You are an elite Omni-Career Guidance AI for CareerPath AI.
Your job is to generate a massive, personalized career transformation plan for a user aiming for "${careerRoleTitle}".
They currently have the following skills: ${existingSkills.join(", ")}.
${missingSkills.length > 0 ? `They are known to be missing: ${missingSkills.join(", ")}` : 'Analyze their existing skills against the target role and infer what critical skills they are missing.'}

USER PREFERENCES:
- Job Interest: ${jobInterest || 'Both Private and Government'}
- Profile Type: ${profileType || 'Mixed'}
- Target Exam (if any): ${examName || 'None'}
${jobPreferences}

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
  "certifications": [
    { "name": "string", "url": "string" }
  ],
  "projects": ["string"],
  "roadmap": [
    { "stage": "string", "focus": "string", "details": "string" }
  ]
}

RULES:
- ${targetSectorRule}
- STRICT EXPERIENCE MATCHING: The user has an experience level of ${userExperienceLevel}. You MUST tailor all your advice strictly to this level. NEVER address an experienced professional as a fresher or recent graduate, and vice versa. Adjust your tone, roadmap complexity, and resume feedback to match their exact seniority.
- "inferredMissingSkills": If the missing skills provided are empty, infer EXACTLY what real-world, highly demanded skills are missing based on current market trends.
- "atsScore": 0-100 score based strictly on missing vs existing skills.
- "resumeFeedback": Extremely critical, actionable feedback to increase ATS score. Tell them exactly which keywords to add.
- "netflixLearningPath": Create exactly 5 to 6 series for the "Binge Learning" plan. EACH series MUST contain exactly 5 to 7 episodes. DO NOT provide fewer than 5 series, and DO NOT provide fewer than 5 episodes per series. This is a strict requirement.
- "readinessScore": Job/Interview readiness score out of 100 based on their profile.
- "marketIntelligence": Provide REAL data. What are the trending skills in this exact role?
- "roadmap": Make it highly meaningful, role-specific, skill-gap based, and actionable. Use exact stages: "Step 1: Foundation", "Step 2: Core Skills", "Step 3: Projects", "Step 4: Interview Prep", "Step 5: Job Strategy". For "details", you MUST strictly include: What to do, Why it matters, and Expected Outcome. Do not use generic text.
- "certifications": Real, 100% genuine certifications only. You MUST provide a 100% real, active URL to the official platform (e.g. Coursera, Udemy, AWS, edX). Do NOT hallucinate links!

DO NOT hallucinate formatting. Return pure JSON.`;

  const userMessage = `Generate the absolute best, highly realistic career plan and ATS score for a ${careerRoleTitle} with ${profileType || 'General'} profile. Existing skills: ${existingSkills.join(", ")}. Target Sector: ${isGov ? 'Government' : 'Private'}`;
  
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

  // Step 6: Filter Invalid Jobs
  const { enforceJobEligibility } = require("./eligibilityFilters");
  const seekerForFilter = jobSeekerProfileId ? await prisma.jobSeekerProfile.findUnique({ where: { id: jobSeekerProfileId } }) : {};
  const validJobRoles = enforceJobEligibility(aiData.privateJobPath?.roles || [], seekerForFilter || {}, careerRoleTitle)
    .filter((j: any) => j.passed)
    .map((j: any) => j.job);

  return {
    careerRole: careerRoleTitle,
    skillGap: {
      existingSkills: existingSkills,
      missingSkills: finalMissingSkills
    },
    learningPath: aiData.netflixLearningPath?.series || [],
    certifications: aiData.certifications || [],
    projects: aiData.projects || [],
    jobRoles: validJobRoles.length > 0 ? validJobRoles : ["General " + careerRoleTitle],
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

import { PrismaClient } from "@prisma/client";
import { generateGroqResponse } from "./groqClient.js";

const prisma = new PrismaClient();

export async function orchestrateCollegePlan(profileId: string) {
  // Fetch profile
  const profile = await prisma.higherEducationProfile.findUnique({
    where: { id: profileId },
    include: { domesticProfile: true }
  });

  if (!profile) throw new Error("Profile not found");

  const locationPref = profile.domesticProfile?.preferredStudyLocation || "Global";

  // Dynamic Instructions based on Education Level
  let levelSpecificInstructions = "";
  if (profile.educationLevel === "10th") {
    levelSpecificInstructions = `
- The user has just passed 10th standard.
- "recommendedColleges" should actually represent the top Junior Colleges or Senior Secondary Schools (11th & 12th grade) that offer the stream they want (${profile.careerGoal}).
- "recommendedStreams" should recommend Science (PCM/PCB), Commerce, or Arts based on their 10th percentage (${profile.percentage}) and interest.
- "careerPathways" should describe what they can become after 12th.
`;
  } else if (profile.educationLevel === "12th" || profile.educationLevel === "Diploma") {
    levelSpecificInstructions = `
- The user has passed 12th standard or a Diploma.
- "recommendedColleges" should represent Undergraduate Universities (e.g. B.Tech, B.Sc, B.Com, BA).
- "recommendedStreams" should be specific degree programs (e.g. B.Tech in AI, B.A. in Psychology).
- "careerPathways" should describe jobs they can get after this degree.
`;
  } else {
    levelSpecificInstructions = `
- The user is already a graduate (UG/PG).
- "recommendedColleges" should represent Postgraduate Universities (e.g. Master's, MBA, MS, PhD).
- "recommendedStreams" should be specializations or research topics.
- "careerPathways" should describe advanced senior roles in the industry.
`;
  }

  const systemPrompt = `You are an elite Higher Education Guidance AI.
Your job is to generate a personalized education and career pathway for a student.
Student Details:
- Education Level: ${profile.educationLevel}
- Current Stream/Qualification: ${profile.currentQualification}
- Board/University: ${profile.boardUniversity}
- Percentage/CGPA: ${profile.percentage || profile.cgpa}
- Goal/Interest: ${profile.careerGoal}
- Budget: ${profile.budget}
- Preferred Location: ${locationPref}

${levelSpecificInstructions}

You MUST return a raw JSON object exactly matching this schema:
{
  "recommendedStreams": [
    { "name": "string", "reason": "string" }
  ],
  "recommendedColleges": [
    {
      "collegeName": "string",
      "location": "string",
      "fees": "string",
      "matchPercentage": 0,
      "admissionProbability": 0,
      "deepDetails": {
        "averagePackage": "string",
        "highestPackage": "string",
        "placementPercentage": "string",
        "topRecruiters": ["string"],
        "curriculumHighlights": ["string"]
      }
    }
  ],
  "scholarships": [
    { "name": "string", "amount": "string", "eligibility": "string" }
  ],
  "careerPathways": ["string"],
  "admissionProcess": [
    { "step": "string", "timeline": "string", "description": "string" }
  ]
}

- Keep "recommendedColleges" to exactly 3 highly realistic institutions that match the profile budget, percentage, and location preference.
- Analyze the requested location: "${locationPref}". If this location is inside India, strictly format fees in Indian Rupees (₹). If it is outside India, format fees in USD ($) or the specific local currency of that country.
- Based on the student's marks (${profile.percentage || profile.cgpa}) and education level, recommend the absolute BEST, most prestigious institutions in "${locationPref}" that they can realistically get into. This applies globally.
- EXTREME STRICT ENTRANCE EXAM RULES: 
  1. If the user states "None" or "Board Marks" for entrance exams (i.e., no JEE score provided), you MUST NOT suggest any IIT, NIT, IIIT, or GFTI. Suggest ONLY colleges that offer admission purely on 12th Board marks (e.g., Jaypee (JIIT) Sector-62, Thapar University (board quota), Sastra University, Amity, LPU, Chandigarh University, or State Merit Colleges). NEVER suggest BITS, VIT, SRM, or Manipal unless the user explicitly mentions BITSAT, VITEEE, SRMJEEE, or MET.
  2. If the user provides a "JEE Main" score/rank but NO "JEE Advanced", you MUST NOT suggest IITs. Suggest NITs, IIITs, DTU, NSUT, or top GFTIs.
  3. If the user provides a "JEE Advanced" score/rank, ONLY THEN you can suggest IITs.
- CUTOFF PREDICTION RULE: Prioritize universities where the historical cutoff strictly aligns with the user's provided score (Board Percentage, JEE rank, CUET, etc.).
- STRICT PLACEMENT DATA RULE: DO NOT hallucinate "Google, Microsoft, Amazon" as top recruiters for every college. For Tier-2 or Tier-3 colleges, provide REALISTIC mass recruiters (e.g., TCS, Infosys, Wipro, Cognizant, Accenture) or core sector companies (e.g., L&T, Tata Motors). Also, provide REALISTIC average packages (e.g., 3.5-5 LPA for Tier-3, 6-10 LPA for Tier-2, 12+ LPA for Tier-1). NEVER inflate packages or fake MAANG placements.
- If a "Preferred Branch" or "Target Board" is specified in the Goal/Interest field, ensure the recommended colleges align with that specifically (e.g., recommend colleges famous for that specific branch).
- Provide a detailed "admissionProcess". If applying abroad, include Visa (e.g. F1), English tests (IELTS/TOEFL), and university deadlines. If applying domestically, include Entrance Exams, State counseling processes, and expected months. Provide this chronologically.`;

  const userMessage = "Analyze the student profile and generate the higher education framework.";

  console.log(`[Groq] Requesting college orchestration for student: ${profile.fullName} (${profile.educationLevel})`);
  
  let aiData: any;
  try {
    aiData = await generateGroqResponse(systemPrompt, userMessage, true);
  } catch (error) {
    console.error("Failed to generate College AI data:", error);
    aiData = {
      recommendedStreams: [],
      recommendedColleges: [],
      scholarships: [],
      careerPathways: []
    };
  }

  // Save to DB (Optional, keeps history)
  for (const college of aiData.recommendedColleges || []) {
    await prisma.collegeRecommendation.create({
      data: {
        collegeName: college.collegeName,
        location: college.location,
        matchPercentage: college.matchPercentage,
        admissionProbability: college.admissionProbability,
        fees: college.fees,
        careerGoalId: profile.careerGoalId // Optional chaining if needed
      }
    });
  }

  return aiData;
}

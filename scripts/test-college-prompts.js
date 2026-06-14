const fs = require('fs');
const path = require('path');

// Read API key from .env file
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const match = envContent.match(/GROQ_API_KEY=["']?([^"'\n]+)/);
const apiKey = match ? match[1] : null;

if (!apiKey) {
  console.error("GROQ_API_KEY not found in .env");
  process.exit(1);
}

// Mock inputs similar to a real profile
const profile = {
  fullName: "Test Student",
  educationLevel: "12th",
  currentQualification: "PCM",
  twelfthPercentage: 85,
  budget: "10 Lakhs",
  domesticProfile: {
    preferredStudyLocation: "Delhi NCR",
    entranceExamScores: "None (Applying via Board Marks)"
  }
};

const entranceExams = "None (Applying via Board Marks)";
const contextType = "DOMESTIC EDUCATION (Strictly inside India)";

const candidatePrompt = `You are a Candidate Generation Engine.
Based on the profile, propose 10 potential institutions.
Profile: 
- Form Context: ${contextType}
- Level: ${profile.educationLevel}
- Current Qualification/Stream: ${profile.currentQualification}
- Academic Performance: ${profile.twelfthPercentage}% in 12th
- Budget: ${profile.budget}
- User's Typed Target Location: ${profile.domesticProfile.preferredStudyLocation}
- Entrance Exams Taken: ${entranceExams}

CRITICAL RULES:
1. STRICT LOCATION MATCHING: The Form Context is ${contextType}. You MUST strictly suggest colleges located EXACTLY in the "User's Typed Target Location". Do NOT suggest colleges from other states/countries unless it's impossible. If the Typed Target Location contradicts the Form Context (e.g. they typed 'USA' on a DOMESTIC form), IGNORE their typed location and strictly follow the Form Context.
2. If "Entrance Exams Taken" says "None" or "Board Marks", you MUST NOT recommend colleges that mandate strict competitive exams. CRITICAL: Top institutes like IITs, NITs, IIITs, Delhi Technological University (DTU), NSUT, BITS Pilani, Jadavpur University, AIIMS, CMC, etc. STRICTLY REQUIRE ENTRANCE EXAMS. NEVER suggest them if "Entrance Exams" is "None". Instead, recommend local private universities or state colleges that have direct merit-based admissions (e.g. Amity, LPU, SRM, Manipal, or state-specific merit colleges).
3. STRICT BUDGET MATCHING: Ensure the fees fit the budget limit. If the budget is too low for the Target Location, suggest the cheapest possible valid options in that exact location.
4. MULTIPLE ENTRANCE EXAMS: If "Entrance Exams Taken" contains multiple exams (e.g. "JEE Main: 98 percentile | JEE Advanced: 5000 Rank | CUET: 750 Score"), you MUST recommend a balanced, high-quality mix of colleges matching ANY of the competitive exams they have taken (e.g., IITs for JEE Advanced, NITs/DTU for JEE Main, and Delhi University/Central Universities for CUET). Do not ignore any of the provided exams.
5. REAL-WORLD ACCURACY: Only recommend real, actual, existing institutions (e.g. Delhi Technological University, Indian Institute of Technology Delhi, Netaji Subhas University of Technology, etc. in Delhi). Do not generate generic, fictional, or placeholder college names. Ensure fees are realistically estimated.

Output a JSON array under "candidates" with fields:
{
  "candidates": [
    {
      "name": "string",
      "domain": "string (e.g. ENGINEERING, MEDICAL, MANAGEMENT)",
      "requiredExam": "string (e.g. JEE Main, NEET, None)",
      "feesINR": number,
      "feesUSD": number,
      "country": "string"
    }
  ]
}
Return raw JSON only.`;

async function generateGroqResponse(systemPrompt, userMessage) {
  const requestBody = {
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ],
    temperature: 0.2,
    response_format: { type: "json_object" }
  };

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API Error: ${response.status} - ${text}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function test() {
  try {
    console.log("Generating candidates...");
    const candidatesRes = await generateGroqResponse(candidatePrompt, "Generate candidates");
    console.log("Candidates Response:", JSON.stringify(candidatesRes, null, 2));

    const passedCandidates = (candidatesRes.candidates || []).slice(0, 3).map(c => ({
      candidate: c,
      passed: true,
      blockReason: "",
      matchScore: 85,
      eligibilityScore: 90
    }));

    console.log("\nPassed Candidates to explain:", JSON.stringify(passedCandidates, null, 2));

    const explainPrompt = `You are an Explainability Engine.
I have programmatically evaluated the following ${passedCandidates.length} colleges for the user:
${JSON.stringify(passedCandidates.map(p => ({
  ...p.candidate,
  validationPassed: p.passed,
  blockReason: p.blockReason
})))}

USER PROFILE:
- Form Context: ${contextType}
- User's Typed Target Location: ${profile.domesticProfile.preferredStudyLocation}
- Education Level: ${profile.educationLevel}
- Current Qualification/Stream: ${profile.currentQualification}
- Academic Performance: ${profile.twelfthPercentage}% in 12th
- Budget Limit: ${profile.budget}
- Entrance Exams Taken: ${entranceExams}

CRITICAL RULES:
1. STRICT LOCATION ISOLATION: The Form Context is ${contextType}. If DOMESTIC, you must ONLY recommend Indian colleges. If the user typed an international city (like London, USA) in their Typed Target Location on a DOMESTIC form, IGNORE their typed location. Tell them in 'whyRecommended': "Since you applied through the Domestic form, I am recommending top options in India." NEVER mix domestic and international!
2. If the user is a Science/Engineering student (PCM/PCB), DO NOT recommend Arts or Humanities paths unless specifically asked. Align 'recommendedStreams' exactly with their past 'Stream/Major' and 'Current Qualification'.
3. Only use the colleges from the provided list. Do not hallucinate.
4. RANKING CRITERIA: When determining category (Dream|Target|Safe) and 'whyRecommended', analyze Affordability, Eligibility match, Career alignment, Placement strength, and ROI.
5. BUDGET INTELLIGENCE: If the student's budget is slightly below stronger opportunities, you MUST explicitly mention in 'whyRecommended': How much extra budget is needed, what better colleges become accessible, and why increasing budget improves chances. (e.g. "Increasing your budget by ₹2–3 lakhs could unlock Tier-1 private colleges with stronger placements and better ROI.")

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
Provide realistic and accurate estimates for "averagePackage", "highestPackage", "placementPercentage", "topRecruiters", and "curriculumHighlights" based on your general knowledge of these institutions. Do NOT output "Not available" unless the institution is completely unknown.`;

    console.log("\nGenerating explanation...");
    const explainRes = await generateGroqResponse(explainPrompt, "Generate final explanation");
    console.log("Explanation Response:", JSON.stringify(explainRes, null, 2));

  } catch (err) {
    console.error("TEST FAILED:", err);
  }
}

test();

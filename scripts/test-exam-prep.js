const fs = require('fs');
const path = require('path');

// Read API key from .env file manually
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const match = envContent.match(/GROQ_API_KEY=["']?([^"'\n]+)/);
const apiKey = match ? match[1] : null;

if (apiKey) {
  process.env.GROQ_API_KEY = apiKey;
} else {
  console.warn("Warning: GROQ_API_KEY not found in .env, using process.env");
}

// Mock the imports
const examsDB = JSON.parse(fs.readFileSync(path.join(__dirname, '../lib/knowledge/exams.json'), 'utf-8'));

async function generateGroqResponse(systemPrompt, userMessage, isJsonMode = false) {
  const requestBody = {
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ],
    temperature: 0.2,
    max_completion_tokens: 4000
  };

  if (isJsonMode) {
    requestBody.response_format = { type: "json_object" };
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API Error: ${response.status} - ${text}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (isJsonMode) {
    return JSON.parse(content);
  }
  return content;
}

// Simplified version of the orchestrator to test the logic
async function testOrchestrate(stage, sector, examName, hours, budget) {
  const aliasMap = {
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

  console.log("Resolved Exam Name:", resolvedExamName);

  let validExams = examsDB;

  const sec = sector.toLowerCase();
  console.log("Sector lower:", sec);
  
  if (sec.includes("ssc")) {
    validExams = validExams.filter((e) => e.name.toUpperCase().includes("SSC") || e.domain === "GOVERNMENT");
  } else if (sec.includes("engineering")) {
    validExams = validExams.filter((e) => e.name.toUpperCase().includes("JEE") || e.name.toUpperCase().includes("GATE") || e.domain === "ENGINEERING");
  } else if (sec.includes("medical")) {
    validExams = validExams.filter((e) => e.name.toUpperCase().includes("NEET") || e.domain === "MEDICAL");
  } else if (sec.includes("banking")) {
    validExams = validExams.filter((e) => e.name.toUpperCase().includes("IBPS") || e.name.toUpperCase().includes("SBI") || e.name.toUpperCase().includes("RBI") || e.name.includes("PO"));
  } else if (sec.includes("upsc") || sec.includes("government")) {
    validExams = validExams.filter((e) => e.name.toUpperCase().includes("UPSC") || e.domain === "GOVERNMENT");
  } else if (sec === "international") {
    validExams = validExams.filter((e) => e.domain.startsWith("INTERNATIONAL") || e.domain === "LANGUAGE");
  }

  console.log("Valid exams after sector filter count:", validExams.length);

  // Filter by Stage
  if (stage.includes("10th") || stage.includes("12th")) {
    validExams = validExams.filter((e) => e.minQualification === "12th" || e.minQualification === "10th" || e.minQualification === "ANY" || e.minQualification === "UG");
  } else if (stage.includes("Graduate") || stage.includes("Diploma") || stage.includes("PG") || stage.includes("UG") || stage.includes("Technical")) {
    validExams = validExams.filter((e) => e.minQualification === "UG" || e.minQualification === "ANY");
  }

  console.log("Valid exams after stage filter count:", validExams.length);

  if (resolvedExamName && resolvedExamName !== "undefined" && resolvedExamName !== "None") {
    const explicitlyRequested = examsDB.filter((e) => e.name.toLowerCase() === resolvedExamName.toLowerCase() || e.name.toLowerCase().includes(resolvedExamName.toLowerCase()));
    
    console.log("Explicitly requested matching count in DB:", explicitlyRequested.length);
    if (explicitlyRequested.length > 0) {
      validExams = explicitlyRequested;
    } else {
      console.log("Contradiction detected!");
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

  console.log("Candidates list size:", validExams.length);
  const candidatesToExplain = validExams.slice(0, 3);
  console.log("Candidates sent to AI:", JSON.stringify(candidatesToExplain, null, 2));

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
- "institutes": Suggest real, popular, and existing coaching institutes or online platforms (e.g. Vision IAS, Vajiram & Ravi, Unacademy, Physics Wallah, Career Launcher, Testbook, etc.) fitting their ${budget} budget. Do not exceed the budget. Provide correct cost estimates.
- "studyResources": Suggest real, official, and standard study materials (e.g. M. Laxmikanth for Indian Polity, Ramesh Singh for Economy, NCERT books, standard reference books). Provide the exact title and type. Do not hallucinate resources.
- "futurePlan.planB": Give a solid, realistic backup career path if they don't clear the exam.
DO NOT hallucinate formatting. Return pure JSON.`;

  const userMessage = `Generate the validated exam prep explanation.`;

  try {
    const aiData = await generateGroqResponse(systemPrompt, userMessage, true);
    console.log("Raw AI Response received successfully.");
    console.log("Raw AI recommendedExams:", JSON.stringify(aiData.recommendedExams, null, 2));

    if (aiData.recommendedExams) {
      const filtered = aiData.recommendedExams.filter((generatedExam) => 
        candidatesToExplain.some((validExam) => 
          validExam.name.toLowerCase().includes(generatedExam.name.toLowerCase()) || 
          generatedExam.name.toLowerCase().includes(validExam.name.toLowerCase())
        )
      );
      console.log("Filtered recommendedExams size after post-processing:", filtered.length);
      console.log("Filtered recommendedExams:", JSON.stringify(filtered, null, 2));
    }
    
    return aiData;
  } catch (err) {
    console.error("AI Error:", err);
  }
}

testOrchestrate("After 12th", "Defense (NDA/CDS/AFCAT)", "NDA", "5-8 hours", "Low");

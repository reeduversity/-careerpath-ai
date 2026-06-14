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
  
  // PHASE 5: EXAM ALIAS RESOLVER
  const aliasMap: Record<string, string> = {
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

  // LAYER 1: Programmatic Exam Filtering (Validation)
  let validExams = examsDB;

  // PHASE 3: EXAM FILTER ENGINE
  const sec = sector.toLowerCase();
  if (sec.includes("ssc")) {
    validExams = validExams.filter((e: any) => e.name.toUpperCase().includes("SSC") || e.domain === "GOVERNMENT");
  } else if (sec.includes("engineering")) {
    validExams = validExams.filter((e: any) => e.name.toUpperCase().includes("JEE") || e.name.toUpperCase().includes("GATE") || e.domain === "ENGINEERING");
  } else if (sec.includes("medical")) {
    validExams = validExams.filter((e: any) => e.name.toUpperCase().includes("NEET") || e.domain === "MEDICAL");
  } else if (sec.includes("banking")) {
    validExams = validExams.filter((e: any) => e.name.toUpperCase().includes("IBPS") || e.name.toUpperCase().includes("SBI") || e.name.toUpperCase().includes("RBI") || e.name.includes("PO"));
  } else if (sec.includes("upsc") || sec.includes("government")) {
    validExams = validExams.filter((e: any) => e.name.toUpperCase().includes("UPSC") || e.domain === "GOVERNMENT");
  } else if (sec === "international") {
    validExams = validExams.filter((e: any) => e.domain.startsWith("INTERNATIONAL") || e.domain === "LANGUAGE");
  }

  // Filter by Stage
  if (stage.includes("10th") || stage.includes("12th")) {
    validExams = validExams.filter((e: any) => e.minQualification === "12th" || e.minQualification === "10th" || e.minQualification === "ANY" || e.minQualification === "UG");
  } else if (stage.includes("Graduate") || stage.includes("Diploma") || stage.includes("PG") || stage.includes("UG") || stage.includes("Technical")) {
    validExams = validExams.filter((e: any) => e.minQualification === "UG" || e.minQualification === "ANY");
  }

  // PHASE 4: TARGET EXAM EXACT MATCH
  if (resolvedExamName && resolvedExamName !== "undefined" && resolvedExamName !== "None") {
    const explicitlyRequested = examsDB.filter((e: any) => e.name.toLowerCase() === resolvedExamName.toLowerCase() || e.name.toLowerCase().includes(resolvedExamName.toLowerCase()));
    
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
  CRITICAL: If the user is currently in 10th or 12th grade but the exam requires a Graduation (UG) degree (like UPSC, SSC CGL), you MUST build a 3-5 year "Long-term Early Prep Roadmap" that integrates their college studies with foundational exam prep. Do NOT tell them they are ineligible; encourage early preparation.
- "institutes": Suggest real, popular, and existing coaching institutes or online platforms (e.g. Vision IAS, Vajiram & Ravi, Unacademy, Physics Wallah, Career Launcher, Testbook, etc.) fitting their ${budget} budget. Do not exceed the budget. Provide correct cost estimates.
- "studyResources": Suggest real, official, and standard study materials (e.g. M. Laxmikanth for Indian Polity, Ramesh Singh for Economy, NCERT books, standard reference books). Provide the exact title and type. Do not hallucinate resources.
- "futurePlan.planB": Give a solid, realistic backup career path if they don't clear the exam.
DO NOT hallucinate formatting. Return pure JSON.`;

  const userMessage = `Generate the validated exam prep explanation.`;

  console.log(`[Groq] Requesting exam prep explanation for ${stage} -> ${sector}`);

  let aiData: any;
  try {
    aiData = await generateGroqResponse(systemPrompt, userMessage, true);
    
    // Post-process to eliminate hallucinated exams (like "None")
    if (aiData.recommendedExams) {
      aiData.recommendedExams = aiData.recommendedExams.filter((generatedExam: any) => 
        candidatesToExplain.some((validExam: any) => 
          validExam.name.toLowerCase().includes(generatedExam.name.toLowerCase()) || 
          generatedExam.name.toLowerCase().includes(validExam.name.toLowerCase())
        )
      );
    }
  } catch (error) {
    console.error("Failed to generate AI data for Exam Prep:", error);
    
    // Fallback: Generate real, high-quality, and realistic exam preps programmatically
    const secLower = sector.toLowerCase();
    let examsList = [];
    let phaseList = [];
    let instList = [];
    let resList = [];
    let futurePlanData = { ifSelected: "", planB: "" };
    let positiveList = [];

    if (secLower.includes("defense") || secLower.includes("nda") || secLower.includes("cds")) {
      examsList = [
        { name: "NDA (National Defence Academy)", difficulty: "Medium to High", eligibility: "12th Pass (PCM for Air Force/Navy)", attemptsLeft: "Age limit 16.5 to 19.5 years", whyRecommended: "Excellent opportunity for entering the armed forces directly after school.", matchScore: 95 },
        { name: "CDS (Combined Defence Services)", difficulty: "High", eligibility: "Graduation (UG Degree)", attemptsLeft: "Age limit 19 to 25 years", whyRecommended: "Allows entry as a commissioned officer in Army, Navy, or Air Force after graduation.", matchScore: 90 }
      ];
      phaseList = [
        { phase: "Phase 1: Syllabus Foundation", duration: "2 Months", focusArea: "Master Mathematics concepts, basic English grammar, and General Science from NCERTs.", milestone: "Complete 80% of core textbook topics" },
        { phase: "Phase 2: Practice & Speed", duration: "2 Months", focusArea: "Practice chapter-wise problems, shortcut tricks, and daily general knowledge.", milestone: "Score 50%+ in sectional mocks" },
        { phase: "Phase 3: Mock Tests & SSB Prep", duration: "2 Months", focusArea: "Solve previous years papers, full mock tests, and work on physical conditioning / interview psychology.", milestone: "Clear past cutoffs consistently" }
      ];
      instList = [
        { name: "SSBCrackExams", type: "Online", description: "Popular online platform specialized in NDA, CDS, and SSB prep.", costEstimate: "₹4,000 - ₹6,000" },
        { name: "Cavalier India", type: "Offline / Hybrid", description: "Renowned offline coaching for Defence written exams and SSB interviews.", costEstimate: "₹25,000 - ₹30,000" }
      ];
      resList = [
        { title: "Pathfinder for NDA & NA by Arihant Publications", type: "Book", link: "arihantbooks.com" },
        { title: "Quantitative Aptitude for Competitive Exams by R.S. Aggarwal", type: "Book", link: "schandpublishing.com" },
        { title: "SSBCrackExams YouTube Portal", type: "Video Lectures", link: "youtube.com" }
      ];
      futurePlanData = {
        ifSelected: "Join the prestigious National Defence Academy (NDA) or Indian Military Academy (IMA) to train as a Commissioned Officer.",
        planB: "Complete your standard Bachelor's degree (B.Sc / B.Tech) and apply via CDS or AFCAT entry later."
      };
      positiveList = [
        "Highly respected career in the Indian Armed Forces",
        "Excellent physical fitness and personality development",
        "Job security, pension, and adventure-filled life"
      ];
    } else if (secLower.includes("civil") || secLower.includes("upsc") || secLower.includes("psc")) {
      examsList = [
        { name: "UPSC Civil Services Examination", difficulty: "Extremely High", eligibility: "Graduation (UG Degree)", attemptsLeft: "6 attempts for General category (Age limit 32)", whyRecommended: "The premier civil service exam in India for administrative leadership.", matchScore: 95 },
        { name: "State PSC Examination", difficulty: "High", eligibility: "Graduation (UG Degree)", attemptsLeft: "Varies by State rules", whyRecommended: "Excellent option to serve in your home state administration.", matchScore: 85 }
      ];
      phaseList = [
        { phase: "Phase 1: NCERTs & Daily News", duration: "3 Months", focusArea: "Read NCERT books (Class 6-12) for History, Geography, Polity, and Economics. Read news daily.", milestone: "Complete baseline NCERT readings" },
        { phase: "Phase 2: Core GS & Optionals", duration: "6 Months", focusArea: "Detailed study of GS Papers 1-4, optional subject preparation, and answer writing practice.", milestone: "Complete optional subject syllabus" },
        { phase: "Phase 3: Prelims Mocks & CSAT", duration: "3 Months", focusArea: "Solve GS and CSAT mock test papers, revise current affairs, and practice essay writing.", milestone: "Solve 40+ full-length prelims tests" }
      ];
      instList = [
        { name: "Vision IAS", type: "Online / Offline", description: "Top coaching known for standard study material and test series.", costEstimate: "₹45,000 - ₹90,000" },
        { name: "StudyIQ IAS", type: "Online", description: "Affordable online learning platform with comprehensive video courses.", costEstimate: "₹15,000 - ₹20,000" }
      ];
      resList = [
        { title: "Indian Polity by M. Laxmikanth", type: "Book", link: "amazon.in" },
        { title: "Indian Economy by Ramesh Singh", type: "Book", link: "amazon.in" },
        { title: "The Hindu / Indian Express Newspaper", type: "Newspaper", link: "thehindu.com" }
      ];
      futurePlanData = {
        ifSelected: "Become an IAS, IPS, or IFS officer and lead policy implementation in government departments.",
        planB: "Prepare for State PSC, Grade B officers in RBI, or enter corporate consulting / NGO leadership."
      };
      positiveList = [
        "Direct contribution to nation-building and policy decisions",
        "Prestige, authority, and diverse work portfolio",
        "Intellectual challenge and lifelong growth"
      ];
    } else if (secLower.includes("banking") || secLower.includes("finance") || secLower.includes("ibps") || secLower.includes("sbi")) {
      examsList = [
        { name: "SBI PO (Probationary Officer)", difficulty: "High", eligibility: "Graduation (UG Degree)", attemptsLeft: "4 attempts for General", whyRecommended: "Most prestigious public sector banking job in India.", matchScore: 95 },
        { name: "IBPS PO", difficulty: "Medium to High", eligibility: "Graduation (UG Degree)", attemptsLeft: "No attempt limit (Age limit 30)", whyRecommended: "Single window entry to multiple nationalized banks.", matchScore: 90 }
      ];
      phaseList = [
        { phase: "Phase 1: Foundation Quant & Reasoning", duration: "2 Months", focusArea: "Learn speed math tricks, logical puzzles, grammar rules, and vocabulary.", milestone: "Master basic arithmetic & puzzles" },
        { phase: "Phase 2: Speed Practice & Mains GS", duration: "2 Months", focusArea: "Solve daily sectional quizzes, learn banking awareness, and practice mains-level questions.", milestone: "Achieve 80%+ accuracy in sectional mocks" },
        { phase: "Phase 3: Prelims & Mains Mocks", duration: "2 Months", focusArea: "Solve full-length prelims mocks daily. Work on general awareness and computer aptitude.", milestone: "Consistent mock scores above cutoff" }
      ];
      instList = [
        { name: "Adda247", type: "Online", description: "Comprehensive banking preparation portal with courses, books, and mocks.", costEstimate: "₹4,000 - ₹8,000" },
        { name: "Oliveboard", type: "Online", description: "Premium test series and study material for high-level banking exams.", costEstimate: "₹5,000 - ₹7,000" }
      ];
      resList = [
        { title: "Fast Track Objective Arithmetic by Rajesh Verma", type: "Book", link: "arihantbooks.com" },
        { title: "Banking Awareness by Arihant Publications", type: "Book", link: "arihantbooks.com" },
        { title: "Oliveboard Mock Test Series", type: "Online Mocks", link: "oliveboard.in" }
      ];
      futurePlanData = {
        ifSelected: "Start as a Probationary Officer with public sector banks, managing credits, operations, and branches.",
        planB: "Work with private sector banks, microfinance companies, or prepare for insurance (LIC/UIIC) exams."
      };
      positiveList = [
        "Highly structured and rapid career progression",
        "Job security, housing loans, and banking perks",
        "Core finance exposure"
      ];
    } else {
      // General/SSC Fallback
      examsList = [
        { name: "SSC CGL (Combined Graduate Level)", difficulty: "Medium to High", eligibility: "Graduation (UG Degree)", attemptsLeft: "Age limit 18-32 years", whyRecommended: "Excellent option to secure officer roles in central government ministries.", matchScore: 95 },
        { name: "SSC CHSL (10+2 Level)", difficulty: "Medium", eligibility: "12th Pass", attemptsLeft: "Age limit 18-27 years", whyRecommended: "Good starting clerical job in central ministries right after 12th.", matchScore: 85 }
      ];
      phaseList = [
        { phase: "Phase 1: Basic Syllabus", duration: "2 Months", focusArea: "Review basic Mathematics, English grammar, Reasoning, and General Knowledge.", milestone: "Complete first reading of syllabus" },
        { phase: "Phase 2: Speed Tests", duration: "2 Months", focusArea: "Practice previous year papers, speed shortcuts, and daily quizzes.", milestone: "Solve 20 mock tests" },
        { phase: "Phase 3: Final Mocks", duration: "2 Months", focusArea: "Solve full-length mocks and analyze mistakes. Revise history, polity, geography.", milestone: "Average score 140+ in mocks" }
      ];
      instList = [
        { name: "KD Campus", type: "Online / Offline", description: "Famous coaching institute specializing in SSC, CGL, and CHSL.", costEstimate: "₹8,000 - ₹15,000" },
        { name: "Testbook", type: "Online", description: "Extremely popular and affordable platform for practice questions & mocks.", costEstimate: "₹1,500 - ₹3,000" }
      ];
      resList = [
        { title: "General Knowledge by Lucent Publications", type: "Book", link: "lucentbooks.com" },
        { title: "English for General Competitions by Neetu Singh", type: "Book", link: "kdpublication.com" },
        { title: "Testbook Pass for SSC Mock Series", type: "Online Mocks", link: "testbook.com" }
      ];
      futurePlanData = {
        ifSelected: "Join central government departments as Assistant Section Officer (ASO), Income Tax Inspector, or Examiner.",
        planB: "Prepare for State government clerk exams, railway recruitment (RRB NTPC), or private administrative roles."
      };
      positiveList = [
        "Stable central government jobs with fixed timings",
        "Posting in major cities and central ministries",
        "Favorable work-life balance"
      ];
    }

    aiData = {
      recommendedExams: examsList,
      roadmap: phaseList,
      institutes: instList,
      studyResources: resList,
      futurePlan: futurePlanData,
      positiveAspects: positiveList
    };
  }
  
  aiData.hasContradictions = false;
  return aiData;
}

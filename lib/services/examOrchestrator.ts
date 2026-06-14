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
  budget: string,
  category: string = "General"
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
    "rbi": "RBI Grade B",
    "nda": "NDA",
    "cds": "CDS",
    "afcat": "AFCAT",
    "chsl": "SSC CHSL",
    "net": "UGC NET",
    "ctet": "CTET",
    "rrb": "RRB NTPC",
    "group d": "RRB Group D",
    "alp": "RRB ALP",
    "capf": "CAPF AC",
    "pcs": "State PCS",
    "us civil": "US Civil Service Exam",
    "uk civil": "UK Civil Service Fast Stream"
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
  } else if (sec.includes("defense") || sec.includes("defence")) {
    validExams = validExams.filter((e: any) => e.domain === "DEFENCE");
  } else if (sec.includes("teaching") || sec.includes("academia")) {
    validExams = validExams.filter((e: any) => e.domain === "TEACHING");
  } else if (sec.includes("railway") || sec.includes("rrb")) {
    validExams = validExams.filter((e: any) => e.domain === "RAILWAY" || e.name.toUpperCase().includes("RRB"));
  } else if (sec.includes("international")) {
    validExams = validExams.filter((e: any) => e.domain.startsWith("INTERNATIONAL") || e.domain === "LANGUAGE");
  } else if (sec.includes("undecided")) {
    // Undecided: Recommend all valid exams for the user's educational stage
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
- Social Category: ${category}

You MUST return a raw JSON object exactly matching this schema:
{
  "recommendedExams": [
    { "name": "string", "difficulty": "string", "eligibility": "string", "attemptsLeft": "string", "whyRecommended": "string", "matchScore": number }
  ],
  "roadmap": [
    { "phase": "string", "duration": "string", "focusArea": "string", "milestone": "string" }
  ],
  "institutes": [
    { "name": "string", "type": "string", "description": "string", "costEstimate": "string", "officialWebsite": "string" }
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
  For each recommended exam, you MUST:
  * Calculate "attemptsLeft" accurately based on the user's category (${category}):
    - UPSC Civil Services: General/EWS is "6 attempts (Age limit 32 years)", OBC is "9 attempts (Age limit 35 years)", SC/ST is "Unlimited attempts (Age limit 37 years)", PwD is "9 attempts (Age limit 42 years)".
    - State PCS: "Unlimited attempts (Age limit 37-40 years, varies by state & category)".
    - SSC CGL / CHSL: "Unlimited attempts (CGL age limit 32, CHSL age limit 27, category relaxations apply)".
    - SBI PO: General/EWS is "4 attempts (Age limit 30 years)", OBC is "7 attempts (Age limit 33 years)", SC/ST is "Unlimited attempts (Age limit 35 years)", PwD is "7 attempts for Gen/OBC/EWS (Age limit 40 years)".
    - IBPS PO: "Unlimited attempts (Age limit 30 years, category relaxations apply)".
    - RBI Grade B: General is "6 attempts for Phase-1 (Age limit 30 years)", EWS is "Unlimited attempts (Age limit 30 years)", OBC is "Unlimited (Age limit 33 years)", SC/ST is "Unlimited (Age limit 35 years)", PwD is "Unlimited (Age limit 40 years)".
    - Defence exams like NDA/CDS/AFCAT: "No limit on attempts (NDA age limit 16.5-19.5 years, CDS age limit 19-25 years, AFCAT age limit 20-24 years)".
    - Teaching/Railways: "Unlimited attempts (Age limit varies by category)".
  * For "difficulty", write an encouraging and motivational sentence instead of a dry label. Examples:
    - High/Extremely High Difficulty: "High Difficulty (But with consistent study of 5-8 hours daily and proper planning, you can crack it!)" or "Extremely High (Consistent hard work and mock tests will definitely help you clear it!)"
    - Medium Difficulty: "Medium Difficulty (A focused effort of 4-6 months with proper revision will make you succeed!)"
    - Low Difficulty: "Low to Medium Difficulty (Very achievable with regular study and guidance!)"
- "roadmap": Break it down into phases based on ${hours} daily study. 
  CRITICAL: If the user is currently in 10th or 12th grade but the exam requires a Graduation (UG) degree (like UPSC, SSC CGL), you MUST build a 3-5 year "Long-term Early Prep Roadmap" that integrates their college studies with foundational exam prep. Do NOT tell them they are ineligible; encourage early preparation.
- "institutes": Suggest real, popular, and existing coaching institutes or online platforms (e.g. Vision IAS, Vajiram & Ravi, Unacademy, Physics Wallah, Career Launcher, Testbook, etc.) fitting their ${budget} budget. Do not exceed the budget. Provide correct cost estimates. You MUST provide the real, actual official website URL of the coaching institute/platform in the 'officialWebsite' field (e.g., https://unacademy.com, https://testbook.com).
- "studyResources": Suggest real, official, and standard study materials (e.g. M. Laxmikanth for Indian Polity, Ramesh Singh for Economy, NCERT books, standard reference books). Provide the exact title and type. Do not hallucinate resources.
- "futurePlan.planB": Give a solid, realistic backup career path if they don't clear the exam.
DO NOT hallucinate formatting. Return pure JSON.`;

  const userMessage = `Generate the validated exam prep explanation.`;

  console.log(`[Groq] Requesting exam prep explanation for ${stage} -> ${sector} with category: ${category}`);

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
        { name: "SSBCrackExams", type: "Online", description: "Popular online platform specialized in NDA, CDS, and SSB prep.", costEstimate: "₹4,000 - ₹6,000", officialWebsite: "https://ssbcrackexams.com" },
        { name: "Cavalier India", type: "Offline / Hybrid", description: "Renowned offline coaching for Defence written exams and SSB interviews.", costEstimate: "₹25,000 - ₹30,000", officialWebsite: "https://www.cavalierindia.com" }
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
        { name: "State PCS Examination", difficulty: "High", eligibility: "Graduation (UG Degree)", attemptsLeft: "Varies by State rules", whyRecommended: "Excellent option to serve in your home state administration.", matchScore: 85 }
      ];
      phaseList = [
        { phase: "Phase 1: NCERTs & Daily News", duration: "3 Months", focusArea: "Read NCERT books (Class 6-12) for History, Geography, Polity, and Economics. Read news daily.", milestone: "Complete baseline NCERT readings" },
        { phase: "Phase 2: Core GS & Optionals", duration: "6 Months", focusArea: "Detailed study of GS Papers 1-4, optional subject preparation, and answer writing practice.", milestone: "Complete optional subject syllabus" },
        { phase: "Phase 3: Prelims Mocks & CSAT", duration: "3 Months", focusArea: "Solve GS and CSAT mock test papers, revise current affairs, and practice essay writing.", milestone: "Solve 40+ full-length prelims tests" }
      ];
      instList = [
        { name: "Vision IAS", type: "Online / Offline", description: "Top coaching known for standard study material and test series.", costEstimate: "₹45,000 - ₹90,000", officialWebsite: "https://visionias.in" },
        { name: "StudyIQ IAS", type: "Online", description: "Affordable online learning platform with comprehensive video courses.", costEstimate: "₹15,000 - ₹20,000", officialWebsite: "https://studyiq.com" }
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
        { phase: "Phase 1: Quant & Reasoning Foundation", duration: "2 Months", focusArea: "Learn speed math tricks, logical puzzles, grammar rules, and vocabulary.", milestone: "Master basic arithmetic & puzzles" },
        { phase: "Phase 2: Speed Practice & Mains GS", duration: "2 Months", focusArea: "Solve daily sectional quizzes, learn banking awareness, and practice mains-level questions.", milestone: "Achieve 80%+ accuracy in sectional mocks" },
        { phase: "Phase 3: Prelims & Mains Mocks", duration: "2 Months", focusArea: "Solve full-length prelims mocks daily. Work on general awareness and computer aptitude.", milestone: "Consistent mock scores above cutoff" }
      ];
      instList = [
        { name: "Adda247", type: "Online", description: "Comprehensive banking preparation portal with courses, books, and mocks.", costEstimate: "₹4,000 - ₹8,000", officialWebsite: "https://www.adda247.com" },
        { name: "Oliveboard", type: "Online", description: "Premium test series and study material for high-level banking exams.", costEstimate: "₹5,000 - ₹7,000", officialWebsite: "https://www.oliveboard.in" }
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
    } else if (secLower.includes("teaching") || secLower.includes("academia")) {
      examsList = [
        { name: "UGC NET", difficulty: "High", eligibility: "Postgraduation (PG Degree)", attemptsLeft: "No age limit for Assistant Professor", whyRecommended: "Standard national eligibility test for university-level teaching careers.", matchScore: 95 },
        { name: "CTET", difficulty: "Medium", eligibility: "Graduation + B.Ed/D.El.Ed", attemptsLeft: "No attempt limits", whyRecommended: "Qualifying exam for central government school teachers (KVS, NVS).", matchScore: 90 }
      ];
      phaseList = [
        { phase: "Phase 1: Syllabus Core & Concepts", duration: "2 Months", focusArea: "Study Paper 1 teaching aptitude, research methodologies, and specialize in your PG subject.", milestone: "Finish Paper 1 curriculum" },
        { phase: "Phase 2: Mock Tests & MCQ Drill", duration: "2 Months", focusArea: "Solve previous years papers, practice mock tests, and perfect key topic summaries.", milestone: "Achieve 60%+ average in full mock tests" }
      ];
      instList = [
        { name: "BYJU'S Exam Prep (Gradeup)", type: "Online", description: "Comprehensive online learning platform with courses for NET/CTET.", costEstimate: "₹5,000 - ₹9,000", officialWebsite: "https://byjusexamprep.com" },
        { name: "Unacademy UGC NET", type: "Online", description: "Top online educator program offering interactive live classes and tests.", costEstimate: "₹8,000 - ₹12,000", officialWebsite: "https://unacademy.com" }
      ];
      resList = [
        { title: "Trueman's UGC NET General Paper I", type: "Book", link: "amazon.in" },
        { title: "CTET Success Master by Arihant Publications", type: "Book", link: "arihantbooks.com" }
      ];
      futurePlanData = {
        ifSelected: "Secure Assistant Professor positions at universities/colleges, or teach at public secondary schools.",
        planB: "Pursue teaching in private educational institutions, coordinate academic content, or prepare for State TET exams."
      };
      positiveList = [
        "Favorable work-life balance and respected career",
        "Continuous intellectual growth and learning",
        "Direct contribution to youth education"
      ];
    } else if (secLower.includes("railway") || secLower.includes("rrb")) {
      examsList = [
        { name: "RRB NTPC (Non-Technical)", difficulty: "Medium", eligibility: "12th Pass / Graduation", attemptsLeft: "Age limit 18-33 years", whyRecommended: "Highly popular entry to non-technical roles in Indian Railways.", matchScore: 95 }
      ];
      phaseList = [
        { phase: "Phase 1: General Awareness & Math", duration: "2 Months", focusArea: "Master basic arithmetic, logical reasoning, and static general knowledge.", milestone: "Complete core quantitative concepts" },
        { phase: "Phase 2: Mocks & Speed Practice", duration: "2 Months", focusArea: "Solve daily speed quizzes, practice typing tests, and analyze full mock exams.", milestone: "Solve 30+ mock exams" }
      ];
      instList = [
        { name: "Testbook", type: "Online", description: "Extremely popular and affordable platform for practice questions & mocks.", costEstimate: "₹1,500 - ₹3,000", officialWebsite: "https://testbook.com" },
        { name: "Adda247 Railways", type: "Online", description: "Well-structured railway exam study plans and test series.", costEstimate: "₹3,000 - ₹5,000", officialWebsite: "https://www.adda247.com" }
      ];
      resList = [
        { title: "General Knowledge by Lucent Publications", type: "Book", link: "lucentbooks.com" },
        { title: "Fast Track Objective Arithmetic by Rajesh Verma", type: "Book", link: "arihantbooks.com" }
      ];
      futurePlanData = {
        ifSelected: "Join Indian Railways as Station Master, Goods Guard, or Commercial Apprentice.",
        planB: "Prepare for SSC CHSL or state government department administrative clerk posts."
      };
      positiveList = [
        "Excellent job security and stable central government benefits",
        "Exciting travel privileges and railway passes",
        "Clear and structured promotional pathways"
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
        { name: "KD Campus", type: "Online / Offline", description: "Famous coaching institute specializing in SSC, CGL, and CHSL.", costEstimate: "₹8,000 - ₹15,000", officialWebsite: "https://www.kdcampus.org" },
        { name: "Testbook", type: "Online", description: "Extremely popular and affordable platform for practice questions & mocks.", costEstimate: "₹1,500 - ₹3,000", officialWebsite: "https://testbook.com" }
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
  
  // Post-process / Override attemptsLeft & difficulty to guarantee 100% correctness based on category and rules
  if (aiData.recommendedExams) {
    aiData.recommendedExams = aiData.recommendedExams.map((exam: any) => {
      const nameLower = exam.name.toLowerCase();
      
      // 1. Calculate attemptsLeft dynamically
      let calculatedAttempts = exam.attemptsLeft;
      
      if (nameLower.includes("upsc civil") || nameLower.includes("civil services")) {
        if (category === "General" || category === "EWS") {
          calculatedAttempts = "6 attempts (Age limit 32 years)";
        } else if (category === "OBC") {
          calculatedAttempts = "9 attempts (Age limit 35 years)";
        } else if (category === "SC" || category === "ST") {
          calculatedAttempts = "Unlimited attempts (Age limit 37 years)";
        } else if (category === "PwD") {
          calculatedAttempts = "9 attempts (Age limit 42 years)";
        } else {
          calculatedAttempts = "6 attempts (General) / 9 attempts (OBC) / Unlimited (SC/ST)";
        }
      } else if (nameLower.includes("state pcs") || nameLower.includes("pcs exam") || nameLower.includes("public service commission")) {
        if (category === "General" || category === "EWS") {
          calculatedAttempts = "Unlimited attempts (Age limit 37-40 years, varies by state)";
        } else if (category === "OBC") {
          calculatedAttempts = "Unlimited attempts (Age limit 40-43 years, varies by state)";
        } else if (category === "SC" || category === "ST") {
          calculatedAttempts = "Unlimited attempts (Age limit 42-45 years, varies by state)";
        } else if (category === "PwD") {
          calculatedAttempts = "Unlimited attempts (Age limit 47-50 years, varies by state)";
        } else {
          calculatedAttempts = "Unlimited attempts (Age limit varies by state and category)";
        }
      } else if (nameLower.includes("ssc cgl")) {
        if (category === "General" || category === "EWS") {
          calculatedAttempts = "Unlimited attempts (Age limit 32 years)";
        } else if (category === "OBC") {
          calculatedAttempts = "Unlimited attempts (Age limit 35 years)";
        } else if (category === "SC" || category === "ST") {
          calculatedAttempts = "Unlimited attempts (Age limit 37 years)";
        } else if (category === "PwD") {
          calculatedAttempts = "Unlimited attempts (Age limit 42 years)";
        } else {
          calculatedAttempts = "Unlimited attempts (Age limit 32 years, category relaxations apply)";
        }
      } else if (nameLower.includes("ssc chsl")) {
        if (category === "General" || category === "EWS") {
          calculatedAttempts = "Unlimited attempts (Age limit 27 years)";
        } else if (category === "OBC") {
          calculatedAttempts = "Unlimited attempts (Age limit 30 years)";
        } else if (category === "SC" || category === "ST") {
          calculatedAttempts = "Unlimited attempts (Age limit 32 years)";
        } else if (category === "PwD") {
          calculatedAttempts = "Unlimited attempts (Age limit 37 years)";
        } else {
          calculatedAttempts = "Unlimited attempts (Age limit 27 years, category relaxations apply)";
        }
      } else if (nameLower.includes("sbi po")) {
        if (category === "General" || category === "EWS") {
          calculatedAttempts = "4 attempts (Age limit 30 years)";
        } else if (category === "OBC") {
          calculatedAttempts = "7 attempts (Age limit 33 years)";
        } else if (category === "SC" || category === "ST") {
          calculatedAttempts = "Unlimited attempts (Age limit 35 years)";
        } else if (category === "PwD") {
          calculatedAttempts = "7 attempts for Gen/OBC/EWS (Age limit 40 years)";
        } else {
          calculatedAttempts = "4 attempts (General) / 7 attempts (OBC) / Unlimited (SC/ST)";
        }
      } else if (nameLower.includes("ibps po")) {
        if (category === "General" || category === "EWS") {
          calculatedAttempts = "Unlimited attempts (Age limit 30 years)";
        } else if (category === "OBC") {
          calculatedAttempts = "Unlimited attempts (Age limit 33 years)";
        } else if (category === "SC" || category === "ST") {
          calculatedAttempts = "Unlimited attempts (Age limit 35 years)";
        } else if (category === "PwD") {
          calculatedAttempts = "Unlimited attempts (Age limit 40 years)";
        } else {
          calculatedAttempts = "Unlimited attempts (Age limit 30 years, category relaxations apply)";
        }
      } else if (nameLower.includes("rbi grade b")) {
        if (category === "General") {
          calculatedAttempts = "6 attempts for Phase-1 (Age limit 30 years)";
        } else if (category === "EWS") {
          calculatedAttempts = "Unlimited attempts (Age limit 30 years)";
        } else if (category === "OBC") {
          calculatedAttempts = "Unlimited attempts (Age limit 33 years)";
        } else if (category === "SC" || category === "ST") {
          calculatedAttempts = "Unlimited attempts (Age limit 35 years)";
        } else if (category === "PwD") {
          calculatedAttempts = "Unlimited attempts (Age limit 40 years)";
        } else {
          calculatedAttempts = "6 attempts for General Phase-1, Unlimited for other categories";
        }
      } else if (nameLower.includes("nda") || nameLower.includes("national defence academy")) {
        calculatedAttempts = "No limit on attempts (Strict age limit 16.5 - 19.5 years, no reservation relaxations)";
      } else if (nameLower.includes("cds") || nameLower.includes("combined defence services")) {
        calculatedAttempts = "No limit on attempts (Strict age limit 19 - 25 years, no reservation relaxations)";
      } else if (nameLower.includes("afcat")) {
        calculatedAttempts = "No limit on attempts (Strict age limit 20 - 24 for Flying, 26 for Ground Duty)";
      } else if (nameLower.includes("capf ac")) {
        if (category === "General" || category === "EWS") {
          calculatedAttempts = "Unlimited attempts (Age limit 25 years)";
        } else if (category === "OBC") {
          calculatedAttempts = "Unlimited attempts (Age limit 28 years)";
        } else if (category === "SC" || category === "ST") {
          calculatedAttempts = "Unlimited attempts (Age limit 30 years)";
        } else if (category === "PwD") {
          calculatedAttempts = "Unlimited attempts (Age limit 35 years)";
        } else {
          calculatedAttempts = "Unlimited attempts (Age limit 25, relaxation for reservation)";
        }
      } else if (nameLower.includes("ugc net")) {
        if (category === "General") {
          calculatedAttempts = "Unlimited attempts (JRF age limit 30 years, Assistant Professor no limit)";
        } else if (category === "OBC") {
          calculatedAttempts = "Unlimited attempts (JRF age limit 33 years, Assistant Professor no limit)";
        } else if (category === "SC" || category === "ST" || category === "PwD") {
          calculatedAttempts = "Unlimited attempts (JRF age limit 35 years, Assistant Professor no limit)";
        } else {
          calculatedAttempts = "Unlimited attempts (JRF age limit 30, relaxation applies)";
        }
      } else if (nameLower.includes("ctet")) {
        calculatedAttempts = "Unlimited attempts (No age limit)";
      } else if (nameLower.includes("rrb ntpc")) {
        if (category === "General" || category === "EWS") {
          calculatedAttempts = "Unlimited attempts (Age limit 18-33 years)";
        } else if (category === "OBC") {
          calculatedAttempts = "Unlimited attempts (Age limit 18-36 years)";
        } else if (category === "SC" || category === "ST") {
          calculatedAttempts = "Unlimited attempts (Age limit 18-38 years)";
        } else if (category === "PwD") {
          calculatedAttempts = "Unlimited attempts (Age limit 18-43 years)";
        } else {
          calculatedAttempts = "Unlimited attempts (Age limit 18-33, relaxation applies)";
        }
      } else if (nameLower.includes("rrb group d") || nameLower.includes("level 1")) {
        if (category === "General" || category === "EWS") {
          calculatedAttempts = "Unlimited attempts (Age limit 18-33 years)";
        } else if (category === "OBC") {
          calculatedAttempts = "Unlimited attempts (Age limit 18-36 years)";
        } else if (category === "SC" || category === "ST") {
          calculatedAttempts = "Unlimited attempts (Age limit 18-38 years)";
        } else if (category === "PwD") {
          calculatedAttempts = "Unlimited attempts (Age limit 18-43 years)";
        } else {
          calculatedAttempts = "Unlimited attempts (Age limit 18-33, relaxation applies)";
        }
      } else if (nameLower.includes("rrb alp")) {
        if (category === "General" || category === "EWS") {
          calculatedAttempts = "Unlimited attempts (Age limit 18-30 years)";
        } else if (category === "OBC") {
          calculatedAttempts = "Unlimited attempts (Age limit 18-33 years)";
        } else if (category === "SC" || category === "ST") {
          calculatedAttempts = "Unlimited attempts (Age limit 18-35 years)";
        } else if (category === "PwD") {
          calculatedAttempts = "Unlimited attempts (Age limit 18-40 years)";
        } else {
          calculatedAttempts = "Unlimited attempts (Age limit 18-30, relaxation applies)";
        }
      }

      // 2. Format difficulty dynamically to be encouraging/supportive
      let calculatedDifficulty = exam.difficulty;
      const diffLower = exam.difficulty.toLowerCase();
      
      // If it doesn't already contain motivational guidance
      if (!diffLower.includes("study") && !diffLower.includes("work") && !diffLower.includes("effort") && !diffLower.includes("clear") && !diffLower.includes("practice") && !diffLower.includes("prepare")) {
        if (diffLower.includes("extremely high") || diffLower.includes("very high") || diffLower.includes("extreme")) {
          calculatedDifficulty = "Extremely High (But with consistent study of 6-8 hours daily and regular mock tests, you can clear it!)";
        } else if (diffLower.includes("high") || diffLower.includes("hard")) {
          calculatedDifficulty = "High (Hard work and dedicated preparation of 5-8 hours daily will definitely help you clear it!)";
        } else if (diffLower.includes("medium")) {
          calculatedDifficulty = "Medium (With a structured 4-6 months plan and consistent revision, you will easily succeed!)";
        } else if (diffLower.includes("low")) {
          calculatedDifficulty = "Low to Medium (Very achievable with standard preparation and regular study!)";
        } else {
          calculatedDifficulty = `${exam.difficulty} (Proper guidance and regular study will help you succeed!)`;
        }
      }
      
      return {
        ...exam,
        attemptsLeft: calculatedAttempts,
        difficulty: calculatedDifficulty
      };
    });
  }

  aiData.hasContradictions = false;
  return aiData;
}

import { generateGroqResponse } from "./groqClient";

export function analyzeResumeTextFallback(text: string) {
  const result = {
    fullName: null as string | null,
    email: null as string | null,
    phone: null as string | null,
    location: null as string | null,
    currentCity: null as string | null,
    currentState: null as string | null,
    degree: null as string | null,
    institute: null as string | null,
    cgpa: null as string | null,
    passingYear: null as string | null,
    tenthPercentage: null as string | null,
    twelfthPercentage: null as string | null,
    experienceLevel: null as string | null,
    education: [] as string[],
    skills: [] as string[],
    technicalSkills: [] as string[],
    softSkills: [] as string[],
    experience: [] as string[],
    projects: [] as string[],
    certifications: [] as string[],
    achievements: [] as string[],
    linkedin: null as string | null,
    github: null as string | null,
    portfolio: null as string | null,
    completenessScore: 0,
    qualityScore: 0,
    profileStrength: 0,
  };

  if (!text) return result;

  // 0. Extract Dates/Years separately so they don't pollute other fields
  // This matches 4 digit years like 1999, 2024
  const yearRegex = /\b(19|20)\d{2}\b/g;
  const yearRangesRegex = /\b(19|20)\d{2}\s*[-–to]\s*(19|20)\d{2}\b|\b(19|20)\d{2}\s*[-–to]\s*Present\b/gi;
  
  // 1. Extract Email
  // Strict email regex requiring proper TLD and avoiding surrounding garbage
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const emailMatches = text.match(emailRegex);
  if (emailMatches && emailMatches.length > 0) {
    // Basic validation to ensure it's not a hallucinated or malformed email
    const email = emailMatches[0].trim();
    if (email.includes('@') && email.includes('.')) {
        result.email = email;
    }
  }

  // 2. Extract Phone
  // A broad regex that captures sequences of digits, +, (, ), -, and spaces
  // It relies heavily on post-validation to ensure accuracy
  const phoneRegex = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}(?:[\s.-]?\d{2,4})?/g;
  const phoneMatches = text.match(phoneRegex);
  if (phoneMatches) {
    for (const match of phoneMatches) {
      const trimmed = match.trim();
      const digits = trimmed.replace(/\D/g, '');
      
      // Phone must have 10 to 15 digits
      if (digits.length >= 10 && digits.length <= 15) {
        
        // Reject if it looks like a year range (e.g. 2020-2024 has 8 digits but just to be safe)
        if (yearRangesRegex.test(trimmed)) continue;
        
        // Reject if it contains known academic/irrelevant terms
        const lower = trimmed.toLowerCase();
        if (lower.includes('th') || lower.includes('cgpa') || lower.includes('%') || lower.includes('percentage')) continue;

        // If it passed all validation, it's a high confidence phone number
        result.phone = trimmed;
        break;
      }
    }
  }

  // 2.5 Extract URLs (LinkedIn, GitHub, Portfolio)
  const noHttpRegex = /\b(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
  const allDomainMatches = text.match(noHttpRegex) || [];
  for (let url of allDomainMatches) {
    url = url.trim();
    if (url.endsWith('.') || url.endsWith(',')) url = url.slice(0, -1);
    if (url.includes('@')) continue; // exclude emails
    
    const l = url.toLowerCase();
    const finalUrl = url.startsWith("http") ? url : "https://" + url;

    if (l.includes("linkedin.com") && !result.linkedin) {
      result.linkedin = finalUrl;
    } else if (l.includes("github.com") && !result.github) {
      result.github = finalUrl;
    } else if (
      !l.includes("linkedin.com") && 
      !l.includes("github.com") && 
      !l.includes("gmail.com") && 
      !l.includes("yahoo.com") &&
      !result.portfolio &&
      (l.includes(".com") || l.includes(".io") || l.includes(".net") || l.includes(".me") || l.includes(".dev") || l.includes(".app")) &&
      url.length > 5
    ) {
      result.portfolio = finalUrl;
    }
  }

  // 3. Extract Full Name heuristically
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const invalidNameKeywords = ['email', 'phone', 'address', 'resume', 'cv', 'curriculum', 'vitae', 'page', 'github', 'linkedin'];
  for (const line of lines) {
    const l = line.toLowerCase();
    
    // A high confidence name:
    // - Less than 40 chars
    // - Doesn't contain @
    // - Doesn't contain numbers
    // - Between 1 and 4 words
    // - Doesn't contain a known invalid keyword
    if (
      line.length < 40 &&
      !line.includes('@') &&
      !/\d/.test(line) &&
      !invalidNameKeywords.some(kw => l.includes(kw))
    ) {
      const words = line.split(/\s+/);
      if (words.length >= 1 && words.length <= 4) {
        const cleanName = line.replace(/^[^\w]+|[^\w]+$/g, '');
        // Require at least 3 letters total to avoid random initials or symbols
        if (cleanName.replace(/[^a-zA-Z]/g, '').length >= 3) {
           result.fullName = cleanName;
           break;
        }
      }
    }
  }

  // 4. Extract Sections based on dynamic headings
  const headings = [
    { name: "experience", keywords: ["experience", "employment", "work history", "professional experience", "career history"] },
    { name: "education", keywords: ["education", "academic background", "qualifications", "academic history"] },
    { name: "skills", keywords: ["skills", "technologies", "core competencies", "technical skills", "soft skills", "expertise"] },
    { name: "projects", keywords: ["projects", "personal projects", "academic projects", "key projects"] },
    { name: "certifications", keywords: ["certifications", "certificates", "licenses"] },
    { name: "achievements", keywords: ["achievements", "awards", "honors", "accomplishments"] }
  ];

  let currentSection = '';
  for (const line of lines) {
    // Strip symbols to find pure headings, e.g. "=== SKILLS ===" -> "skills"
    const cleanLine = line.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    
    let foundHeading = false;
    if (cleanLine.length > 0 && cleanLine.length < 40) {
      for (const h of headings) {
        if (h.keywords.includes(cleanLine)) {
          currentSection = h.name;
          foundHeading = true;
          
          if (cleanLine.includes("technical")) currentSection = "technicalSkills";
          else if (cleanLine.includes("soft")) currentSection = "softSkills";
          
          break;
        }
      }
    }

    if (foundHeading) continue;

    if (currentSection) {
      if (currentSection === "experience" && line.length > 5) result.experience.push(line);
      if (currentSection === "education" && line.length > 5) result.education.push(line);
      if (currentSection === "skills" && line.length > 2) {
          const parts = line.split(/[,\u2022|]/).map(p => p.trim()).filter(p => p.length > 1);
          result.skills.push(...parts);
      }
      if (currentSection === "technicalSkills" && line.length > 2) {
          const parts = line.split(/[,\u2022|]/).map(p => p.trim()).filter(p => p.length > 1);
          result.technicalSkills.push(...parts);
      }
      if (currentSection === "softSkills" && line.length > 2) {
          const parts = line.split(/[,\u2022|]/).map(p => p.trim()).filter(p => p.length > 1);
          result.softSkills.push(...parts);
      }
      if (currentSection === "projects" && line.length > 5) result.projects.push(line);
      if (currentSection === "certifications" && line.length > 5) result.certifications.push(line);
      if (currentSection === "achievements" && line.length > 5) result.achievements.push(line);
    }
  }

  // Deduplicate lists
  result.skills = Array.from(new Set(result.skills));
  result.technicalSkills = Array.from(new Set(result.technicalSkills));
  result.softSkills = Array.from(new Set(result.softSkills));

  // 5. Dynamic Scoring
  let completeness = 0;
  if (result.fullName) completeness += 10;
  if (result.email || result.phone) completeness += 15;
  if (result.experience.length > 0) completeness += 30;
  if (result.education.length > 0) completeness += 20;
  if (result.skills.length > 0 || result.technicalSkills.length > 0) completeness += 15;
  if (result.projects.length > 0 || result.certifications.length > 0) completeness += 10;
  result.completenessScore = completeness;

  let quality = 0;
  const expWordCount = result.experience.join(' ').split(/\s+/).length;
  if (expWordCount > 200) quality += 35;
  else if (expWordCount > 100) quality += 25;
  else if (expWordCount > 50) quality += 15;
  else if (expWordCount > 0) quality += 5;

  const hasBullets = result.experience.some(l => l.startsWith('-') || l.startsWith('•') || l.startsWith('*'));
  if (hasBullets) quality += 20;

  const hasNumbers = result.experience.some(l => /\d+%|\d+x|\$\d+|\d+\s*(million|k|M)/i.test(l));
  if (hasNumbers) quality += 25;

  const totalSkills = result.skills.length + result.technicalSkills.length + result.softSkills.length;
  if (totalSkills > 15) quality += 20;
  else if (totalSkills > 8) quality += 10;
  else if (totalSkills > 0) quality += 5;

  result.qualityScore = Math.min(100, quality);
  result.profileStrength = Math.round((result.completenessScore * 0.5) + (result.qualityScore * 0.5));

  return result;
}

export async function analyzeResumeText(text: string) {
  if (!text) return analyzeResumeTextFallback(text);

  const prompt = `You are a strict JSON-only API that extracts structured data from resumes.
Extract the following fields from the given resume text. If a field cannot be found, output null (for strings) or empty array (for arrays).

Schema:
{
  "fullName": "string | null",
  "email": "string | null",
  "phone": "string | null",
  "location": "string | null",
  "currentCity": "string | null",
  "currentState": "string | null",
  "degree": "string | null (e.g. B.Tech, B.Sc, MBA)",
  "institute": "string | null (e.g. IIT Bombay, Lamrin Tech Skills University)",
  "cgpa": "string | null (e.g. 8.1)",
  "passingYear": "string | null (e.g. 2024, 2027)",
  "tenthPercentage": "string | null (e.g. 88)",
  "twelfthPercentage": "string | null (e.g. 88.2)",
  "experienceLevel": "string | null (must be one of: Fresher, 0-1 Years, 1-3 Years, 3-5 Years, 5+ Years)",
  "linkedin": "string | null",
  "github": "string | null",
  "portfolio": "string | null",
  "education": ["string"],
  "skills": ["string"],
  "technicalSkills": ["string"],
  "softSkills": ["string"],
  "experience": ["string"],
  "projects": ["string"],
  "certifications": ["string"],
  "achievements": ["string"]
}

Resume Text:
${text.substring(0, 5000)}

Return ONLY valid JSON matching the schema.`;

  try {
    const aiResult = await generateGroqResponse(prompt, "Extract resume JSON", true);
    
    // Merge with fallback logic scores
    const fallback = analyzeResumeTextFallback(text);
    
    return {
      ...fallback,
      fullName: aiResult.fullName || fallback.fullName,
      email: aiResult.email || fallback.email,
      phone: aiResult.phone || fallback.phone,
      location: aiResult.location || fallback.location,
      currentCity: aiResult.currentCity || null,
      currentState: aiResult.currentState || null,
      degree: aiResult.degree || null,
      institute: aiResult.institute || null,
      cgpa: aiResult.cgpa || null,
      passingYear: aiResult.passingYear || null,
      tenthPercentage: aiResult.tenthPercentage || null,
      twelfthPercentage: aiResult.twelfthPercentage || null,
      experienceLevel: aiResult.experienceLevel || null,
      linkedin: aiResult.linkedin || fallback.linkedin,
      github: aiResult.github || fallback.github,
      portfolio: aiResult.portfolio || fallback.portfolio,
      education: (aiResult.education && aiResult.education.length > 0) ? aiResult.education : fallback.education,
      skills: (aiResult.skills && aiResult.skills.length > 0) ? aiResult.skills : fallback.skills,
      technicalSkills: (aiResult.technicalSkills && aiResult.technicalSkills.length > 0) ? aiResult.technicalSkills : fallback.technicalSkills,
      softSkills: (aiResult.softSkills && aiResult.softSkills.length > 0) ? aiResult.softSkills : fallback.softSkills,
      experience: (aiResult.experience && aiResult.experience.length > 0) ? aiResult.experience : fallback.experience,
      projects: (aiResult.projects && aiResult.projects.length > 0) ? aiResult.projects : fallback.projects,
      certifications: (aiResult.certifications && aiResult.certifications.length > 0) ? aiResult.certifications : fallback.certifications,
      achievements: (aiResult.achievements && aiResult.achievements.length > 0) ? aiResult.achievements : fallback.achievements,
    };
  } catch (error) {
    console.error("Groq extraction failed, falling back to regex", error);
    return analyzeResumeTextFallback(text);
  }
}

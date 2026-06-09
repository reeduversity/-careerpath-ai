"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldWrapper, Input, RadioGroup } from "@/components/ui/form";

const experienceOptions = [
  "Fresher",
  "0-1 Years",
  "1-3 Years",
  "3-5 Years",
  "5+ Years",
];

const workPrefs = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
];

const salaryOptionsDomestic = [
  { value: "below-3-lpa", label: "Below 3 LPA" },
  { value: "3-6-lpa", label: "3-6 LPA" },
  { value: "6-10-lpa", label: "6-10 LPA" },
  { value: "10-20-lpa", label: "10-20 LPA" },
  { value: "20-plus", label: "20+ LPA" },
];

const salaryOptionsInternational = [
  { value: "below-50k-usd", label: "Below $50k USD" },
  { value: "50k-80k-usd", label: "$50k - $80k USD" },
  { value: "80k-120k-usd", label: "$80k - $120k USD" },
  { value: "120k-plus-usd", label: "$120k+ USD" },
];

export default function JobSeeker() {
  const [values, setValues] = useState({
    profileType: "",
    careerGoal: "",
    targetJobRole: "",
    industry: "",
    qualification: "",
    experienceLevel: "",
    currentCity: "",
    currentState: "",
    preferredLocation: "",
    workPreference: "",
    salaryExpectation: "",
    linkedin: "",
    github: "",
    portfolio: "",
    jobSearchType: "domestic", // "domestic" or "international"
    preferredCountry: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeStatus, setResumeStatus] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    id: string;
    fileName: string;
    fileSize: number;
    extractedTextPreview: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const autofillInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const [isAutofilling, setIsAutofilling] = useState(false);
  const [autofillStatus, setAutofillStatus] = useState("");

  const handleChange = (field: string, value: string) => {
    setValues((s) => ({ ...s, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const addSkill = () => {
    const v = skillInput.trim();
    if (!v) return;
    if (!skills.includes(v)) setSkills((s) => [...s, v]);
    setSkillInput("");
  };

  const removeSkill = (s: string) => setSkills((cur) => cur.filter((x) => x !== s));

  const handleFile = (file?: File | null) => {
    if (!file) return;
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"];
    if (!allowed.includes(file.type)) {
      setResumeStatus("Invalid file type. Use PDF or DOCX.");
      setResumeFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResumeStatus("File too large. Max 5MB.");
      setResumeFile(null);
      return;
    }
    setResumeFile(file);
    setResumeStatus("Upload ready");
  };

  const handleAutofill = async (file: File | null) => {
    if (!file) return;
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"];
    if (!allowed.includes(file.type)) {
      setAutofillStatus("Invalid file type. Use PDF or DOCX.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAutofillStatus("File too large. Max 5MB.");
      return;
    }

    setIsAutofilling(true);
    setAutofillStatus("Uploading for AI analysis...");

    try {
      const formData = new FormData();
      formData.append("resume", file);
      const uploadRes = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson.error || "Upload failed");

      // Save the uploaded resume globally so we don't have to re-upload on Submit
      setResumeFile(file);
      setResumeStatus("Uploaded via Autofill");
      setUploadResult({
        id: uploadJson.id,
        fileName: uploadJson.fileName,
        fileSize: uploadJson.fileSize,
        extractedTextPreview: uploadJson.extractedTextPreview || "",
      });

      setAutofillStatus("AI is reading your resume...");

      // Call analysis endpoint
      const analyzeRes = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: uploadJson.id })
      });
      const analyzeJson = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeJson.error || "Analysis failed");

      const analysis = analyzeJson.analysis;
      if (analysis) {
        setValues((prev) => ({
          ...prev,
          qualification: Array.isArray(analysis.education) && analysis.education.length > 0 ? analysis.education[0] : prev.qualification,
          linkedin: analysis.linkedin || prev.linkedin,
          github: analysis.github || prev.github,
          portfolio: analysis.portfolio || prev.portfolio,
        }));

        const newSkills = new Set(skills);
        if (Array.isArray(analysis.technicalSkills)) analysis.technicalSkills.forEach((s: string) => newSkills.add(s));
        if (Array.isArray(analysis.softSkills)) analysis.softSkills.forEach((s: string) => newSkills.add(s));
        setSkills(Array.from(newSkills));

        setAutofillStatus("✨ Autofill complete! Review your details below.");
      }
    } catch (error) {
      setAutofillStatus(`Autofill failed: ${String(error)}`);
    } finally {
      setIsAutofilling(false);
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!values.profileType) next.profileType = "Profile type is required.";
    if (!values.careerGoal.trim()) next.careerGoal = "Career goal is required.";
    if (!values.targetJobRole.trim()) next.targetJobRole = "Target job role is required.";
    if (!values.industry.trim()) next.industry = "Industry is required.";
    if (!values.qualification.trim()) next.qualification = "Qualification is required.";
    if (!values.experienceLevel.trim()) next.experienceLevel = "Experience level is required.";

    if (!values.currentCity.trim()) next.currentCity = "Current city is required.";
    if (!values.currentState.trim()) next.currentState = "Current state is required.";
    
    if (values.jobSearchType === "international" && !values.preferredCountry.trim()) {
      next.preferredCountry = "Preferred country is required for international jobs.";
    } else if (values.jobSearchType === "domestic" && !values.preferredLocation.trim()) {
      next.preferredLocation = "Preferred job location is required.";
    }

    if (!values.workPreference.trim()) next.workPreference = "Work preference is required.";
    if (!values.salaryExpectation.trim()) next.salaryExpectation = "Salary expectation is required.";

    if (resumeFile === null) next.resume = "Resume is required (PDF or DOCX).";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadResult(null);
    if (!validate()) return;
    if (!resumeFile) return;

    const formData = new FormData();
    formData.append("resume", resumeFile);

    setIsUploading(true);
    setResumeStatus("Processing...");

    try {
      let finalResumeId = "";

      // If we already uploaded via autofill, use that ID. Otherwise, upload now.
      if (uploadResult && uploadResult.id) {
        finalResumeId = uploadResult.id;
      } else {
        setResumeStatus("Uploading resume...");
        const response = await fetch("/api/resume/upload", {
          method: "POST",
          body: formData,
        });

        const json = await response.json();
        if (!response.ok) {
          setResumeStatus(`Upload failed: ${json.error || response.statusText}`);
          return;
        }
        finalResumeId = json.id;
        
        // Ensure AI analysis runs so database is populated before orchestrator starts
        setResumeStatus("Analyzing resume profile...");
        await fetch("/api/resume/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeId: finalResumeId })
        });
      }

      setResumeStatus("Saving full profile to database...");

      // Submit full form data to new API endpoint
      const submitRes = await fetch("/api/job-seeker/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeProfileId: finalResumeId,
          ...values,
          skills
        })
      });

      const submitJson = await submitRes.json();
      if (!submitRes.ok) {
        throw new Error(submitJson.error || "Failed to save job seeker profile");
      }

      setResumeStatus("Upload successful. Redirecting to dashboard...");
      
      // Redirect to Dashboard with the new jobSeekerProfileId
      const queryParams = new URLSearchParams({
        jobSeekerProfileId: submitJson.data.id,
        resumeProfileId: finalResumeId,
        careerRoleId: values.targetJobRole,
        profileType: values.profileType
      }).toString();
      
      router.push(`/dashboard?${queryParams}`);
    } catch (error) {
      setResumeStatus(`Process failed: ${String(error)}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 px-6 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Link href="/" className="text-sky-400 hover:text-sky-300">Home</Link>
            <span>/</span>
            <span>Job Seeker</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold">Job Seeker Form</h1>
          <p className="max-w-3xl text-lg text-slate-300">Complete your professional profile so CareerPath AI can assist your job search.</p>
        </div>

        <div className="grid lg:grid-cols-[1.8fr_1fr] gap-8">
          <section className="rounded-3xl border border-slate-700 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/20">
            {/* Autofill Banner */}
            <div className="mb-8 rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-950/40 to-indigo-950/40 p-6 shadow-inner relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-sky-500/20 blur-3xl rounded-full"></div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <span>✨</span> Magic Autofill
              </h3>
              <p className="text-sm text-slate-300 mb-4 max-w-xl relative z-10">
                Save time! Upload your resume here and our AI will automatically extract your skills, education, and experience to pre-fill this form.
              </p>
              <div className="flex items-center gap-4 relative z-10">
                <input ref={autofillInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  handleAutofill(f);
                }} />
                <Button 
                  type="button" 
                  onClick={() => autofillInputRef.current?.click()}
                  disabled={isAutofilling}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                >
                  {isAutofilling ? "Reading Resume..." : "Upload & Autofill"}
                </Button>
                {autofillStatus && (
                  <span className={`text-sm ${autofillStatus.includes('failed') ? 'text-rose-400' : 'text-sky-300'} font-medium animate-pulse`}>
                    {autofillStatus}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="h-px bg-slate-800 flex-1"></div>
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">Or fill manually</div>
              <div className="h-px bg-slate-800 flex-1"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-emerald-400">Core Profiling</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Let's build your Professional profile</h2>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <FieldWrapper label="Profile Type" htmlFor="profileType" error={errors.profileType}>
                  <select 
                    id="profileType" 
                    value={values.profileType} 
                    onChange={(e) => handleChange("profileType", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 ring-offset-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                  >
                    <option value="">Select Profile/Industry Type</option>
                    <option value="Technical/IT">Technical & IT</option>
                    <option value="Healthcare/Medical">Healthcare & Medical</option>
                    <option value="Finance/Banking">Finance & Banking</option>
                    <option value="Legal/Law">Legal & Law</option>
                    <option value="Engineering/Core">Engineering (Core)</option>
                    <option value="Arts/Design">Arts & Design</option>
                    <option value="Sales/Marketing">Sales & Marketing</option>
                    <option value="Management/HR">Management & HR</option>
                    <option value="Education/Teaching">Education & Teaching</option>
                    <option value="Media/Journalism">Media & Journalism</option>
                    <option value="Other Non-Technical">Other Non-Technical</option>
                  </select>
                </FieldWrapper>
                <div />
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-sky-400">Career Information</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Tell us about your career</h2>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <FieldWrapper label="Career Goal" htmlFor="careerGoal" error={errors.careerGoal}>
                  <Input id="careerGoal" value={values.careerGoal} onChange={(e) => handleChange("careerGoal", e.target.value)} placeholder="e.g., Move into data engineering" />
                </FieldWrapper>
                <FieldWrapper label="Target Job Role" htmlFor="targetJobRole" error={errors.targetJobRole}>
                  <Input 
                    id="targetJobRole" 
                    value={values.targetJobRole} 
                    onChange={(e) => handleChange("targetJobRole", e.target.value)} 
                    placeholder="e.g., Prompt Engineer, Blockchain Dev" 
                  />
                </FieldWrapper>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <FieldWrapper label="Industry" htmlFor="industry" error={errors.industry}>
                  <Input id="industry" value={values.industry} onChange={(e) => handleChange("industry", e.target.value)} placeholder="e.g., Software, Finance" />
                </FieldWrapper>
                <FieldWrapper label="Qualification" htmlFor="qualification" error={errors.qualification}>
                  <Input id="qualification" value={values.qualification} onChange={(e) => handleChange("qualification", e.target.value)} placeholder="e.g., B.Tech, MBA" />
                </FieldWrapper>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <FieldWrapper label="Experience Level" htmlFor="experienceLevel" error={errors.experienceLevel}>
                  <select 
                    id="experienceLevel" 
                    value={values.experienceLevel} 
                    onChange={(e) => handleChange("experienceLevel", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 ring-offset-slate-950 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select experience</option>
                    {experienceOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </FieldWrapper>
                <div />
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-sky-400">Location & Salary</p>
                <h3 className="mt-3 text-lg font-medium text-white">Where are you and what do you expect?</h3>
              </div>
              
              <div className="grid gap-6 lg:grid-cols-2">
                <FieldWrapper label="Job Search Type" htmlFor="jobSearchType">
                  <RadioGroup 
                    name="jobSearchType" 
                    options={[
                      { value: "domestic", label: "Domestic" },
                      { value: "international", label: "International" }
                    ]} 
                    value={values.jobSearchType} 
                    onChange={(e) => {
                      handleChange("jobSearchType", e.target.value);
                      handleChange("salaryExpectation", ""); // reset salary selection
                    }} 
                  />
                </FieldWrapper>
                <div />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <FieldWrapper label="Current City" htmlFor="currentCity" error={errors.currentCity}>
                  <Input id="currentCity" value={values.currentCity} onChange={(e) => handleChange("currentCity", e.target.value)} placeholder="e.g., Mumbai" />
                </FieldWrapper>
                <FieldWrapper label="Current State" htmlFor="currentState" error={errors.currentState}>
                  <Input id="currentState" value={values.currentState} onChange={(e) => handleChange("currentState", e.target.value)} placeholder="e.g., Maharashtra" />
                </FieldWrapper>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {values.jobSearchType === "international" ? (
                  <FieldWrapper label="Preferred Country" htmlFor="preferredCountry" error={errors.preferredCountry}>
                    <Input id="preferredCountry" value={values.preferredCountry} onChange={(e) => handleChange("preferredCountry", e.target.value)} placeholder="e.g., USA, UK, Canada" />
                  </FieldWrapper>
                ) : (
                  <FieldWrapper label="Preferred Job Location" htmlFor="preferredLocation" error={errors.preferredLocation}>
                    <Input id="preferredLocation" value={values.preferredLocation} onChange={(e) => handleChange("preferredLocation", e.target.value)} placeholder="e.g., Remote / Bangalore" />
                  </FieldWrapper>
                )}
                <FieldWrapper label="Work Preference" htmlFor="workPreference" error={errors.workPreference}>
                  <RadioGroup name="workPref" options={workPrefs} value={values.workPreference} onChange={(e) => handleChange("workPreference", e.target.value)} />
                </FieldWrapper>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <FieldWrapper label="Salary Expectation" htmlFor="salaryExpectation" error={errors.salaryExpectation}>
                  <RadioGroup 
                    name="salary" 
                    options={values.jobSearchType === "international" ? salaryOptionsInternational : salaryOptionsDomestic} 
                    value={values.salaryExpectation} 
                    onChange={(e) => handleChange("salaryExpectation", e.target.value)} 
                  />
                </FieldWrapper>
                <div />
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-sky-400">Resume Upload</p>
                <h3 className="mt-3 text-lg font-medium text-white">Upload your resume (PDF or DOCX, max 5MB)</h3>
              </div>

              <div className="grid gap-6 lg:grid-cols-2 items-center">
                <div>
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    handleFile(f || null);
                  }} />
                  <div className="flex gap-3">
                    <Button type="button" onClick={() => fileInputRef.current?.click()}>Choose File</Button>
                    <div className="text-sm text-slate-300">
                      {resumeFile ? (
                        <div>
                          <div><strong>{resumeFile.name}</strong></div>
                          <div className="text-xs text-slate-400">{(resumeFile.size / 1024).toFixed(0)} KB</div>
                          <div className="text-xs text-emerald-300">{resumeStatus}</div>
                        </div>
                      ) : (
                        <div className="text-slate-400">No file chosen</div>
                      )}
                    </div>
                  </div>
                  {errors.resume ? <p className="text-xs text-rose-400 mt-2">{errors.resume}</p> : null}
                </div>
                <div />
              </div>

              {uploadResult ? (
                <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/80 p-5 text-slate-100">
                  <p className="text-sm font-semibold text-emerald-300">Upload Success</p>
                  <p className="mt-3 text-sm text-slate-300">File: <span className="font-medium text-white">{uploadResult.fileName}</span> ({(uploadResult.fileSize / 1024).toFixed(0)} KB)</p>
                  <div className="mt-4 text-sm">
                    <p className="font-medium text-slate-200">Extracted Text Preview</p>
                    <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-slate-950/90 p-3 text-xs text-slate-300">{uploadResult.extractedTextPreview || "No text extracted"}</pre>
                  </div>
                </div>
              ) : null}

              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-sky-400">Links</p>
                <h3 className="mt-3 text-lg font-medium text-white">Optional links</h3>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <FieldWrapper label="LinkedIn URL" htmlFor="linkedin" error={errors.linkedin}>
                  <Input id="linkedin" value={values.linkedin} onChange={(e) => handleChange("linkedin", e.target.value)} placeholder="https://linkedin.com/in/yourname" />
                </FieldWrapper>
                <FieldWrapper label="GitHub URL" htmlFor="github" error={errors.github}>
                  <Input id="github" value={values.github} onChange={(e) => handleChange("github", e.target.value)} placeholder="https://github.com/yourname" />
                </FieldWrapper>
                <FieldWrapper label="Portfolio URL" htmlFor="portfolio" error={errors.portfolio}>
                  <Input id="portfolio" value={values.portfolio} onChange={(e) => handleChange("portfolio", e.target.value)} placeholder="https://yourportfolio.com" />
                </FieldWrapper>
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-sky-400">Skills</p>
                <h3 className="mt-3 text-lg font-medium text-white">Add skills</h3>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="e.g., Python" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
                  <Button type="button" onClick={addSkill}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.length === 0 ? <div className="text-sm text-slate-400">No skills added</div> : null}
                  {skills.map((s) => (
                    <div key={s} className="inline-flex items-center gap-2 bg-slate-800/60 px-3 py-1 rounded-full text-sm">
                      <span>{s}</span>
                      <button type="button" onClick={() => removeSkill(s)} className="text-rose-400 hover:text-rose-300">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-8 pt-4 border-t border-slate-800">
                <p className="text-sm text-slate-400">Clicking generate will upload your resume and build your AI profile.</p>
                <Button type="submit" disabled={isUploading} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-sky-500/30 transition-all text-lg">
                  {isUploading ? "Generating..." : "Generate Career Plan"}
                </Button>
              </div>
            </form>
          </section>

          <aside className="rounded-3xl border border-slate-700 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/20">
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-sky-400">What you will provide</p>
                <h2 className="mt-4 text-3xl font-semibold text-white">Profile essentials</h2>
              </div>
              <ul className="space-y-4 text-sm text-slate-400">
                <li>• Career goals and target job role</li>
                <li>• Location preference and salary expectation</li>
                <li>• Resume upload (client-side validation only)</li>
                <li>• Skills and optional links</li>
              </ul>
              <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-5 text-slate-300">
                <p className="text-sm font-medium text-slate-100">Outcome</p>
                <p className="mt-3 text-sm leading-6">Once validated, this data can be submitted to a backend or used to drive job recommendations and profile matching.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const indianStates = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi NCR", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", 
  "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", 
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Anywhere in India"
];

const internationalCountries = [
  "USA", "UK", "Canada", "Australia", "New Zealand", "Germany", "France", 
  "Singapore", "Ireland", "Netherlands", "Sweden", "Switzerland", "Italy", "Any"
];

const getNearestMatch = (input: string, options: string[]) => {
  const normalizedInput = input.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!normalizedInput) return "";
  for (const option of options) {
    if (option.trim().toLowerCase().replace(/\s+/g, ' ').includes(normalizedInput)) return option;
  }
  let bestMatch = "";
  let highestScore = 0;
  for (const option of options) {
    const normalizedOption = option.trim().toLowerCase().replace(/\s+/g, ' ');
    let matchCount = 0;
    for (let i = 0, j = 0; i < normalizedInput.length && j < normalizedOption.length;) {
      if (normalizedInput[i] === normalizedOption[j]) { matchCount++; i++; j++; } else { j++; }
    }
    const score = matchCount / normalizedInput.length;
    if (score > highestScore && score >= 0.6) {
      highestScore = score;
      bestMatch = option;
    }
  }
  return bestMatch;
};

function HigherEducationFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formType = searchParams.get("type") || "domestic"; // default to domestic if not specified

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const locationContainerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    educationLevel: "12th",
    currentQualification: "", // For 12th/Diploma (e.g., PCM, PCB), UG (e.g., B.Tech CS)
    boardUniversity: "",
    percentage: "",
    passingYear: "",
    budget: "",
    careerGoal: "",
    preferredBranch: "", // New field for branch
    preferredStudyLocation: "",
    exam1Name: "", // Replaces entranceExams
    exam1Score: "",
    exam2Name: "",
    exam2Score: "",
    targetBoard: "", // Target Board or University Type
    tenthPercentage: "",
    twelfthPercentage: "",
    category: "General",
  });

  const [exams, setExams] = useState<Array<{ name: string; score: string }>>([
    { name: "", score: "" }
  ]);

  const handleAddExam = () => {
    setExams([...exams, { name: "", score: "" }]);
  };

  const handleRemoveExam = (index: number) => {
    setExams(exams.filter((_, i) => i !== index));
  };

  const handleExamChange = (index: number, field: 'name' | 'score', value: string) => {
    const newExams = [...exams];
    newExams[index][field] = value;
    setExams(newExams);
  };

  const examOptions = [
    { value: "None (Applying via Board Marks)", label: "None (Applying via Board Marks)" },
    { value: "JEE Main", label: "JEE Main" },
    { value: "JEE Advanced", label: "JEE Advanced" },
    { value: "NEET", label: "NEET" },
    { value: "CUET", label: "CUET" },
    { value: "SAT", label: "SAT" },
    { value: "BITSAT", label: "BITSAT" },
    { value: "CAT", label: "CAT" },
    { value: "GATE", label: "GATE" },
    { value: "GRE", label: "GRE" },
    { value: "GMAT", label: "GMAT" },
    { value: "IELTS", label: "IELTS" },
    { value: "TOEFL", label: "TOEFL" },
    { value: "State CET", label: "State CET" },
    { value: "Other", label: "Other Exam" }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    
    if (name === "preferredStudyLocation") {
      setLocationError("");
      const val = value;
      const options = formType === "international" ? internationalCountries : indianStates;
      const normalized = val.trim().toLowerCase().replace(/\s+/g, ' ');
      const exactMatch = options.find(o => o.trim().toLowerCase().replace(/\s+/g, ' ') === normalized);
      
      if (!exactMatch && val.length > 3) {
        const nearest = getNearestMatch(val, options);
        if (!nearest) {
          setLocationError(formType === "international" 
            ? "You are currently on the International page; please only search for global locations."
            : "You are currently on the Domestic page; please only search for Indian locations.");
        }
      }
    }
  };

  const handleLocationBlur = () => {
    // Delay hiding suggestions to allow click
    setTimeout(() => setShowSuggestions(false), 200);
    
    if (!formData.preferredStudyLocation) return;
    const options = formType === "international" ? internationalCountries : indianStates;
    const normalized = formData.preferredStudyLocation.trim().toLowerCase().replace(/\s+/g, ' ');
    const exactMatch = options.find(o => o.trim().toLowerCase().replace(/\s+/g, ' ') === normalized);
    
    if (!exactMatch) {
      const nearest = getNearestMatch(formData.preferredStudyLocation, options);
      if (nearest) {
        setFormData(prev => ({ ...prev, preferredStudyLocation: nearest }));
        setLocationError("");
      } else {
        setLocationError(formType === "international" 
          ? "You are currently on the International page; please only search for global locations."
          : "You are currently on the Domestic page; please only search for Indian locations.");
      }
    }
  };

  const activeOptions = formType === "international" ? internationalCountries : indianStates;
  const filteredOptions = activeOptions.filter(opt => {
    const val = formData.preferredStudyLocation;
    if (!val) return true;
    const normalized = val.trim().toLowerCase().replace(/\s+/g, ' ');
    const normOpt = opt.trim().toLowerCase().replace(/\s+/g, ' ');
    return normOpt.includes(normalized);
  });

  const handleEducationLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ 
      ...formData, 
      educationLevel: e.target.value,
      currentQualification: "", // Reset context-dependent fields
      careerGoal: ""
    });
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full Name is required.";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full Name must be at least 2 characters.";
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email Address is required.";
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }
    
    const phoneRegex = /^(\+?\d{1,3}[- ]?)?\d{10}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone Number is required.";
    } else if (!phoneRegex.test(formData.phone.trim().replace(/[-\s]/g, ''))) {
      newErrors.phone = "Please enter a valid 10-digit phone number.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep1 = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (locationError) {
      alert("Please fix the location error before submitting.");
      return;
    }
    setLoading(true);
    try {
      const examsCombined = exams
        .filter(e => e.name && e.score)
        .map(e => `${e.name}: ${e.score}`)
        .join(" | ");

      const qualificationData = examsCombined 
        ? `${formData.currentQualification} (Exams: ${examsCombined})` 
        : formData.currentQualification;

      const response = await fetch("/api/higher-education/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...formData,
          formType,
          currentQualification: formData.currentQualification,
          entranceExams: examsCombined,
          careerGoal: `${formData.careerGoal} ${formData.preferredBranch ? `(Branch: ${formData.preferredBranch})` : ''} ${formData.targetBoard ? `(Board: ${formData.targetBoard})` : ''}`.trim(),
          percentage: parseFloat(formData.percentage) || null,
          tenthPercentage: parseFloat(formData.tenthPercentage) || null,
          twelfthPercentage: parseFloat(formData.twelfthPercentage) || null,
          category: formData.category
        }),
      });
      const data = await response.json();
      if (data.success) {
        router.push(`/dashboard/student?profileId=${data.profileId}`);
      } else {
        alert("Error saving profile: " + data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-sky-500/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-2xl w-full bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="mb-4">
          <Link href="/" className="inline-block text-sky-400 hover:text-sky-300 transition-colors">
            ← Back to Home
          </Link>
        </div>
        <div className="flex justify-between items-center mb-8 border-b border-slate-700/50 pb-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
            AI Pathway Builder
          </h2>
          <div className="text-slate-400 text-sm font-medium">Step {step} of 3</div>
        </div>
        
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h3 className="text-xl font-semibold mb-1 text-slate-100">Personal Details</h3>
              <p className="text-sm text-slate-400 mb-6">Let's start with your basic information.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Full Name *</label>
                <input 
                  className={`w-full bg-slate-800/50 border ${errors.fullName ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-600 focus:border-sky-500 focus:ring-sky-500'} focus:ring-1 rounded-xl p-3.5 transition-all outline-none`} 
                  name="fullName" 
                  placeholder="Enter your full name" 
                  onChange={handleChange} 
                  value={formData.fullName} 
                  required 
                />
                {errors.fullName && (
                  <p className="text-xs text-rose-400 mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {errors.fullName}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Email Address *</label>
                  <input 
                    className={`w-full bg-slate-800/50 border ${errors.email ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-600 focus:border-sky-500 focus:ring-sky-500'} focus:ring-1 rounded-xl p-3.5 transition-all outline-none`} 
                    name="email" 
                    type="email" 
                    placeholder="john@example.com" 
                    onChange={handleChange} 
                    value={formData.email} 
                    required 
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-400 mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      {errors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Phone Number *</label>
                  <input 
                    className={`w-full bg-slate-800/50 border ${errors.phone ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-600 focus:border-sky-500 focus:ring-sky-500'} focus:ring-1 rounded-xl p-3.5 transition-all outline-none`} 
                    name="phone" 
                    placeholder="+91 9876543210" 
                    onChange={handleChange} 
                    value={formData.phone} 
                    required 
                  />
                  {errors.phone && (
                    <p className="text-xs text-rose-400 mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <button className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 p-4 rounded-xl font-bold transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 group" onClick={handleNextStep1}>
                Continue to Academics
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h3 className="text-xl font-semibold mb-1 text-slate-100">Academic Background</h3>
              <p className="text-sm text-slate-400 mb-6">Tell us about your current education level.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Current Education Level</label>
                <select className="w-full bg-slate-800/50 border border-slate-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl p-3.5 transition-all outline-none appearance-none" name="educationLevel" onChange={handleEducationLevelChange} value={formData.educationLevel}>
                  <option value="10th">10th Standard Pass</option>
                  <option value="12th">12th Standard Pass</option>
                  <option value="Diploma">Diploma Holder</option>
                  <option value="UG">Undergraduate (Bachelor's)</option>
                  <option value="PG">Postgraduate (Master's)</option>
                </select>
              </div>

              {formData.educationLevel !== "10th" && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">
                    {formData.educationLevel === "12th" ? "Stream (e.g., PCM, PCB, Commerce)" : "Degree & Branch (e.g., B.Tech CS, B.Com)"}
                  </label>
                  <input className="w-full bg-slate-800/50 border border-slate-600 focus:border-sky-500 rounded-xl p-3.5 outline-none" name="currentQualification" placeholder={formData.educationLevel === "12th" ? "PCM, Commerce, Arts..." : "B.Tech Computer Science..."} onChange={handleChange} value={formData.currentQualification} />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Board / University</label>
                <input className="w-full bg-slate-800/50 border border-slate-600 focus:border-sky-500 rounded-xl p-3.5 outline-none" name="boardUniversity" placeholder="CBSE, State Board, Delhi University..." onChange={handleChange} value={formData.boardUniversity} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Score (Percentage/CGPA)</label>
                  <input className="w-full bg-slate-800/50 border border-slate-600 focus:border-sky-500 rounded-xl p-3.5 outline-none" name="percentage" type="number" step="0.1" placeholder="e.g. 85.5 or 8.5" onChange={handleChange} value={formData.percentage} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Passing Year</label>
                  <input className="w-full bg-slate-800/50 border border-slate-600 focus:border-sky-500 rounded-xl p-3.5 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" name="passingYear" type="text" maxLength={4} pattern="\d*" placeholder="2024" onChange={(e) => { e.target.value = e.target.value.replace(/\D/g, ''); handleChange(e); }} value={formData.passingYear} />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button className="w-1/3 bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded-xl font-bold transition-all text-slate-300" onClick={() => setStep(1)}>Back</button>
              <button className="w-2/3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 p-4 rounded-xl font-bold transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 group" onClick={() => setStep(3)}>
                Next Step
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h3 className="text-xl font-semibold mb-1 text-slate-100">Future Goals & Preferences</h3>
              <p className="text-sm text-slate-400 mb-6">Help the AI tailor the perfect pathway for you.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Professional Career Goal</label>
                  <input className="w-full bg-slate-800/50 border border-emerald-500/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl p-3.5 outline-none" name="careerGoal" placeholder={formData.educationLevel === "10th" ? "Science, Commerce, Arts..." : "Software Engineer, Doctor, CA..."} onChange={handleChange} value={formData.careerGoal} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">
                    {formData.educationLevel === "10th" ? "Preferred Stream (11th) / Subject" : "Preferred Branch (Optional)"}
                  </label>
                  <input className="w-full bg-slate-800/50 border border-slate-600 focus:border-sky-500 rounded-xl p-3.5 outline-none transition-all placeholder-slate-500" name="preferredBranch" placeholder={formData.educationLevel === "10th" ? "e.g. PCM, PCB, Commerce" : "e.g. Computer Science, Finance"} onChange={handleChange} value={formData.preferredBranch} />
                </div>
              </div>

              {["12th", "Diploma", "UG", "PG"].includes(formData.educationLevel) && (
                <div className="space-y-4 bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-sky-400">Competitive Entrance Exams (Optional)</label>
                    <button
                      type="button"
                      onClick={handleAddExam}
                      className="text-xs bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 px-3 py-1.5 rounded-lg transition-colors font-semibold"
                    >
                      + Add Exam
                    </button>
                  </div>
                  
                  {exams.map((exam, index) => (
                    <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-4 items-end bg-slate-800/20 p-3 rounded-xl border border-slate-800 relative group/row animate-in fade-in slide-in-from-top-2 duration-300">
                      <div>
                        <label className="block text-[10px] font-medium text-slate-400 mb-1 ml-1">Exam Name</label>
                        <select 
                          className="w-full bg-slate-800/80 border border-slate-600 focus:border-sky-500 rounded-xl p-3 outline-none transition-all text-sm appearance-none" 
                          value={exam.name}
                          onChange={(e) => handleExamChange(index, 'name', e.target.value)}
                        >
                          <option value="">Select Exam</option>
                          {examOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-400 mb-1 ml-1">Score / Rank / %ile</label>
                        <input 
                          className="w-full bg-slate-800/80 border border-slate-600 focus:border-sky-500 rounded-xl p-3 outline-none transition-all text-sm" 
                          placeholder="e.g. 45000 Rank" 
                          value={exam.score}
                          onChange={(e) => handleExamChange(index, 'score', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center justify-center">
                        {exams.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveExam(index)}
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-700/50 hover:border-rose-500/20 p-2.5 rounded-xl transition-all"
                            title="Remove exam"
                          >
                            🗑️
                          </button>
                        ) : (
                          <div className="w-[38px]"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {["10th"].includes(formData.educationLevel) && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Target Board (Optional)</label>
                  <input className="w-full bg-slate-800/50 border border-slate-600 focus:border-sky-500 rounded-xl p-3.5 outline-none transition-all placeholder-slate-500" name="targetBoard" placeholder="e.g. CBSE, ICSE, IB, State Board" onChange={handleChange} value={formData.targetBoard} />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Max Budget</label>
                <input className="w-full bg-slate-800/50 border border-slate-600 focus:border-sky-500 rounded-xl p-3.5 outline-none transition-all placeholder-slate-500" name="budget" placeholder="e.g. 10 Lakhs, 50k USD, No limit" onChange={handleChange} value={formData.budget} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">
                  {formType === "international" ? "Global Target Location" : "Domestic Target Location"}
                </label>
                <div className="relative" ref={locationContainerRef}>
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                    <span className="text-slate-400 text-lg">{formType === "international" ? "🌍" : "🇮🇳"}</span>
                  </div>
                  <input 
                    type="text" 
                    className={`w-full pl-11 bg-slate-800/50 border ${locationError ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-600 focus:border-sky-500 focus:ring-sky-500'} focus:ring-1 rounded-xl p-3.5 outline-none transition-all placeholder-slate-500`}
                    name="preferredStudyLocation" 
                    placeholder={formType === "international" ? "Type any country (e.g. USA, UK)" : "Type any Indian state (e.g. Delhi NCR)"}
                    onChange={(e) => {
                      handleChange(e);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={handleLocationBlur}
                    value={formData.preferredStudyLocation}
                    autoComplete="off"
                  />
                  {showSuggestions && filteredOptions.length > 0 && (
                    <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-700 bg-slate-800 shadow-xl p-1">
                      {filteredOptions.map((option) => (
                        <li
                          key={option}
                          className="cursor-pointer rounded-lg px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, preferredStudyLocation: option }));
                            setLocationError("");
                            setShowSuggestions(false);
                          }}
                        >
                          {option}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {locationError && <p className="text-xs text-rose-400 mt-2 ml-1">{locationError}</p>}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button className="w-1/3 bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded-xl font-bold transition-all text-slate-300" onClick={() => setStep(2)}>Back</button>
              <button className="w-2/3 relative overflow-hidden group bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 p-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 text-white" onClick={handleSubmit} disabled={loading}>
                <div className="absolute inset-0 w-full h-full bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500"></div>
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <>
                      <span className="animate-spin text-xl">⏳</span> Processing AI...
                    </>
                  ) : (
                    <>
                      <span className="text-xl">✨</span> Generate AI Roadmap
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HigherEducationForm() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><p className="text-white text-xl">Loading...</p></div>}>
      <HigherEducationFormContent />
    </Suspense>
  );
}

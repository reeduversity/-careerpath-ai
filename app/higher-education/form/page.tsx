"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HigherEducationForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

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
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEducationLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ 
      ...formData, 
      educationLevel: e.target.value,
      currentQualification: "", // Reset context-dependent fields
      careerGoal: ""
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let examsCombined = "";
      if (formData.exam1Name && formData.exam1Score) {
        examsCombined += `${formData.exam1Name}: ${formData.exam1Score}`;
      }
      if (formData.exam2Name && formData.exam2Score) {
        examsCombined += examsCombined ? ` | ${formData.exam2Name}: ${formData.exam2Score}` : `${formData.exam2Name}: ${formData.exam2Score}`;
      }

      const qualificationData = examsCombined 
        ? `${formData.currentQualification} (Exams: ${examsCombined})` 
        : formData.currentQualification;

      const response = await fetch("/api/higher-education/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...formData, 
          currentQualification: formData.currentQualification,
          entranceExams: examsCombined,
          careerGoal: `${formData.careerGoal} ${formData.preferredBranch ? `(Branch: ${formData.preferredBranch})` : ''} ${formData.targetBoard ? `(Board: ${formData.targetBoard})` : ''}`.trim(),
          percentage: parseFloat(formData.percentage) || null
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
                <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Full Name</label>
                <input className="w-full bg-slate-800/50 border border-slate-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl p-3.5 transition-all outline-none" name="fullName" placeholder="Enter your full name" onChange={handleChange} value={formData.fullName} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Email Address</label>
                  <input className="w-full bg-slate-800/50 border border-slate-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl p-3.5 transition-all outline-none" name="email" type="email" placeholder="john@example.com" onChange={handleChange} value={formData.email} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Phone Number</label>
                  <input className="w-full bg-slate-800/50 border border-slate-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl p-3.5 transition-all outline-none" name="phone" placeholder="+91 9876543210" onChange={handleChange} value={formData.phone} />
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <button className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 p-4 rounded-xl font-bold transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 group" onClick={() => setStep(2)}>
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
                  <input className="w-full bg-slate-800/50 border border-slate-600 focus:border-sky-500 rounded-xl p-3.5 outline-none" name="passingYear" type="number" placeholder="2024" onChange={handleChange} value={formData.passingYear} />
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
                  <label className="block text-sm font-semibold text-sky-400 mb-2">Competitive Entrance Exams (Optional)</label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Exam 1 Name</label>
                      <select className="w-full bg-slate-800/80 border border-slate-600 focus:border-sky-500 rounded-xl p-3 outline-none transition-all placeholder-slate-500 text-sm appearance-none" name="exam1Name" onChange={handleChange} value={formData.exam1Name}>
                        <option value="">Select Exam</option>
                        <option value="None (Applying via Board Marks)">None (Applying via Board Marks)</option>
                        <option value="JEE Main">JEE Main</option>
                        <option value="JEE Advanced">JEE Advanced</option>
                        <option value="NEET">NEET</option>
                        <option value="CUET">CUET</option>
                        <option value="SAT">SAT</option>
                        <option value="BITSAT">BITSAT</option>
                        <option value="CAT">CAT</option>
                        <option value="GATE">GATE</option>
                        <option value="GRE">GRE</option>
                        <option value="GMAT">GMAT</option>
                        <option value="Other">Other Exam</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Score / Rank / %ile</label>
                      <input className="w-full bg-slate-800/80 border border-slate-600 focus:border-sky-500 rounded-xl p-3 outline-none transition-all placeholder-slate-500 text-sm" name="exam1Score" placeholder="e.g. 45000 Rank" onChange={handleChange} value={formData.exam1Score} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Exam 2 Name</label>
                      <select className="w-full bg-slate-800/80 border border-slate-600 focus:border-sky-500 rounded-xl p-3 outline-none transition-all placeholder-slate-500 text-sm appearance-none" name="exam2Name" onChange={handleChange} value={formData.exam2Name}>
                        <option value="">Select Exam</option>
                        <option value="None (Applying via Board Marks)">None (Applying via Board Marks)</option>
                        <option value="JEE Advanced">JEE Advanced</option>
                        <option value="CUET">CUET</option>
                        <option value="State CET">State CET</option>
                        <option value="Other">Other Exam</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Score / Rank / %ile</label>
                      <input className="w-full bg-slate-800/80 border border-slate-600 focus:border-sky-500 rounded-xl p-3 outline-none transition-all placeholder-slate-500 text-sm" name="exam2Score" placeholder="e.g. 750 Score" onChange={handleChange} value={formData.exam2Score} />
                    </div>
                  </div>
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
                <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Global Target Location</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-lg">🌍</span>
                  </div>
                  <input 
                    type="text" 
                    className="w-full pl-11 bg-slate-800/50 border border-slate-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl p-3.5 outline-none transition-all placeholder-slate-500" 
                    name="preferredStudyLocation" 
                    placeholder="Type any city, state, or country (e.g. London, UK)" 
                    onChange={handleChange} 
                    value={formData.preferredStudyLocation} 
                  />
                </div>
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

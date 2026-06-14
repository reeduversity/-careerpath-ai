"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldWrapper, Input, RadioGroup } from "@/components/ui/form";

export default function ExamPrepForm() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [values, setValues] = useState({
    stage: "",
    sector: "",
    examName: "",
    hours: "",
    budget: "",
    category: "General",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setValues((s) => ({ ...s, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!values.stage) next.stage = "Please select your current educational stage.";
    if (!values.sector) next.sector = "Please select your target sector.";
    if (!values.hours) next.hours = "Please select study hours.";
    if (!values.budget) next.budget = "Please select your budget.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsGenerating(true);

    const queryParams = new URLSearchParams(values as Record<string, string>).toString();
    router.push(`/exam-prep/dashboard?${queryParams}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-4 text-center">
          <Link href="/exam-prep" className="inline-block text-sky-400 hover:text-sky-300 transition-colors mb-4">
            ← Back to Exam Prep
          </Link>
          <h1 className="text-4xl md:text-5xl font-black text-white">Your Prep Profile</h1>
          <p className="text-slate-400">Tell us where you are so our AI can build your personalized roadmap.</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-8 md:grid-cols-2">
              <FieldWrapper label="Current Education Stage" htmlFor="stage" error={errors.stage}>
                <select 
                  id="stage" 
                  value={values.stage} 
                  onChange={(e) => handleChange("stage", e.target.value)}
                  className="flex h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-slate-100 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select Stage</option>
                  <option value="After 10th">After 10th</option>
                  <option value="After 12th">After 12th</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Undergraduate (UG)">Undergraduate (UG)</option>
                  <option value="Postgraduate (PG)">Postgraduate (PG)</option>
                  <option value="Technical Degree (B.Tech/MBBS)">Technical Degree (B.Tech/MBBS)</option>
                </select>
              </FieldWrapper>

              <FieldWrapper label="Target Sector" htmlFor="sector" error={errors.sector}>
                <select 
                  id="sector" 
                  value={values.sector} 
                  onChange={(e) => handleChange("sector", e.target.value)}
                  className="flex h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-slate-100 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select Sector</option>
                  <option value="Civil Services (UPSC/State PSC)">Civil Services (UPSC/State PSC)</option>
                  <option value="Defense (NDA/CDS/AFCAT)">Defense (NDA/CDS/AFCAT)</option>
                  <option value="Banking & Finance (IBPS/SBI/RBI)">Banking & Finance (IBPS/SBI/RBI)</option>
                  <option value="Staff Selection Commission (SSC)">Staff Selection Commission (SSC)</option>
                  <option value="Engineering Services (ESE/GATE/PSU)">Engineering Services (ESE/GATE/PSU)</option>
                  <option value="Teaching & Academia (NET/CTET)">Teaching & Academia (NET/CTET)</option>
                  <option value="Railways (RRB)">Railways (RRB)</option>
                  <option value="International/Global Government Exams">International/Global Govt Exams</option>
                  <option value="Undecided (Recommend for me)">Undecided (Recommend for me)</option>
                </select>
              </FieldWrapper>

              <FieldWrapper label="Specific Exam Target (Optional)" htmlFor="examName" error={errors.examName}>
                <Input 
                  id="examName" 
                  value={values.examName} 
                  onChange={(e) => handleChange("examName", e.target.value)} 
                  placeholder="e.g., UPSC CSE, SSC CGL, NDA" 
                  className="h-12 bg-slate-950 rounded-xl"
                />
              </FieldWrapper>

              <FieldWrapper label="Category" htmlFor="category">
                <select 
                  id="category" 
                  value={values.category} 
                  onChange={(e) => handleChange("category", e.target.value)}
                  className="flex h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-slate-100 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="EWS">EWS</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="PwD">PwD (Person with Disability)</option>
                </select>
              </FieldWrapper>
            </div>

            <div className="grid gap-8 md:grid-cols-2 pt-4 border-t border-slate-800">
              <FieldWrapper label="Daily Study Hours Available" htmlFor="hours" error={errors.hours}>
                <RadioGroup 
                  name="hours" 
                  options={[
                    { value: "2-4 hours", label: "2-4 hours (Part-time prep)" },
                    { value: "5-8 hours", label: "5-8 hours (Dedicated)" },
                    { value: "8+ hours", label: "8+ hours (Full-time rigorous)" }
                  ]} 
                  value={values.hours} 
                  onChange={(e) => handleChange("hours", e.target.value)} 
                />
              </FieldWrapper>

              <FieldWrapper label="Preparation Budget" htmlFor="budget" error={errors.budget}>
                <RadioGroup 
                  name="budget" 
                  options={[
                    { value: "Self-Study", label: "Self-Study (Free/YouTube)" },
                    { value: "Low", label: "Low (Affordable online courses)" },
                    { value: "High", label: "High (Premium offline coaching)" }
                  ]} 
                  value={values.budget} 
                  onChange={(e) => handleChange("budget", e.target.value)} 
                />
              </FieldWrapper>
            </div>

            <div className="pt-8 border-t border-slate-800 text-center">
              <Button type="submit" disabled={isGenerating} className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold py-4 px-12 rounded-2xl shadow-xl shadow-rose-500/20 text-xl w-full md:w-auto h-16 transition-all transform hover:scale-105">
                {isGenerating ? "Analyzing Patterns..." : "Generate Master Roadmap"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

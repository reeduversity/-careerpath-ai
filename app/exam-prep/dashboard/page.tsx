"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";

function ExamDashboardContent() {
  const searchParams = useSearchParams();
  const stage = searchParams.get("stage") || "";
  const sector = searchParams.get("sector") || "";
  const examName = searchParams.get("examName") || "";
  const hours = searchParams.get("hours") || "";
  const budget = searchParams.get("budget") || "";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!stage || !sector) {
      setError("Missing parameters. Please fill the form first.");
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        const res = await fetch("/api/exam-prep/orchestrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage, sector, examName, hours, budget })
        });
        
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to generate roadmap");
        }
        setData(json.data);
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [stage, sector, examName, hours, budget]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-rose-400 space-y-4 px-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-3xl font-bold text-white">Oops, something went wrong</h1>
        <p className="max-w-md">{error}</p>
        <Link href="/exam-prep/form" className="mt-8 px-6 py-3 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors">
          Return to Form
        </Link>
      </div>
    );
  }

  if (!data) return null;

  if (data.hasContradiction) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-amber-400 space-y-4 px-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-3xl font-bold text-white">Input Contradiction Detected</h1>
        <div className="max-w-md text-slate-300 space-y-2">
          {(data.contradictions || []).map((c: string, idx: number) => (
            <p key={idx}>{c}</p>
          ))}
        </div>
        <Link href="/exam-prep/form" className="mt-8 px-6 py-3 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors">
          Return to Form
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 px-6 py-12 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link href="/" className="text-sky-400 hover:text-sky-300">Home</Link>
          <span>/</span>
          <Link href="/exam-prep" className="text-sky-400 hover:text-sky-300">Exam Prep</Link>
          <span>/</span>
          <span className="text-slate-200">Dashboard</span>
        </div>

        {/* Master AI Header */}
        <div className="text-center space-y-6">
          <div className="inline-block px-4 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-sm font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(14,165,233,0.2)]">
            {stage} • {sector}
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white drop-shadow-xl">Your <span className="text-amber-500">Master Blueprint</span></h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">AI-generated roadmap perfectly calibrated to your {hours} availability and {budget} budget.</p>
        </div>

        {/* Recommended Exams */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-6 border-b border-slate-800 pb-2">Top Target Exams</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(data.recommendedExams || []).map((exam: any, i: number) => (
              <div key={i} className="bg-slate-900/80 border-t-4 border-amber-500 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full group-hover:bg-amber-500/20 transition-all"></div>
                <h3 className="text-xl font-bold text-white mb-2">{exam.name}</h3>
                <span className={`text-xs px-2 py-1 rounded font-bold mb-4 inline-block ${exam.difficulty.includes("High") || exam.difficulty.includes("Hard") ? "bg-rose-500/20 text-rose-400" : "bg-sky-500/20 text-sky-400"}`}>
                  {exam.difficulty} Difficulty
                </span>
                <p className="text-sm text-slate-300 mb-2"><strong>Eligibility:</strong> {exam.eligibility}</p>
                <p className="text-sm text-slate-300"><strong>Attempts:</strong> {exam.attemptsLeft}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-6 border-b border-slate-800 pb-2">Phase-by-Phase Roadmap</h2>
          <div className="space-y-6">
            {(data.roadmap || []).map((step: any, i: number) => (
              <div key={i} className="flex flex-col md:flex-row gap-6 bg-slate-900/50 border border-slate-700/50 p-6 rounded-2xl relative overflow-hidden">
                <div className="md:w-1/4 border-r border-slate-700/50 pr-6">
                  <h3 className="text-xl font-bold text-sky-400 mb-1">{step.phase}</h3>
                  <p className="text-sm text-slate-400 font-bold tracking-wider uppercase">⏱️ {step.duration}</p>
                </div>
                <div className="md:w-3/4">
                  <p className="text-lg text-slate-200 mb-2"><strong>Focus:</strong> {step.focusArea}</p>
                  <p className="text-emerald-400 font-medium">🎯 Milestone: {step.milestone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coaching & Resources Grid */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Institutes */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border border-slate-700 p-8 shadow-xl">
            <h3 className="text-2xl font-bold text-amber-400 mb-6 flex items-center gap-3">
              <span className="text-3xl">🏢</span> Institutes & Coaching
            </h3>
            <ul className="space-y-6">
              {(data.institutes || []).map((inst: any, i: number) => (
                <li key={i} className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-bold text-slate-100">{inst.name}</h4>
                    <span className="text-xs font-bold px-2 py-1 rounded bg-slate-700 text-slate-300">{inst.type}</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{inst.description}</p>
                  <p className="text-sm font-semibold text-rose-400 mb-2">💰 {inst.costEstimate}</p>
                  {inst.officialWebsite && inst.officialWebsite !== "N/A" && (
                    <a 
                      href={inst.officialWebsite.startsWith('http') ? inst.officialWebsite : `https://${inst.officialWebsite}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-sky-400 hover:text-sky-300 hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      🔗 Official Website
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border border-slate-700 p-8 shadow-xl">
            <h3 className="text-2xl font-bold text-sky-400 mb-6 flex items-center gap-3">
              <span className="text-3xl">📚</span> Essential Resources
            </h3>
            <ul className="space-y-4">
              {(data.studyResources || []).map((res: any, i: number) => (
                <li key={i} className="flex items-center gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                  <span className="text-2xl">{res.type.toLowerCase().includes('book') ? '📖' : '📺'}</span>
                  <div>
                    <h4 className="font-bold text-slate-200">{res.title}</h4>
                    {res.link && res.link !== "N/A" && (
                      <a href={res.link.startsWith('http') ? res.link : `https://${res.link}`} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:underline cursor-pointer block mt-1">
                        {res.link}
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Future Plan */}
        <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full"></div>
          <h2 className="text-3xl font-bold text-white mb-8 relative z-10">Future Outcomes</h2>
          
          <div className="grid md:grid-cols-2 gap-8 relative z-10">
            <div className="bg-slate-900/80 p-6 rounded-2xl border-l-4 border-emerald-500">
              <h3 className="text-xl font-bold text-emerald-400 mb-3">Plan A: Selection</h3>
              <p className="text-slate-300 leading-relaxed">{data.futurePlan?.ifSelected}</p>
            </div>
            <div className="bg-slate-900/80 p-6 rounded-2xl border-l-4 border-amber-500">
              <h3 className="text-xl font-bold text-amber-400 mb-3">Plan B: Safety Net</h3>
              <p className="text-slate-300 leading-relaxed">{data.futurePlan?.planB}</p>
            </div>
          </div>
        </div>

        {/* Why Do This? */}
        <div className="text-center pt-8">
          <h3 className="text-sm font-bold tracking-[0.3em] uppercase text-rose-500 mb-4">Why Keep Pushing?</h3>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {(data.positiveAspects || []).map((aspect: string, i: number) => (
              <span key={i} className="bg-slate-800 text-slate-200 px-4 py-2 rounded-full border border-slate-700 shadow-lg text-sm">
                ✨ {aspect}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ExamDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ExamDashboardContent />
    </Suspense>
  );
}

"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";

function StudentDashboardContent() {
  const searchParams = useSearchParams();
  const profileId = searchParams.get("profileId");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCollege, setSelectedCollege] = useState<any>(null);

  useEffect(() => {
    if (!profileId) {
      setError("Missing profileId in URL.");
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        const response = await fetch("/api/higher-education/orchestrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId })
        });
        
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.message || "Failed to fetch recommendations");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while generating your education plan.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [profileId]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-rose-400 space-y-4 px-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-3xl font-bold text-white">Oops, something went wrong</h1>
        <p className="max-w-md">{error}</p>
        <Link href="/higher-education/form" className="mt-8 px-6 py-3 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors">
          Return to Input Form
        </Link>
      </div>
    );
  }

  if (!data) return null;

  if (data.hasContradiction) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-amber-400 space-y-4 px-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-3xl font-bold text-white">Profile Contradiction Detected</h1>
        <div className="max-w-md text-slate-300 space-y-2">
          {(data.contradictions || []).map((c: string, idx: number) => (
            <p key={idx}>{c}</p>
          ))}
        </div>
        <Link href="/higher-education/form" className="mt-8 px-6 py-3 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors">
          Return to Input Form
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 px-6 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation / Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link href="/" className="text-sky-400 hover:text-sky-300">Home</Link>
          <span>/</span>
          <Link href="/higher-education" className="text-sky-400 hover:text-sky-300">Higher Education</Link>
          <span>/</span>
          <span className="text-slate-200">Dashboard</span>
        </div>

        {/* Header */}
        <div className="w-full rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-xl shadow-slate-950/20 text-center mb-8">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-400 font-medium mb-3">AI Education Pathway</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Your Personalized Master Plan
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">Based on your academic profile and interests, our AI has curated the perfect next steps for your educational journey.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Streams & Careers */}
          <div className="space-y-8 lg:col-span-1">
            {/* Recommended Streams */}
            {(data.recommendedStreams && data.recommendedStreams.length > 0) && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-sky-400 mb-4 flex items-center gap-2">
                  <span>📚</span> Recommended Paths
                </h3>
                <div className="space-y-4">
                  {data.recommendedStreams.map((stream: any, idx: number) => (
                    <div key={idx} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <h4 className="font-semibold text-slate-200 mb-1">{stream.name}</h4>
                      <p className="text-xs text-slate-400">{stream.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Career Pathways */}
            {(data.careerPathways && data.careerPathways.length > 0) && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
                  <span>🎯</span> Future Careers
                </h3>
                <ul className="space-y-3">
                  {data.careerPathways.map((career: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                      <span className="mt-0.5 text-emerald-500">→</span>
                      <span>{career}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column - Colleges & Scholarships */}
          <div className="space-y-8 lg:col-span-2">
            {/* Top Colleges */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-2xl font-bold text-indigo-400 mb-6 flex items-center gap-2">
                <span>🏛️</span> Top College Matches
              </h3>
              <div className="space-y-4">
                {(data.recommendedColleges || []).map((college: any, idx: number) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedCollege(college)}
                    className="bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all cursor-pointer rounded-xl p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="space-y-1 relative z-10 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">{college.collegeName}</h4>
                        {college.category && (
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                            college.category.toLowerCase().includes('dream') ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' :
                            college.category.toLowerCase().includes('target') ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {college.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 flex items-center gap-1">
                        <span>📍</span> {college.location}
                      </p>
                      <p className="text-sm font-medium text-amber-400 flex items-center gap-1 mt-2">
                        <span>💰</span> Est. Fees: {college.fees}
                      </p>
                      {college.officialWebsite && college.officialWebsite !== "N/A" && (
                        <a 
                          href={college.officialWebsite.startsWith('http') ? college.officialWebsite : `https://${college.officialWebsite}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs text-sky-400 hover:text-sky-300 hover:underline cursor-pointer inline-flex items-center gap-1 mt-2 relative z-20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          🔗 Visit Official Website
                        </a>
                      )}
                      <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity block w-fit">
                        View Deep Insights →
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col gap-4 md:gap-2 w-full md:w-auto text-right relative z-10">
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex-1 md:flex-none">
                        <div className="text-xs text-slate-400 mb-1">Match Score</div>
                        <div className="text-xl font-bold text-emerald-400">{college.matchPercentage}%</div>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex-1 md:flex-none">
                        <div className="text-xs text-slate-400 mb-1">Admission Prob.</div>
                        <div className="text-xl font-bold text-sky-400">{college.admissionProbability}%</div>
                      </div>
                    </div>
                  </div>
                ))}
                {(data.recommendedColleges || []).length === 0 && (
                  <p className="text-slate-400">No college data available.</p>
                )}
              </div>
            </div>

            {/* Scholarships */}
            {(data.scholarships && data.scholarships.length > 0) && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
                  <span>🏆</span> Available Scholarships
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.scholarships.map((scholarship: any, idx: number) => (
                    <div key={idx} className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl">
                      <h4 className="font-bold text-amber-300 mb-1">{scholarship.name}</h4>
                      <p className="text-sm font-medium text-slate-200 mb-2">{scholarship.amount}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{scholarship.eligibility}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* Full-width Admission Process Timeline */}
        {(data.admissionProcess && data.admissionProcess.length > 0) && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl mt-8">
            <h3 className="text-3xl font-bold text-rose-400 mb-2 flex items-center gap-3">
              <span>🎓</span> Complete Admission Roadmap
            </h3>
            <p className="text-slate-400 mb-8 max-w-2xl">Follow these chronological steps to secure your admission. This timeline is customized based on your target location and education level.</p>
            
            <div className="relative border-l-2 border-slate-700 ml-4 md:ml-6 space-y-8 pb-4">
              {data.admissionProcess.map((stepInfo: any, idx: number) => (
                <div key={idx} className="relative pl-8 md:pl-10">
                  <span className="absolute -left-[11px] top-1 h-5 w-5 rounded-full bg-rose-500 ring-4 ring-slate-900"></span>
                  <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl hover:border-rose-500/50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                      <h4 className="text-lg font-bold text-slate-100">{stepInfo.step}</h4>
                      <span className="inline-flex items-center rounded-md bg-rose-400/10 px-2 py-1 text-xs font-medium text-rose-400 ring-1 ring-inset ring-rose-400/20 whitespace-nowrap">
                        {stepInfo.timeline}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{stepInfo.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Deep Insights Modal */}
        {selectedCollege && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 md:p-8 bg-gradient-to-br from-indigo-900/40 to-slate-900 border-b border-slate-800 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{selectedCollege.collegeName}</h2>
                  <p className="text-slate-400 flex items-center gap-2"><span>📍</span> {selectedCollege.location}</p>
                </div>
                <button 
                  onClick={() => setSelectedCollege(null)}
                  className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full p-2 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                {/* Placements Grid */}
                <div>
                  <h3 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
                    <span>📈</span> Placement & ROI Stats
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-center">
                      <div className="text-sm text-slate-400 mb-1">Average Package</div>
                      <div className="text-2xl font-bold text-emerald-300">{selectedCollege.deepDetails?.averagePackage || "N/A"}</div>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-center">
                      <div className="text-sm text-slate-400 mb-1">Highest Package</div>
                      <div className="text-2xl font-bold text-sky-300">{selectedCollege.deepDetails?.highestPackage || "N/A"}</div>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-center">
                      <div className="text-sm text-slate-400 mb-1">Placement Rate</div>
                      <div className="text-2xl font-bold text-amber-300">{selectedCollege.deepDetails?.placementPercentage || "N/A"}</div>
                    </div>
                  </div>
                </div>

                {/* Recruiters & Curriculum */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-bold text-indigo-400 mb-3 flex items-center gap-2">
                      <span>👔</span> Top Recruiters
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(selectedCollege.deepDetails?.topRecruiters || ["Data pending"]).map((recruiter: string, i: number) => (
                        <span key={i} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm px-3 py-1.5 rounded-lg">
                          {recruiter}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-rose-400 mb-3 flex items-center gap-2">
                      <span>📚</span> Curriculum Highlights
                    </h3>
                    <ul className="space-y-2">
                      {(selectedCollege.deepDetails?.curriculumHighlights || ["Data pending"]).map((highlight: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="text-rose-500 mt-0.5">•</span> {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

export default function StudentDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <StudentDashboardContent />
    </Suspense>
  );
}

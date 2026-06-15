"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { orchestrateCareer } from "@/lib/api";

import CareerHeader from "@/components/dashboard/CareerHeader";
import SkillGapCard from "@/components/dashboard/SkillGapCard";
import RoadmapChart from "@/components/dashboard/RoadmapChart";
import ActionableCards from "@/components/dashboard/ActionableCards";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";

function DashboardContent() {
  const searchParams = useSearchParams();
  const resumeProfileId = searchParams.get("resumeProfileId");
  const careerRoleId = searchParams.get("careerRoleId");
  const jobInterest = searchParams.get("jobInterest") || undefined;
  const examName = searchParams.get("examName") || undefined;
  const profileType = searchParams.get("profileType") || undefined;
  const jobSeekerProfileId = searchParams.get("jobSeekerProfileId") || undefined;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!resumeProfileId || !careerRoleId) {
      setError("Missing resumeProfileId or careerRoleId in URL.");
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        const result = await orchestrateCareer(
          resumeProfileId as string, 
          careerRoleId as string,
          jobInterest,
          examName,
          profileType,
          jobSeekerProfileId
        );
        setData(result);
      } catch (err: any) {
        setError(err.message || "An error occurred while generating your career plan.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [resumeProfileId, careerRoleId, jobInterest, examName, profileType, jobSeekerProfileId]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-rose-400 space-y-4 px-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-3xl font-bold text-white">Oops, something went wrong</h1>
        <p className="max-w-md">{error}</p>
        <Link href="/job-seeker" className="mt-8 px-6 py-3 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors">
          Return to Input Form
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const omni = data.omniData || {};
  const safeArray = (val: any) => Array.isArray(val) ? val : (typeof val === 'string' ? [val] : []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 px-6 py-12 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Navigation / Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link href="/" className="text-sky-400 hover:text-sky-300">Home</Link>
          <span>/</span>
          <Link href="/job-seeker" className="text-sky-400 hover:text-sky-300">Job Seeker</Link>
          <span>/</span>
          <span className="text-slate-200">Job Seeker Dashboard</span>
        </div>

        {/* Master AI Header with Gamification */}
        <div>
          <CareerHeader 
            role={data.careerRole} 
            salary={data.salaryRange} 
            resumeProfileId={resumeProfileId as string} 
            atsScore={data.atsScore}
            resumeFeedback={data.resumeFeedback}
          />
          {omni.gamification && (
            <div className="flex justify-center -mt-12 relative z-20 mb-8">
              <div className="bg-slate-800 border border-slate-700 rounded-full px-6 py-3 shadow-xl shadow-slate-950/50 flex items-center gap-6">
                <div className="text-amber-400 font-bold flex items-center gap-2">
                  <span className="text-2xl">⚡</span> {omni.gamification.xp || 500} XP
                </div>
                <div className="h-6 w-px bg-slate-600"></div>
                <div className="flex gap-2">
                  {safeArray(omni.gamification.badges || ["Beginner"]).map((badge: string, idx: number) => (
                    <span key={idx} className="bg-sky-500/20 text-sky-300 text-xs px-3 py-1 rounded-full border border-sky-500/30">
                      🏅 {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Readiness & Market Intelligence */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-indigo-900/50 to-slate-900 rounded-3xl p-8 border border-indigo-500/30 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full"></div>
            <h3 className="text-2xl font-bold text-white mb-6 relative z-10">Job Readiness Score</h3>
            <div className="flex items-center gap-6 relative z-10">
              <div className="text-7xl font-black text-indigo-400 drop-shadow-md">{omni.readinessScore?.score || 40}%</div>
              <div>
                <p className="text-slate-300 text-sm mb-2"><strong>Weak Areas:</strong> {safeArray(omni.readinessScore?.weakAreas).join(", ") || "None"}</p>
                <p className="text-indigo-200 text-sm bg-indigo-950/50 p-3 rounded-lg border border-indigo-500/20">{omni.readinessScore?.improvementPlan}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-900/50 to-slate-900 rounded-3xl p-8 border border-emerald-500/30 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full"></div>
            <h3 className="text-2xl font-bold text-white mb-6 relative z-10">Market Intelligence (2026+)</h3>
            <div className="space-y-4 relative z-10">
              <p className="text-slate-300 text-sm bg-slate-950/50 p-4 rounded-xl border border-slate-700">{omni.marketIntelligence?.futureDemand}</p>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2 block">Trending Skills</span>
                <div className="flex flex-wrap gap-2">
                  {safeArray(omni.marketIntelligence?.trendingSkills).map((s: string, i: number) => (
                    <span key={i} className="bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-full border border-emerald-500/30">🔥 {s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CAREER MATCH ENGINE */}
        <div className="relative">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-white tracking-wider">CAREER MATCH ENGINE</h2>
            <p className="text-slate-400 mt-2">Explore the best job roles, expected salaries, and top hiring companies.</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-900 rounded-3xl border-2 border-sky-500/30 overflow-hidden shadow-2xl shadow-sky-900/20">
              <div className="bg-sky-950/50 p-6 border-b border-sky-500/30 text-center">
                <span className="text-4xl block mb-2">🏢</span>
                <h3 className="text-2xl font-bold text-sky-400">Industry Match</h3>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <h4 className="text-sm uppercase tracking-widest text-slate-500 font-bold mb-3">Top Matching Roles</h4>
                  <ul className="space-y-2">
                    {safeArray(omni.privateJobPath?.roles || data.jobRoles).map((r: string, i: number) => (
                      <li key={i} className="bg-slate-800/50 px-4 py-3 rounded-lg text-slate-200 font-medium border border-slate-700/50 flex items-center gap-3">
                        <span className="text-sky-500">→</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-slate-950 rounded-xl p-5 border border-slate-800">
                  <h4 className="text-sm uppercase tracking-widest text-slate-500 font-bold mb-1">Expected Salary</h4>
                  <p className="text-xl text-emerald-400 font-bold">{omni.privateJobPath?.salaryEstimate || data.salaryRange}</p>
                </div>
                <div>
                  <h4 className="text-sm uppercase tracking-widest text-slate-500 font-bold mb-3">Top Hiring Companies</h4>
                  <div className="flex flex-wrap gap-2">
                    {safeArray(omni.privateJobPath?.topCompanies).map((c: string, i: number) => (
                      <span key={i} className="bg-slate-800 text-slate-300 text-sm px-4 py-2 rounded-lg border border-slate-700">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Netflix-Style Learning Path */}
        {safeArray(omni.netflixLearningPath?.series).length > 0 && (
          <div className="bg-slate-950 py-10 px-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-500/10 blur-3xl rounded-full"></div>
            <h2 className="text-3xl font-black text-white tracking-wider mb-8 relative z-10">BINGE LEARNING SERIES <span className="text-rose-500 ml-2">▶</span></h2>
            
            <div className="flex overflow-x-auto pb-8 gap-6 snap-x relative z-10 custom-scrollbar">
              {safeArray(omni.netflixLearningPath?.series).map((series: any, i: number) => (
                <div key={i} className="min-w-[300px] sm:min-w-[400px] bg-slate-900 rounded-2xl border border-slate-700 p-6 snap-center hover:scale-[1.02] transition-transform shadow-xl">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-between">
                    {series.title} <span className="text-rose-500 text-sm">Series {i+1}</span>
                  </h3>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar-y">
                    {safeArray(series.episodes).map((ep: string, j: number) => (
                      <a key={j} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ep + ' tutorial')}`} target="_blank" rel="noopener noreferrer" className="flex gap-4 items-start group cursor-pointer hover:bg-slate-800/50 p-2 rounded-lg transition-colors -ml-2">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-rose-500 group-hover:text-white transition-colors shrink-0">
                          {j+1}
                        </div>
                        <p className="text-sm text-slate-300 mt-1 leading-relaxed group-hover:text-white group-hover:underline transition-colors">{ep}</p>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skill Gap & Actions */}
        {(safeArray(data.skillGap?.missingSkills).length > 0 || safeArray(data.skillGap?.existingSkills).length > 0) && (
          <SkillGapCard 
            existing={safeArray(data.skillGap?.existingSkills)} 
            missing={safeArray(data.skillGap?.missingSkills)} 
          />
        )}
        {(safeArray(data.certifications).length > 0 || safeArray(data.projects).length > 0 || safeArray(data.jobRoles).length > 0) && (
          <ActionableCards 
            certifications={safeArray(data.certifications)} 
            projects={safeArray(data.projects)} 
            jobRoles={safeArray(data.jobRoles)} 
          />
        )}

        {/* High Level Roadmap */}
        {safeArray(data.roadmap).length > 0 && (
          <RoadmapChart roadmap={safeArray(data.roadmap)} />
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f172a; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #f43f5e; 
        }
        .custom-scrollbar-y::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar-y::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar-y::-webkit-scrollbar-thumb {
          background: #334155; 
          border-radius: 10px;
        }
        .custom-scrollbar-y::-webkit-scrollbar-thumb:hover {
          background: #f43f5e; 
        }
      `}} />
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

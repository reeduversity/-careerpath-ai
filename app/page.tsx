import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-sky-500/20 blur-[120px] rounded-full mix-blend-screen opacity-70 animate-pulse-slow"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] bg-emerald-500/10 blur-[120px] rounded-full mix-blend-screen opacity-50 animate-pulse-slow delay-1000"></div>
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] bg-indigo-500/20 blur-[120px] rounded-full mix-blend-screen opacity-60 animate-pulse-slow delay-2000"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 mix-blend-overlay"></div>
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl space-y-16 w-full relative z-10 mt-12">
        {/* Header */}
        <div className="space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-700/50 backdrop-blur-md shadow-xl mb-4 hover:border-slate-500/50 transition-colors">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
            </span>
            <span className="text-xs uppercase tracking-[0.3em] text-slate-300 font-bold">Welcome to the future of careers</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent drop-shadow-2xl">
            CareerPath <span className="bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="text-xl md:text-3xl text-slate-400 font-light max-w-3xl mx-auto leading-relaxed">
            The ultimate intelligence engine for your <br className="hidden md:block"/> professional and academic journey.
          </p>
        </div>

        {/* Path Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto pt-8">
          {/* Higher Education Path */}
          <Link href="/higher-education" className="group">
            <div className="h-full rounded-[2rem] border border-slate-700/50 bg-slate-900/40 backdrop-blur-2xl p-10 hover:border-sky-500/50 hover:bg-slate-800/60 shadow-2xl hover:shadow-sky-500/20 transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="flex flex-col h-full justify-between space-y-8 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/30 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                    <span className="text-5xl drop-shadow-lg">🎓</span>
                  </div>
                  <div className="w-12 h-12 rounded-full border border-slate-700 flex items-center justify-center group-hover:bg-sky-500 group-hover:border-sky-400 transition-all duration-300 text-slate-400 group-hover:text-white group-hover:translate-x-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  <h2 className="text-3xl font-black text-white group-hover:text-sky-400 transition-colors tracking-tight">
                    Higher Education
                  </h2>
                  <p className="text-slate-400 text-base leading-relaxed font-medium">
                    Master your academic future. AI-driven stream selection, college matching, and entrance exam blueprints.
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-800 flex flex-wrap gap-2">
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">College Match</span>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">Exam Prep</span>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">Admissions</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Job Seeker Path */}
          <Link href="/job-seeker" className="group">
            <div className="h-full rounded-[2rem] border border-slate-700/50 bg-slate-900/40 backdrop-blur-2xl p-10 hover:border-emerald-500/50 hover:bg-slate-800/60 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="flex flex-col h-full justify-between space-y-8 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                    <span className="text-5xl drop-shadow-lg">💼</span>
                  </div>
                  <div className="w-12 h-12 rounded-full border border-slate-700 flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-400 transition-all duration-300 text-slate-400 group-hover:text-white group-hover:translate-x-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  <h2 className="text-3xl font-black text-white group-hover:text-emerald-400 transition-colors tracking-tight">
                    Job Seeker
                  </h2>
                  <p className="text-slate-400 text-base leading-relaxed font-medium">
                    Accelerate your career. ATS optimization, salary intelligence, skill gap analysis, and global job matchmaking.
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-800 flex flex-wrap gap-2">
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">ATS Optimizer</span>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">Salary Intel</span>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">Skill Gap AI</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center pt-24 pb-8 relative z-10">
          <p className="text-slate-500 text-xs tracking-[0.2em] uppercase font-semibold">
            Engineered for excellence • Powered by advanced AI models
          </p>
        </div>
      </div>
    </main>
  );
}

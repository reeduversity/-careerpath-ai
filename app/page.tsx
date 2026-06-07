import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 flex flex-col items-center justify-center px-6 py-12">
      {/* Hero Section */}
      <div className="max-w-5xl space-y-16 w-full">
        {/* Header */}
        <div className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-400 font-medium">Welcome to</p>
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
            CareerPath AI
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 font-light">
            Your personal AI-powered career guidance platform
          </p>
          <p className="text-base text-slate-400 max-w-2xl mx-auto">
            Choose your path and get personalized recommendations, roadmaps, and opportunities tailored to your goals.
          </p>
        </div>

        {/* Path Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 w-full">
          {/* Higher Education Path */}
          <Link href="/higher-education" className="group">
            <div className="h-full rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-8 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-300 cursor-pointer">
              <div className="flex flex-col h-full justify-between space-y-6">
                {/* Icon Section */}
                <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-sky-500/10 border border-sky-500/30 group-hover:bg-sky-500/20 transition-colors">
                  <span className="text-4xl">🎓</span>
                </div>

                {/* Content */}
                <div className="space-y-3 flex-1">
                  <h2 className="text-2xl font-bold text-slate-100 group-hover:text-sky-400 transition-colors">
                    Higher Education
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Get expert guidance for your educational journey. Whether you're choosing a stream, college, or preparing for entrance exams.
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2 text-xs text-slate-500">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                    Stream & Course Recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                    College Matching
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                    Exam Preparation Guidance
                  </li>
                </ul>

                {/* CTA */}
                <div className="text-center w-full mt-6 px-6 py-3 rounded-lg bg-sky-500 text-white font-semibold hover:bg-sky-600 transition-colors group-hover:shadow-lg group-hover:shadow-sky-500/30">
                  Explore →
                </div>
              </div>
            </div>
          </Link>

          {/* Job Seeker Path */}
          <Link href="/job-seeker" className="group">
            <div className="h-full rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-8 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 cursor-pointer">
              <div className="flex flex-col h-full justify-between space-y-6">
                {/* Icon Section */}
                <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-emerald-500/10 border border-emerald-500/30 group-hover:bg-emerald-500/20 transition-colors">
                  <span className="text-4xl">💼</span>
                </div>

                {/* Content */}
                <div className="space-y-3 flex-1">
                  <h2 className="text-2xl font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                    Job Seeker
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Advance your career with the ultimate AI Blueprint. Prepare for Private MNCs and Global Jobs all in one place.
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2 text-xs text-slate-400">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <strong className="text-slate-300">Job Profiles:</strong> IT, Medical, Law, Finance, etc.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <strong className="text-slate-300">ATS Score & Optimizer:</strong> Resume analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <strong className="text-slate-300">Binge Learning:</strong> Netflix-style skills path
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <strong className="text-slate-300">Gamification:</strong> XP & Readiness Badges
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <strong className="text-slate-300">Global Intel:</strong> 2026+ Job Market Trends
                  </li>
                </ul>

                {/* CTA */}
                <div className="text-center w-full mt-6 px-6 py-3 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors group-hover:shadow-lg group-hover:shadow-emerald-500/30">
                  Build Career Blueprint →
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center space-y-3 border-t border-slate-700 pt-12">
          <p className="text-slate-400 text-sm">
            Powered by AI • Tailored for Your Success
          </p>
        </div>
      </div>
    </main>
  );
}


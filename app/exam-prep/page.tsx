import Link from "next/link";

export default function ExamPrepLanding() {
  const positivePoints = [
    { icon: "🛡️", title: "Unmatched Job Security", desc: "Government jobs offer long-term stability and protection against economic downturns." },
    { icon: "🌟", title: "Massive Respect & Prestige", desc: "Serve the nation and earn immense respect in society and among peers." },
    { icon: "⚖️", title: "Work-Life Balance", desc: "Regulated working hours, guaranteed holidays, and comprehensive leave policies." },
    { icon: "💰", title: "Incredible Perks", desc: "Housing, medical benefits, pensions, and travel allowances." }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 px-6 py-12 overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <div className="space-y-6 text-center pt-8">
          <Link href="/" className="inline-block text-sky-400 hover:text-sky-300 transition-colors mb-4">
            ← Back to Home
          </Link>
          <div className="inline-block px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm font-bold tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            Elite Preparation Engine
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white drop-shadow-xl">
            Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-500">Government Exams</span>
          </h1>
          <p className="max-w-3xl mx-auto text-xl text-slate-300 leading-relaxed">
            Whether you are in 10th, 12th, UG, PG, or hold a Technical Degree, our AI generates the ultimate roadmap for National and International Government Exams.
          </p>
          <div className="pt-8">
            <Link href="/exam-prep/form">
              <button className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-lg shadow-xl shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-105 transition-all duration-300">
                Generate My Custom Roadmap 🚀
              </button>
            </Link>
          </div>
        </div>

        {/* Why Govt Exams */}
        <div className="pt-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-4">Why Choose Government Services?</h2>
            <p className="text-slate-400">Discover the incredible benefits of dedicating your career to public service.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {positivePoints.map((pt, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-700/50 rounded-3xl p-8 hover:border-amber-500/30 hover:bg-slate-800/80 transition-all duration-300 group">
                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform origin-left">{pt.icon}</div>
                <h3 className="text-xl font-bold text-slate-100 mb-3">{pt.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{pt.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Path Grid */}
        <div className="pt-12 pb-12 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-3xl bg-amber-500/5 blur-[120px] rounded-full pointer-events-none"></div>
          
          <div className="text-center mb-10 relative z-10">
            <h2 className="text-3xl font-bold text-white mb-4">Roadmaps Tailored To Your Stage</h2>
            <p className="text-slate-400">Our AI adapts to your current qualification level.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {[
              { level: "After 10th", desc: "Start early! NDA, SSC CHSL foundation, Railway apprenticeships." },
              { level: "After 12th", desc: "NDA, SSC CHSL, State Police, and early preparation for UPSC." },
              { level: "After Diploma", desc: "SSC JE, State Engineering Services, PSU Junior Engineer roles." },
              { level: "After UG", desc: "UPSC CSE, SSC CGL, Banking (IBPS/SBI), State PSCs." },
              { level: "After PG", desc: "RBI Grade B, Assistant Professor (NET), Special Officer roles." },
              { level: "Technical Degree", desc: "Engineering Services Exam (ESE), GATE for PSUs, ISRO/DRDO." }
            ].map((stage, i) => (
              <div key={i} className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 rounded-2xl p-6 shadow-lg shadow-slate-950/50">
                <h3 className="text-lg font-bold text-sky-400 mb-2">{stage.level}</h3>
                <p className="text-sm text-slate-300">{stage.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}

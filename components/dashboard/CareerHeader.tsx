export default function CareerHeader({ 
  role, 
  salary, 
  resumeProfileId,
  atsScore = 0,
  resumeFeedback = ""
}: { 
  role: string; 
  salary: string; 
  resumeProfileId?: string;
  atsScore?: number;
  resumeFeedback?: string;
}) {
  const scoreColor = atsScore >= 80 ? "text-emerald-400 border-emerald-500/30" 
                   : atsScore >= 50 ? "text-amber-400 border-amber-500/30" 
                   : "text-rose-400 border-rose-500/30";

  return (
    <div className="w-full rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-xl shadow-slate-950/20 mb-8 relative overflow-hidden">
      {/* Background glow for high scores */}
      {atsScore >= 80 && <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full" />}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
        <div className="text-left space-y-4 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-400 font-medium">AI Career Transformation</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            {role}
          </h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
            <div className="inline-flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-5 py-2.5 rounded-full font-semibold tracking-wide whitespace-nowrap shadow-lg shadow-emerald-500/10 flex-shrink-0 backdrop-blur-md">
              <span className="text-lg drop-shadow-md">💰</span> {salary}
            </div>
            
            {resumeProfileId && (
              <a 
                href={`/api/resume/export/${resumeProfileId}`} 
                download
                className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-lg shadow-sky-500/25 whitespace-nowrap flex-shrink-0 active:scale-95"
              >
                <span className="text-lg drop-shadow-md">📄</span> Download ATS Resume
              </a>
            )}
          </div>
        </div>

        {/* ATS Score & Feedback Box */}
        <div className="bg-slate-950/60 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-slate-950/50 w-full md:w-auto md:min-w-[360px] flex flex-col items-center text-center relative overflow-hidden group hover:border-slate-600/50 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/80 z-0 pointer-events-none"></div>
          <div className="text-xs text-slate-400 uppercase tracking-[0.2em] font-bold mb-3 z-10">Resume ATS Match</div>
          <div className={`text-7xl font-black ${scoreColor.split(' ')[0]} drop-shadow-2xl mb-2 tracking-tighter z-10`}>
            {atsScore}%
          </div>
          <p className="text-sm text-slate-400 mb-6 px-4 z-10 font-medium">
            Match score against target role requirements
          </p>
          
          <div className={`text-sm text-slate-300 bg-slate-900/80 backdrop-blur-md border ${scoreColor.split(' ')[1]} p-4 rounded-2xl w-full z-10 shadow-inner leading-relaxed`}>
            <strong className="block mb-2 text-white font-bold tracking-wide uppercase text-xs">🤖 AI Feedback:</strong>
            {resumeFeedback}
          </div>
        </div>
      </div>
    </div>
  );
}

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
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full font-medium">
              <span>💰</span> {salary}
            </div>
            
            {resumeProfileId && (
              <a 
                href={`http://localhost:4000/api/resume/export/${resumeProfileId}`} 
                download
                className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-full font-medium transition-colors shadow-lg shadow-sky-500/20"
              >
                <span>📄</span> Download ATS Resume
              </a>
            )}
          </div>
        </div>

        {/* ATS Score & Feedback Box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-inner w-full md:w-auto md:min-w-[320px] flex flex-col items-center text-center">
          <div className="text-sm text-slate-400 uppercase tracking-widest font-semibold mb-2">Resume ATS Match</div>
          <div className={`text-6xl font-black ${scoreColor.split(' ')[0]} drop-shadow-md mb-2`}>
            {atsScore}%
          </div>
          <p className="text-xs text-slate-400 mb-4 px-4">
            Match score against target role requirements
          </p>
          
          <div className={`text-sm text-slate-300 bg-slate-900 border ${scoreColor.split(' ')[1]} p-3 rounded-xl w-full`}>
            <strong className="block mb-1 text-white">AI Feedback:</strong>
            {resumeFeedback}
          </div>
        </div>
      </div>
    </div>
  );
}

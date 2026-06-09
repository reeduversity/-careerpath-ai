import React from "react";

const ActionableCards = React.memo(function ActionableCards({
  certifications,
  projects,
  jobRoles
}: {
  certifications: string[];
  projects: string[];
  jobRoles: string[];
}) {
  return (
    <div className="grid lg:grid-cols-3 gap-8 w-full">
      {/* Certifications */}
      <div className="rounded-3xl border border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 p-8 shadow-xl shadow-slate-950/40 relative overflow-hidden group hover:border-amber-500/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full group-hover:bg-amber-500/20 transition-all"></div>
        <h3 className="text-xl font-bold text-amber-400 mb-6 flex items-center gap-3">
          <span className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">🏆</span> 
          Genuine Certifications
        </h3>
        {certifications.length === 0 ? (
          <div className="bg-slate-800/40 rounded-xl p-6 text-center border border-slate-700/50 mt-4">
            <p className="text-slate-300 font-medium">No certifications required</p>
            <p className="text-slate-500 text-sm mt-1">Your skills already meet the industry standard.</p>
          </div>
        ) : (
          <ul className="space-y-4 relative z-10">
            {certifications.map((cert: any, idx) => {
              const certName = typeof cert === 'string' ? cert : cert.name;
              const certUrl = typeof cert === 'object' && cert.url && cert.url !== 'N/A' 
                ? cert.url 
                : `https://www.google.com/search?q=${encodeURIComponent(certName + ' certification')}`;
              
              return (
                <a key={idx} href={certUrl} target="_blank" rel="noopener noreferrer" className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-amber-500/30 rounded-xl p-4 text-sm text-slate-200 transition-all shadow-inner cursor-pointer block">
                  <div className="flex items-start gap-3">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span className="font-medium tracking-wide leading-relaxed hover:text-amber-400 hover:underline">{certName}</span>
                  </div>
                </a>
              );
            })}
          </ul>
        )}
      </div>

      {/* Projects */}
      <div className="rounded-3xl border border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 p-8 shadow-xl shadow-slate-950/40 relative overflow-hidden group hover:border-sky-500/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-3xl rounded-full group-hover:bg-sky-500/20 transition-all"></div>
        <h3 className="text-xl font-bold text-sky-400 mb-6 flex items-center gap-3">
          <span className="bg-sky-500/10 p-2 rounded-lg border border-sky-500/20">💻</span> 
          Resume-Worthy Projects
        </h3>
        {projects.length === 0 ? (
          <div className="bg-slate-800/40 rounded-xl p-6 text-center border border-slate-700/50 mt-4">
            <p className="text-slate-300 font-medium">Profile is strong</p>
            <p className="text-slate-500 text-sm mt-1">No additional portfolio projects are strictly necessary.</p>
          </div>
        ) : (
          <ul className="space-y-4 relative z-10">
            {projects.map((proj, idx) => (
              <a key={idx} href={`https://github.com/search?q=${encodeURIComponent(proj)}&type=repositories`} target="_blank" rel="noopener noreferrer" className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-sky-500/30 rounded-xl p-4 text-sm text-slate-200 transition-all shadow-inner cursor-pointer block">
                <div className="flex items-start gap-3">
                  <span className="text-sky-500 mt-0.5">🚀</span>
                  <span className="font-medium tracking-wide leading-relaxed hover:text-sky-400 hover:underline">{proj}</span>
                </div>
              </a>
            ))}
          </ul>
        )}
      </div>

      {/* Job Roles */}
      <div className="rounded-3xl border border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 p-8 shadow-xl shadow-slate-950/40 relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full group-hover:bg-emerald-500/20 transition-all"></div>
        <h3 className="text-xl font-bold text-emerald-400 mb-6 flex items-center gap-3">
          <span className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">💼</span> 
          Matched Job Roles
        </h3>
        {jobRoles.length === 0 ? (
          <div className="bg-slate-800/40 rounded-xl p-6 text-center border border-slate-700/50 mt-4">
            <p className="text-slate-300 font-medium">No direct matches</p>
            <p className="text-slate-500 text-sm mt-1">AI is actively searching for optimized career transitions.</p>
          </div>
        ) : (
          <ul className="space-y-4 relative z-10">
            {jobRoles.map((role, idx) => (
              <a key={idx} href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(role)}`} target="_blank" rel="noopener noreferrer" className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/30 rounded-xl p-4 text-sm text-slate-200 transition-all shadow-inner group/item cursor-pointer block">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-500 font-bold group-hover/item:translate-x-1 transition-transform">→</span>
                  <span className="font-semibold tracking-wide hover:text-emerald-400 hover:underline">{role}</span>
                </div>
              </a>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
});

export default ActionableCards;

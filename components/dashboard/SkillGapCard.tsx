import React from "react";

const SkillGapCard = React.memo(function SkillGapCard({ existing, missing }: { existing: string[]; missing: string[] }) {
  console.log("Rendered: SkillGapCard");
  return (
    <div className="w-full rounded-3xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-xl p-8 shadow-2xl shadow-slate-950/50 hover:bg-slate-900/80 transition-colors duration-500">
      <h2 className="text-2xl font-semibold text-white mb-6">Skill Gap Analysis</h2>
      <div className="grid md:grid-cols-2 gap-8">
        {/* Existing Skills */}
        <div className="space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-2">
            <span>✓</span> Existing Skills
          </h3>
          <div className="flex flex-wrap gap-2 mt-4">
            {existing.length === 0 && (
              <div className="w-full bg-slate-800/40 rounded-xl p-6 text-center border border-slate-700/50">
                <span className="text-3xl mb-3 block">📊</span>
                <p className="text-slate-300 font-medium">No mapped skills found</p>
                <p className="text-slate-500 text-sm mt-1">Upload a more detailed resume to let our AI discover your existing skills.</p>
              </div>
            )}
            {existing.map((skill: any, idx) => {
              const skillName = typeof skill === 'string' ? skill : (skill.skill || skill.name || JSON.stringify(skill));
              return (
              <span key={idx} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3 py-1 rounded-full text-sm">
                {skillName}
              </span>
            )})}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-rose-400 font-semibold flex items-center gap-2">
            <span>✕</span> Missing Skills
          </h3>
          <div className="flex flex-wrap gap-2 mt-4">
            {missing.length === 0 && (
              <div className="w-full bg-slate-800/40 rounded-xl p-6 text-center border border-slate-700/50">
                <span className="text-3xl mb-3 block">🌟</span>
                <p className="text-slate-300 font-medium">You have all required skills!</p>
                <p className="text-slate-500 text-sm mt-1">Your profile perfectly matches the requirements for this career role.</p>
              </div>
            )}
            {missing.map((skill: any, idx) => {
              const skillName = typeof skill === 'string' ? skill : (skill.skill || skill.name || JSON.stringify(skill));
              return (
              <span key={idx} className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3 py-1 rounded-full text-sm">
                {skillName}
              </span>
            )})}
          </div>
        </div>
      </div>
    </div>
  );
});

export default SkillGapCard;

import React from "react";

const LearningPathTimeline = React.memo(function LearningPathTimeline({ path }: { path: any[] }) {
  console.log("Rendered: LearningPathTimeline");
  if (!path || path.length === 0) {
    return (
      <div className="w-full rounded-3xl border border-slate-700 bg-slate-900/90 p-8 shadow-xl text-center">
        <h2 className="text-2xl font-semibold text-white mb-6">Learning Framework</h2>
        <div className="bg-slate-800/40 rounded-xl p-8 max-w-lg mx-auto border border-slate-700/50">
          <span className="text-4xl mb-4 block">🎓</span>
          <p className="text-slate-300 font-medium text-lg">No learning path generated</p>
          <p className="text-slate-500 mt-2">Our AI calculates custom learning paths when it detects missing skills. Right now, your profile is perfectly aligned with the requirements!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-3xl border border-slate-700 bg-slate-900/90 p-8 shadow-xl">
      <h2 className="text-2xl font-semibold text-white mb-8">Learning Paths for Missing Skills</h2>
      <div className="space-y-12">
        {path.map((item, idx) => (
          <div key={idx} className="space-y-4">
            <h3 className="text-xl font-medium text-sky-400 border-b border-slate-800 pb-2">{item.skill}</h3>
            
            <div className="relative pl-8 space-y-6 before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-slate-800">
              {/* Beginner */}
              <div className="relative">
                <div className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full bg-slate-400 border-2 border-slate-900" />
                <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-1">Beginner</h4>
                <p className="text-slate-400 text-sm">{item.beginner.join(", ")}</p>
              </div>

              {/* Intermediate */}
              <div className="relative">
                <div className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full bg-sky-400 border-2 border-slate-900" />
                <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-1">Intermediate</h4>
                <p className="text-slate-400 text-sm">{item.intermediate.join(", ")}</p>
              </div>

              {/* Advanced */}
              <div className="relative">
                <div className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
                <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-1">Advanced</h4>
                <p className="text-slate-400 text-sm">{item.advanced.join(", ")}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default LearningPathTimeline;

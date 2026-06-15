import React from "react";

const RoadmapChart = React.memo(function RoadmapChart({ roadmap }: { roadmap: any[] }) {
  console.log("Rendered: RoadmapChart");
  if (!roadmap || roadmap.length === 0) return null;

  return (
    <div className="w-full rounded-3xl border border-slate-700 bg-slate-900/90 p-8 shadow-xl">
      <h2 className="text-2xl font-semibold text-white mb-8">Career Roadmap</h2>
      <div className="flex flex-col md:flex-row justify-between relative before:hidden md:before:block before:absolute before:top-[20px] before:left-0 before:w-full before:h-0.5 before:bg-slate-800">
        {roadmap.map((step, idx) => (
          <div key={idx} className="relative z-10 flex flex-col items-center flex-1 text-center mb-8 md:mb-0 px-2">
            <div className="h-10 w-10 rounded-full bg-slate-900 border-4 border-emerald-500 flex items-center justify-center text-slate-300 font-bold mb-4 shadow-lg shadow-emerald-500/20 shrink-0">
              {idx + 1}
            </div>
            <h3 className="text-white font-semibold">{step.stage}</h3>
            <p className="text-emerald-400 text-sm font-medium mt-1 mb-4">{step.focus}</p>
            
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 w-full h-full text-left shadow-md hover:bg-slate-800/70 transition-colors">
              <p className="text-slate-300 text-xs leading-relaxed">{step.details}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default RoadmapChart;

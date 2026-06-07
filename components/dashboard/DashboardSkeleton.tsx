import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 px-6 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation / Breadcrumb */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <span className="text-slate-600">/</span>
          <Skeleton className="h-4 w-20" />
          <span className="text-slate-600">/</span>
          <Skeleton className="h-4 w-24 bg-slate-700/50" />
        </div>

        {/* Master AI Header */}
        <div className="w-full rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-950/50 p-8 shadow-xl text-center mb-8 flex flex-col items-center">
          <Skeleton className="h-4 w-64 mb-6" />
          <Skeleton className="h-12 w-3/4 max-w-md mb-6" />
          <Skeleton className="h-10 w-48 rounded-full" />
        </div>

        <div className="space-y-12">
          {/* Skill Gap */}
          <div className="w-full rounded-3xl border border-slate-700/50 bg-slate-900/50 p-8 shadow-xl">
            <Skeleton className="h-8 w-64 mb-8" />
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-8 w-24 rounded-full" />
                  <Skeleton className="h-8 w-32 rounded-full" />
                  <Skeleton className="h-8 w-20 rounded-full" />
                </div>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-8 w-28 rounded-full" />
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="grid lg:grid-cols-3 gap-8 w-full">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl border border-slate-700/50 bg-slate-900/50 p-8 shadow-xl">
                <Skeleton className="h-6 w-48 mb-6" />
                <ul className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-14 w-full rounded-xl" />
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Learning Framework Timeline */}
          <div className="w-full rounded-3xl border border-slate-700/50 bg-slate-900/50 p-8 shadow-xl">
            <Skeleton className="h-8 w-80 mb-8" />
            <div className="space-y-12">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-6 w-48 mb-4" />
                  <div className="pl-8 space-y-6">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

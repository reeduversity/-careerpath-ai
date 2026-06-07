"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-50 min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-6">
          <div className="w-24 h-24 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">🛑</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Critical System Error</h1>
          <p className="text-slate-400">
            A fatal error occurred that broke the application layout. We have logged the issue and are looking into it.
          </p>
          <div className="pt-4">
            <button 
              onClick={() => reset()}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-rose-500/20"
            >
              Attempt Recovery
            </button>
          </div>
          <div className="mt-8 text-xs text-slate-600">
            Error digest: {error.digest || "No digest available"}
          </div>
        </div>
      </body>
    </html>
  );
}

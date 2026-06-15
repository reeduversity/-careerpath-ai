"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error("Next.js Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 space-y-6">
      <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
        <span className="text-4xl">⚠️</span>
      </div>
      <h2 className="text-3xl font-bold text-white">Something went wrong!</h2>
      <p className="text-slate-400 max-w-md">
        We encountered an unexpected error while rendering this page.
      </p>
      <div className="flex gap-4 pt-4">
        <Button 
          onClick={() => window.location.reload()}
          className="bg-sky-500 hover:bg-sky-600 text-white font-medium px-6 py-2 rounded-xl transition-all"
        >
          Reload
        </Button>
        <Link href="/">
          <Button 
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white font-medium px-6 py-2 rounded-xl transition-all"
          >
            Go home
          </Button>
        </Link>
      </div>
    </div>
  );
}

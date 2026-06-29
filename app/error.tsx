"use client";

import { useEffect } from "react";
import { RotateCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-red-100">
            <span className="text-5xl font-bold text-rose-500">!</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Something went wrong
            </h2>
            <p className="text-base text-slate-600">
              An unexpected error occurred. Please try again.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-cyan-500/25 hover:opacity-90 transition-all"
          >
            <RotateCcw className="h-5 w-5" />
            Try again
          </button>
          <a
            href="/"
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50 transition-all"
          >
            <Home className="h-5 w-5" />
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

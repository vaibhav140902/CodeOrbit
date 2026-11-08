export default function ProblemWorkspaceLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 py-4 animate-pulse">
      {/* Top Problem Header Skeleton */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="h-6 w-36 rounded bg-slate-800" />
          <div className="h-5 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 rounded bg-slate-800" />
          <div className="h-8 w-28 rounded bg-cyan-600/30" />
        </div>
      </div>

      {/* 2-Pane Split Workspace Skeleton */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12 items-start">
        {/* Left Pane: Description & Hints */}
        <div className="space-y-4 xl:col-span-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div className="h-6 w-48 rounded bg-slate-800" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-slate-800/80" />
              <div className="h-4 w-5/6 rounded bg-slate-800/80" />
              <div className="h-4 w-4/6 rounded bg-slate-800/80" />
            </div>
            <div className="h-28 rounded-lg bg-slate-950/60 border border-slate-800/60 p-4 space-y-2">
              <div className="h-3 w-20 rounded bg-slate-800" />
              <div className="h-3 w-40 rounded bg-slate-800/60" />
            </div>
          </div>
        </div>

        {/* Right Pane: Code Editor & Testcases */}
        <div className="space-y-4 xl:col-span-7">
          <div className="rounded-xl border border-slate-800 bg-[#0b1020] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-2.5">
              <div className="h-4 w-32 rounded bg-slate-800" />
              <div className="h-4 w-20 rounded bg-slate-800" />
            </div>
            <div className="h-[480px] p-4 space-y-2">
              <div className="h-4 w-1/3 rounded bg-slate-800/60" />
              <div className="h-4 w-1/2 rounded bg-slate-800/40" />
              <div className="h-4 w-2/5 rounded bg-slate-800/50" />
              <div className="h-4 w-1/4 rounded bg-slate-800/30" />
            </div>
          </div>

          {/* Testcase Console Bottom Skeleton */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 h-36" />
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 h-36" />
          </div>
        </div>
      </div>
    </div>
  );
}

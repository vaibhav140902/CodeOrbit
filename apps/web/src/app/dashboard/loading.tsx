export default function DashboardLoading() {
  return (
    <div className="app-shell min-h-[calc(100vh-4rem)] w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Welcome Banner Skeleton */}
      <div className="mb-8 space-y-3">
        <div className="h-8 w-64 rounded-lg bg-slate-800" />
        <div className="h-4 w-96 max-w-full rounded bg-slate-800/60" />
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 h-28" />
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 h-28" />
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 h-28" />
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 h-28" />
      </div>

      {/* Main Grid: Readiness Radar & Recommended Work */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-900/60 p-6 h-96" />
        <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6 h-96" />
      </div>
    </div>
  );
}

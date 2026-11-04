export default function Loading() {
  return (
    <div className="app-shell min-h-[calc(100vh-4rem)] w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-8 w-48 rounded-md bg-[color:var(--surface-muted)] mb-6" />

      {/* Hero / Header Skeleton */}
      <div className="space-y-3 mb-8">
        <div className="h-10 w-3/4 max-w-lg rounded-lg bg-[color:var(--surface-muted)]" />
        <div className="h-4 w-1/2 max-w-md rounded bg-[color:var(--surface-muted)] opacity-70" />
      </div>

      {/* Grid Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="h-48 rounded-xl bg-[color:var(--surface-muted)] border border-[color:var(--border)]" />
          <div className="h-64 rounded-xl bg-[color:var(--surface-muted)] border border-[color:var(--border)]" />
        </div>
        <div className="space-y-4">
          <div className="h-32 rounded-xl bg-[color:var(--surface-muted)] border border-[color:var(--border)]" />
          <div className="h-80 rounded-xl bg-[color:var(--surface-muted)] border border-[color:var(--border)]" />
        </div>
      </div>
    </div>
  );
}

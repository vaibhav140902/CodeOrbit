export default function Loading() {
  return (
    <div className="app-shell flex items-center justify-center px-4 py-10">
      <div className="surface-card w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-[color:var(--border)] border-t-[color:var(--accent)]" />
        <p className="text-lg font-semibold">Preparing the workspace</p>
        <p className="mt-2 text-sm text-muted">Loading secure content, readiness data, and product state.</p>
      </div>
    </div>
  );
}

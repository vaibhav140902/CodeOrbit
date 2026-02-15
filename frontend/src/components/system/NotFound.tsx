import { Link } from "react-router-dom";

export const NotFound = () => {
  return (
    <div className="app-shell flex items-center justify-center px-4 py-10">
      <div className="surface-card w-full max-w-xl p-6 text-center sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">404</p>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Page not found</h1>
        <p className="text-muted mt-3 text-sm sm:text-base">
          This route does not exist. Go back to the problem list and continue solving.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to="/problems" className="btn-primary text-center">
            Open problems
          </Link>
          <Link to="/" className="btn-secondary text-center">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

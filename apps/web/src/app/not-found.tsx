import Link from "next/link";
import { AppFrame } from "@/components/layout/app-frame";

export default function NotFound() {
  return (
    <AppFrame>
      <div className="app-shell flex items-center justify-center px-4 py-10">
        <div className="surface-card w-full max-w-xl p-6 text-center sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">404</p>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">This page is not in orbit.</h1>
          <p className="text-muted mt-3 text-sm sm:text-base">
            The route you requested does not exist or has moved. Use the public hiring OS pages to get back on track.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/" className="btn-primary text-center">
              Back to home
            </Link>
            <Link href="/tracks" className="btn-secondary text-center">
              Explore tracks
            </Link>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}

import { Link } from "react-router-dom";
import { BRAND } from "../config/brand";

const highlights = [
  {
    title: "Problem-First Workflow",
    description: "Open a problem, code in-browser, run test input, and submit in one focused workspace.",
  },
  {
    title: "Progress That Matters",
    description: "Leaderboard and activity metrics are updated from real submissions, not mock values.",
  },
  {
    title: "Interview-Ready Practice",
    description: "Difficulty split, topic tags, and solution history help you prepare with intention.",
  },
];

export const About = () => {
  return (
    <div className="app-shell">
      <div className="page-container">
        <section className="surface-card mb-6 p-5 sm:p-7 md:mb-8 md:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">About</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl md:text-5xl">A cleaner coding practice platform</h1>
          <p className="text-muted mt-4 max-w-3xl text-base leading-7 sm:text-lg sm:leading-8">
            {BRAND.name} is built for disciplined problem-solving. The interface stays minimal so you can focus on thinking, not navigating.
          </p>
        </section>

        <section className="mb-6 grid gap-3 sm:gap-4 md:mb-8 md:grid-cols-3">
          {highlights.map((item) => (
            <article key={item.title} className="surface-card p-5 sm:p-6">
              <h2 className="text-lg font-semibold sm:text-xl">{item.title}</h2>
              <p className="text-muted mt-3 text-sm leading-6">{item.description}</p>
            </article>
          ))}
        </section>

        <section className="surface-card p-5 sm:p-8">
          <h2 className="text-xl font-semibold sm:text-2xl">Tech Stack</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {["React", "TypeScript", "Firebase", "Tailwind CSS", "Vite"].map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] px-3 py-1 text-xs font-semibold text-soft"
              >
                {tech}
              </span>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            <Link to="/problems" className="btn-primary text-center">
              Browse problems
            </Link>
            <Link to="/leaderboard" className="btn-secondary text-center">
              Open leaderboard
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

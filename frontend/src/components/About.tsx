import { Link } from "react-router-dom";

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
        <section className="surface-card mb-8 p-8 md:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">About</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">A cleaner coding practice platform</h1>
          <p className="text-muted mt-4 max-w-3xl text-lg leading-8">
            Vaibhav&apos;s Code is built for disciplined problem-solving. The interface stays minimal so you can focus on thinking, not navigating.
          </p>
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <article key={item.title} className="surface-card p-6">
              <h2 className="text-xl font-semibold">{item.title}</h2>
              <p className="text-muted mt-3 text-sm leading-6">{item.description}</p>
            </article>
          ))}
        </section>

        <section className="surface-card p-8">
          <h2 className="text-2xl font-semibold">Tech Stack</h2>
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

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/problems" className="btn-primary">
              Browse problems
            </Link>
            <Link to="/leaderboard" className="btn-secondary">
              Open leaderboard
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

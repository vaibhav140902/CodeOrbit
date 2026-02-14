import { Link } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { userAtom } from "../store/atoms/user";

const featureCards = [
  {
    title: "Focused Practice",
    description: "Curated problems grouped by topic and difficulty for daily consistency.",
    tag: "Practice",
  },
  {
    title: "Measured Progress",
    description: "Leaderboard rank, acceptance rate, streaks, and solved-by-difficulty analytics.",
    tag: "Track",
  },
  {
    title: "Real Submissions",
    description: "Run and submit in multiple languages with persisted history per problem.",
    tag: "Execute",
  },
];

export const Landing = () => {
  const user = useRecoilValue(userAtom);
  const username = user.user?.email?.split("@")[0] || "Coder";

  return (
    <div className="app-shell">
      <div className="page-container">
        <section className="surface-card mb-8 overflow-hidden p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                Coding Workspace
              </p>
              <h1 className="text-4xl font-bold leading-tight md:text-5xl">
                Welcome back, <span className="brand-gradient">{username}</span>
              </h1>
              <p className="text-muted mt-4 max-w-xl text-lg">
                Minimal interface, serious practice. Solve interview-style problems and improve with clear feedback.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/problems" className="btn-primary">
                  Start solving
                </Link>
                <Link to="/leaderboard" className="btn-secondary">
                  View leaderboard
                </Link>
              </div>
            </div>

            <div className="surface-soft p-6">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                Snapshot
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-[color:var(--border)] p-3">
                  <p className="text-muted text-xs">Problems</p>
                  <p className="mt-1 text-2xl font-bold">15+</p>
                </div>
                <div className="rounded-xl border border-[color:var(--border)] p-3">
                  <p className="text-muted text-xs">Languages</p>
                  <p className="mt-1 text-2xl font-bold">10+</p>
                </div>
                <div className="rounded-xl border border-[color:var(--border)] p-3">
                  <p className="text-muted text-xs">Metrics</p>
                  <p className="mt-1 text-2xl font-bold">Live</p>
                </div>
              </div>
              <p className="text-muted mt-4 text-sm">
                Keep submitting to improve score, rank, and streak.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {featureCards.map((feature) => (
            <article key={feature.title} className="surface-card p-6">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[color:var(--accent)]">{feature.tag}</p>
              <h2 className="mt-3 text-xl font-semibold">{feature.title}</h2>
              <p className="text-muted mt-2 text-sm leading-6">{feature.description}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
};

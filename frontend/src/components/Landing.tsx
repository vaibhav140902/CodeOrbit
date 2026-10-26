import { Link } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { userAtom } from "../store/atoms/user";
import { BRAND } from "../config/brand";

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
        <section className="surface-card mb-6 overflow-hidden p-5 sm:p-6 md:mb-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                {BRAND.tagline}
              </p>
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                Build interview confidence with <span className="brand-gradient">{BRAND.name}</span>
              </h1>
              <p className="text-muted mt-4 max-w-xl text-base sm:text-lg">
                Welcome {username}. Follow curated problem tracks by topic and company, then ship stronger solutions.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-2 sm:mt-8 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                <Link to="/problems" className="btn-primary text-center">
                  Start solving
                </Link>
                <Link to="/prep" className="btn-secondary text-center">
                  Explore prep tracks
                </Link>
                <Link to="/leaderboard" className="btn-secondary text-center">
                  View leaderboard
                </Link>
                <Link to="/pricing" className="btn-ghost text-center">
                  View pricing
                </Link>
              </div>
            </div>

            <div className="surface-soft p-4 sm:p-6">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                Snapshot
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                <div className="rounded-xl border border-[color:var(--border)] p-3">
                  <p className="text-muted text-xs">Problems</p>
                  <p className="mt-1 text-xl font-bold sm:text-2xl">15+</p>
                </div>
                <div className="rounded-xl border border-[color:var(--border)] p-3">
                  <p className="text-muted text-xs">Languages</p>
                  <p className="mt-1 text-xl font-bold sm:text-2xl">10+</p>
                </div>
                <div className="rounded-xl border border-[color:var(--border)] p-3 col-span-2 sm:col-span-1">
                  <p className="text-muted text-xs">Metrics</p>
                  <p className="mt-1 text-xl font-bold sm:text-2xl">Live</p>
                </div>
              </div>
              <p className="text-muted mt-4 text-sm">
                Keep submitting to improve score, rank, and streak.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:gap-4 md:grid-cols-3">
          {featureCards.map((feature) => (
            <article key={feature.title} className="surface-card p-5 sm:p-6">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[color:var(--accent)]">{feature.tag}</p>
              <h2 className="mt-3 text-lg font-semibold sm:text-xl">{feature.title}</h2>
              <p className="text-muted mt-2 text-sm leading-6">{feature.description}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
};

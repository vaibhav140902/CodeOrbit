export type GauntletRoleTrack =
  | "frontend-sde"
  | "backend-sde"
  | "fullstack-sde"
  | "data-python"
  | "mass-recruiter-ninja";

export interface GauntletRoundScore {
  round: 1 | 2 | 3 | 4;
  roundName: string;
  score: number;
  maxScore: number;
  passed: boolean;
  feedback: string;
  securityFlag?: boolean;
}

export interface GauntletSession {
  id: string;
  userId: string;
  roleTrack: GauntletRoleTrack;
  currentRound: 1 | 2 | 3 | 4;
  round1Ats?: GauntletRoundScore;
  round2Oa?: GauntletRoundScore & { codeSubmitted?: string; problemId?: string };
  round3CodeDefense?: GauntletRoundScore & { transcript?: string };
  round4BarRaiser?: GauntletRoundScore;
  totalPfiScore: number; // 0 - 1000
  hiringVerdict: "Strong Hire" | "Hire" | "Borderline" | "Needs Revision";
  integrityViolationsCount: number;
  isTerminated: boolean;
  updatedAtIso: string;
}

export const GAUNTLET_ROLE_CONFIGS: Record<
  GauntletRoleTrack,
  {
    name: string;
    description: string;
    targetOaProblem: string;
    focusAreas: string[];
    openingDefenseQuestion: string;
    openingBarRaiserQuestion: string;
  }
> = {
  "frontend-sde": {
    name: "Frontend SDE (React / Next.js)",
    description: "Component lifecycle, state management, render optimizations, and DOM algorithms.",
    targetOaProblem: "valid-parentheses",
    focusAreas: ["React DOM", "Virtual DOM", "Tailwind/CSS", "Async Data Flow", "Web Performance"],
    openingDefenseQuestion:
      "Explain the asymptotic complexity of your solution, and how you would adapt it to handle a streaming input of millions of tokens without blocking the main browser UI thread.",
    openingBarRaiserQuestion:
      "Describe a time when a critical UI regression slipped into production. How did you diagnose it, contain customer impact, and establish regression tests?",
  },
  "backend-sde": {
    name: "Backend SDE (Distributed Systems & APIs)",
    description: "Database transactions, concurrency, idempotency, caching, and distributed systems.",
    targetOaProblem: "two-sum",
    focusAreas: ["PostgreSQL/Prisma", "Distributed Caching", "API Idempotency", "Database Locking", "Microservices"],
    openingDefenseQuestion:
      "Walk me through the memory and space trade-offs in your code. If this logic was invoked concurrently by 50,000 RPS in a distributed cluster, where would the bottleneck be?",
    openingBarRaiserQuestion:
      "Tell me about a high-severity production outage or data inconsistency incident you owned. What was the root cause and how did you prevent recurrence?",
  },
  "fullstack-sde": {
    name: "Full-Stack SDE (End-to-End Systems)",
    description: "Full lifecycle architecture: Next.js App Router, SSR/ISR, relational schemas, and Judge0 sandboxing.",
    targetOaProblem: "merge-intervals",
    focusAreas: ["Next.js App Router", "Server Components", "Relational Schemas", "Security & CORS", "CI/CD"],
    openingDefenseQuestion:
      "Defend the architectural invariant in your implementation. How does your solution handle boundary edge cases such as empty sets or overlapping bounds?",
    openingBarRaiserQuestion:
      "Describe an architectural trade-off where you had to balance shipping speed against long-term maintainability. What metrics guided your decision?",
  },
  "data-python": {
    name: "Data & Python SDE (Algorithms & ML)",
    description: "NumPy/Pandas patterns, stream processing, asymptotic optimizations, and mathematical reasoning.",
    targetOaProblem: "binary-search",
    focusAreas: ["Python 3.12", "Algorithmic Invariants", "Pandas/NumPy", "Data Pipelines", "Vectorization"],
    openingDefenseQuestion:
      "Analyze the iteration count and boundary conditions in your code. How does your logic prevent off-by-one errors and integer overflow in lower/upper midpoint calculations?",
    openingBarRaiserQuestion:
      "Share an experience where a data pipeline produced silent inaccuracies. How did you detect the drift and restructure validation checks?",
  },
  "mass-recruiter-ninja": {
    name: "Mass Recruiter Ninja (TCS / Infosys / Wipro OA)",
    description: "Speed, accuracy, clean modular coding, and fundamental computer science reasoning.",
    targetOaProblem: "reverse-string",
    focusAreas: ["DSA Speed", "Array & String Manipulation", "OOP Invariants", "SQL Fundamentals"],
    openingDefenseQuestion:
      "Explain your step-by-step logic and prove that your algorithm executes within the standard 1.0s time limit on large enterprise test suites.",
    openingBarRaiserQuestion:
      "Why do you want to join this role, and how have you demonstrated proactive technical learning outside your formal college curriculum?",
  },
};

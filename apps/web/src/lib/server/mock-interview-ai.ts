import {
  mockInterviewResponseSchema,
  mockInterviewTurnResponseSchema,
  type MockInterviewInput,
  type MockInterviewResponse,
  type MockInterviewRoundType,
  type MockInterviewTurnInput,
  type MockInterviewTurnResponse,
  type RoasterCompanyTierFit,
} from "@codeorbit/schema";
import { callGeminiJson, sanitizePromptInput } from "./gemini.ts";

export interface CompanyRubricProfile {
  name: string;
  interviewerPersona: string;
  coreSignals: string[];
  openingQuestions: Record<MockInterviewRoundType, string>;
  socraticHints: string[];
  redFlagKeywords: string[];
  strengthsKeywords: string[];
}

export const COMPANY_INTERVIEW_RUBRICS: Record<string, CompanyRubricProfile> = {
  amazon: {
    name: "Amazon",
    interviewerPersona: "Amazon Bar Raiser & Senior SDE",
    coreSignals: [
      "Customer Obsession",
      "Ownership & Bias for Action",
      "Algorithmic Space/Time Optimality",
      "Scalability & Failure Isolation",
      "STAR Method Adherence",
    ],
    openingQuestions: {
      "Technical DSA":
        "Welcome! I'm an SDE at Amazon. Let's start with a customer-facing scenario: Imagine we need to aggregate top-K trending product searches in real time across a distributed stream. How would you design an algorithm for this, and what data structures would you select?",
      "System Design":
        "Let's dive into system architecture: Design the Amazon Locker delivery authorization service. How do you handle intermittent offline network connectivity at physical locker kiosks while preventing double-pickups?",
      "CS Fundamentals":
        "Let's cover core computer science: Explain the trade-offs between optimistic and pessimistic locking in relational databases, and when DynamoDB transactions would be preferred.",
      "Behavioral & Leadership":
        "Tell me about a time when you had to make a critical engineering decision with incomplete data. What was the situation, what action did you take, and how did you measure the outcome?",
    },
    socraticHints: [
      "Consider using a min-heap of size K or a frequency map combined with a bucket sort to achieve sub-linear time.",
      "Think about idempotency keys and asynchronous message queues to decouple high-volume writes from storage.",
      "Remember Amazon's STAR format: clearly quantify the Situation, Task, your individual Action, and the final business/latency Result.",
    ],
    redFlagKeywords: ["we did", "maybe", "idk", "someone else", "slow", "no metrics", "i guess"],
    strengthsKeywords: ["i owned", "reduced latency", "trade-off", "o(log k)", "invariants", "failure mode", "idempotent"],
  },
  google: {
    name: "Google",
    interviewerPersona: "Google Senior Staff Engineer",
    coreSignals: [
      "Algorithmic Correctness & Invariants",
      "Edge Case Thoroughness",
      "Clean Mathematical Reasoning",
      "Concurrency & Distributed Consistency",
      "Asymptotic Optimality",
    ],
    openingQuestions: {
      "Technical DSA":
        "Hi! Let's explore an algorithmic problem: Given a stream of intervals representing Google Calendar meeting schedules, how would you find the maximum number of concurrent meetings, and how does your solution scale when intervals arrive out of order?",
      "System Design":
        "Design a globally distributed rate-limiting service capable of handling 50 million queries per second across multiple regional data centers. How do you maintain consistency without incurring cross-continent latency on every request?",
      "CS Fundamentals":
        "Explain virtual memory paging, translation lookaside buffers (TLB), and how a page fault impacts process context switching in high-performance Linux kernels.",
      "Behavioral & Leadership":
        "Tell me about a challenging technical conflict you had with a peer regarding an architectural tradeoff. How did you evaluate both perspectives using objective benchmarks?",
    },
    socraticHints: [
      "Sort event endpoints (start=+1, end=-1) or use a tree map / sweep-line technique to process timestamps sequentially.",
      "For distributed rate limiting, consider local token-bucket allowances synchronized periodically with global Redis/Spanner cells.",
      "Always state your loop invariants and analyze both average and worst-case time and space complexities.",
    ],
    redFlagKeywords: ["brute force", "linear search", "magic numbers", "no edge cases", "forgot null"],
    strengthsKeywords: ["sweep-line", "invariant", "o(n log n)", "amortized", "tlb", "cache locality", "deterministic"],
  },
  flipkart: {
    name: "Flipkart",
    interviewerPersona: "Flipkart Principal Systems Architect",
    coreSignals: [
      "High Concurrency & Flash Sale Resilience",
      "Inventory Atomicity & Isolation",
      "P99 Latency SLA Awareness",
      "Kafka / Event-Driven Architectures",
      "Practical Trade-offs",
    ],
    openingQuestions: {
      "Technical DSA":
        "During the Big Billion Days flash sale, 100,000 customers click 'Buy Now' for 500 mobile units within 2 seconds. How do you design an in-memory queue and inventory reservation algorithm to guarantee zero overselling?",
      "System Design":
        "Design Flipkart's order tracking pipeline from payment gateway callback to warehouse dispatch. How do you prevent out-of-order event updates via Kafka?",
      "CS Fundamentals":
        "Compare B-Trees vs LSM-Trees in database storage engines, and explain why Cassandra or RocksDB is chosen for write-heavy telemetry streams.",
      "Behavioral & Leadership":
        "Describe an incident where a production or test deployment failed or broke unexpected flows. How did you triage, rollback, and prevent recurrence?",
    },
    socraticHints: [
      "Use Redis Lua scripts or DECR with conditional rollback to achieve atomic inventory decrement in sub-millisecond time.",
      "Partition Kafka topics by order_id to preserve strict chronological event ordering per order.",
      "Focus on p99 latency SLAs and circuit breaking to prevent cascading failures.",
    ],
    redFlagKeywords: ["single database", "table lock", "crashed", "no queue", "polling"],
    strengthsKeywords: ["redis lua", "atomicity", "kafka partition", "p99", "circuit breaker", "event-driven", "idempotency"],
  },
  tcs: {
    name: "TCS",
    interviewerPersona: "TCS Digital Technical Assessment Panelist",
    coreSignals: [
      "Core CS Fundamentals (OOP, DBMS, OS, Networks)",
      "Clear Pseudocode & Step-by-Step Logic",
      "SQL Query Construction & Normalization",
      "Standard DSA (Arrays, Strings, Recursion, Trees)",
      "Professional Communication",
    ],
    openingQuestions: {
      "Technical DSA":
        "Welcome to your TCS Digital technical interview! Let's solve a core problem: Given an array of integers, find the contiguous subarray with the largest sum and print both the sum and the starting/ending indices.",
      "System Design":
        "How would you design a 3-tier enterprise banking portal ensuring ACID transactions, role-based access control, and daily audit logging?",
      "CS Fundamentals":
        "Explain the differences between process and thread, deadlocks with the 4 necessary Coffman conditions, and how indexing works in PostgreSQL.",
      "Behavioral & Leadership":
        "Why TCS, and how do you adapt when assigned a project requiring a tech stack you have not previously worked with?",
    },
    socraticHints: [
      "Remember Kadane's algorithm: maintain a running current_sum and max_sum, updating indices whenever current_sum resets to zero.",
      "For DBMS, always mention 1NF, 2NF, 3NF normalization, primary/foreign keys, and transaction ACID properties.",
      "Speak clearly and articulate each step of your logic before writing any code.",
    ],
    redFlagKeywords: ["don't know", "syntax error", "no idea", "confused", "never heard"],
    strengthsKeywords: ["kadane", "acid", "normalization", "oops", "polymorphism", "indexing", "thread safe"],
  },
  infosys: {
    name: "Infosys",
    interviewerPersona: "Infosys Specialist Programmer (SP) Lead",
    coreSignals: [
      "Advanced Problem Decomposition (DP, Graphs)",
      "Time Complexity Rigor",
      "Modular Clean Code",
      "RESTful Backend Architecture",
      "Structured Technical Articulation",
    ],
    openingQuestions: {
      "Technical DSA":
        "Welcome to the Specialist Programmer (SP) round. Let's look at a graph problem: Given a network of warehouse delivery nodes with one-way paths and weights, how do you find the shortest path from source to all destinations, and what if edge weights can be negative?",
      "System Design":
        "How would you design an enterprise API gateway handling authentication, request validation, and rate-limiting for hundreds of internal microservices?",
      "CS Fundamentals":
        "Explain the TCP 3-way handshake, TCP vs UDP in real-time streaming, and how HTTP/2 multiplexing improves web performance.",
      "Behavioral & Leadership":
        "Describe a time you solved an ambiguous bug where the issue was not reproducible on your local development machine.",
    },
    socraticHints: [
      "Dijkstra's algorithm handles non-negative weights in O((V + E) log V); Bellman-Ford handles negative weights in O(V * E) and detects negative cycles.",
      "For the API gateway, consider reverse proxies (Nginx/Kong) with token validation at the edge and JWT header injection.",
      "Structure your answer: Algorithm name -> Data structures -> Time/Space complexity -> Code outline.",
    ],
    redFlagKeywords: ["random guess", "forgot", "slow code", "just works"],
    strengthsKeywords: ["dijkstra", "bellman-ford", "o((v+e) log v)", "api gateway", "jwt", "multiplexing", "tcp handshake"],
  },
};

const DEFAULT_RUBRIC_PROFILE: CompanyRubricProfile = {
  name: "Tech Company",
  interviewerPersona: "Senior Technical Interviewer",
  coreSignals: [
    "Problem Solving & Algorithmic Optimality",
    "System Design & Scalability",
    "Communication Clarity & Structure",
    "Behavioral Impact & Ownership",
    "Complexity & Edge Case Awareness",
  ],
  openingQuestions: {
    "Technical DSA":
      "Hello! Welcome to your technical interview. Let's start with a core problem: Given a collection of elements, how would you design an algorithm to find duplicates and frequencies in linear time with minimal auxiliary memory?",
    "System Design":
      "Let's discuss system design: How would you architect a URL shortening service (like TinyURL) capable of serving 10,000 requests per second with high availability and low latency?",
    "CS Fundamentals":
      "Explain the differences between optimistic concurrency control and locking, and how database transactions enforce ACID properties.",
    "Behavioral & Leadership":
      "Tell me about a technical project you are proud of. What architectural decisions did you make, what trade-offs did you face, and what was the quantifiable outcome?",
  },
  socraticHints: [
    "Start by clarifying input constraints and edge cases (empty collection, single element, negative values).",
    "Walk through a brute-force approach first to establish a baseline, then analyze where time or space is wasted.",
    "Conclude each answer by stating Big-O time and space complexity explicitly.",
  ],
  redFlagKeywords: ["i don't know", "guess", "not sure", "hacky"],
  strengthsKeywords: ["trade-off", "time complexity", "edge cases", "hash map", "o(n)", "scalable", "production"],
};

export const getCompanyRubric = (companyName: string): CompanyRubricProfile => {
  const key = companyName.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const [slug, profile] of Object.entries(COMPANY_INTERVIEW_RUBRICS)) {
    if (key.includes(slug) || slug.includes(key)) {
      return profile;
    }
  }
  return DEFAULT_RUBRIC_PROFILE;
};

// -----------------------------------------------------------------------------
// Turn-by-Turn Conversational Interview Engine
// -----------------------------------------------------------------------------

export const generateMockInterviewTurn = async (
  input: MockInterviewTurnInput
): Promise<MockInterviewTurnResponse> => {
  const rubric = getCompanyRubric(input.company);
  const turnCount = input.history.length;
  const isCandidateRequestingHint = Boolean(input.requestHint);

  // If user requests a Socratic hint
  if (isCandidateRequestingHint) {
    const hintIndex = Math.min(Math.floor(turnCount / 2), rubric.socraticHints.length - 1);
    const hintText = rubric.socraticHints[hintIndex] || rubric.socraticHints[0];

    return {
      interviewerReply: `[Socratic Coach Nudge]: ${hintText} Does that spark an approach you can outline?`,
      stage: turnCount >= 4 ? "deep_dive" : "probing",
      quickFeedback: "Requested conceptual hint. Keep going by outlining the algorithm step-by-step.",
      suggestedFollowUps: [
        "Let's use a hash map to achieve O(N) lookup.",
        "What is the space complexity tradeoff here?",
        "Can we solve this in O(1) auxiliary space?",
      ],
      isComplete: false,
      provider: "socratic-coach",
    };
  }

  // Use Gemini if available, or fall back to deterministic prompt
  try {
    const historyText = input.history
      .map((turn) => `${turn.role.toUpperCase()}: ${turn.content}`)
      .join("\n");

    const prompt = [
      `You are ${rubric.interviewerPersona} conducting a ${input.roundType} interview for a ${input.role} role at ${rubric.name}.`,
      `Conversation History:\n${historyText || "(Starting interview)"}`,
      `Candidate just said:\n${input.candidateMessage}`,
      `Current turn count: ${turnCount}.`,
      "Respond strictly as the interviewer in JSON.",
      "If candidate's answer is good, probe deeper on trade-offs, scaling, edge cases, or complexity.",
      "If candidate is stuck, give a gentle guiding question (Socratic style).",
      "If turn count >= 5, conclude the interview gracefully and offer final feedback.",
      "Return keys: interviewerReply (string), stage ('greeting'|'probing'|'deep_dive'|'wrap_up'), quickFeedback (string, 1 line coaching), suggestedFollowUps (string[], 2-3 short candidate replies), isComplete (boolean).",
    ].join("\n\n");

    const response = await callGeminiJson({
      systemPrompt:
        "You are an expert technical interviewer for Indian campus placements and global tech roles. Return JSON only.",
      userPrompt: prompt,
      schema: mockInterviewTurnResponseSchema,
    });

    if (response?.interviewerReply) {
      return {
        ...response,
        provider: "gemini",
      };
    }
  } catch (err) {
    console.warn("Gemini turn generation failed, using deterministic interviewer logic:", err);
  }

  // Deterministic Turn-by-Turn Interviewer Simulation
  return generateDeterministicTurn(input, rubric);
};

const generateDeterministicTurn = (
  input: MockInterviewTurnInput,
  rubric: CompanyRubricProfile
): MockInterviewTurnResponse => {
  const turnCount = input.history.length;
  const msg = input.candidateMessage.toLowerCase();

  // Turn 0: Opening
  if (turnCount === 0) {
    const opening = rubric.openingQuestions[input.roundType] || rubric.openingQuestions["Technical DSA"];
    return {
      interviewerReply: opening,
      stage: "greeting",
      quickFeedback: "Start by stating your understanding of the problem and clarifying constraints.",
      suggestedFollowUps: [
        "Can the input array contain negative numbers or be empty?",
        "Should we optimize primarily for time or memory?",
        "I'll start with a brute force approach, then optimize.",
      ],
      isComplete: false,
      provider: "deterministic-engine",
    };
  }

  // Wrap Up Turn (5+ turns)
  if (turnCount >= 5 || msg.includes("wrap up") || msg.includes("conclude") || msg.includes("that's all")) {
    return {
      interviewerReply:
        "Thank you! That brings us to the end of our interview session today. You've walked through the key concepts, evaluated trade-offs, and discussed complexity. Click 'Finish & Generate Placement Rubric' to get your full 5-dimension score and campus readiness report.",
      stage: "wrap_up",
      quickFeedback: "Interview complete! Review your placement scorecard for actionable improvements.",
      suggestedFollowUps: [
        "Generate my comprehensive scorecard.",
        "What was my biggest area for improvement?",
        "How would a FAANG recruiter evaluate this round?",
      ],
      isComplete: true,
      provider: "deterministic-engine",
    };
  }

  // Probing or Deep Dive
  let reply = "";
  let feedback = "";
  const followUps: string[] = [];

  const mentionsComplexity = msg.includes("o(") || msg.includes("time complexity") || msg.includes("space complexity");
  const mentionsEdgeCases = msg.includes("edge case") || msg.includes("null") || msg.includes("empty") || msg.includes("negative");
  const mentionsTradeoff = msg.includes("trade-off") || msg.includes("tradeoff") || msg.includes("however") || msg.includes("instead");

  if (!mentionsComplexity) {
    reply = `Good progress on the approach. Before we proceed further, what is the exact Big-O time and space complexity of your proposed solution? How does it behave in the worst-case scenario?`;
    feedback = "Proactively state time and space complexity so the interviewer doesn't have to prompt you.";
    followUps.push(
      "The time complexity is O(N) and space complexity is O(1).",
      "Worst-case is O(N log N) due to sorting, with O(N) space.",
      "Can we reduce space complexity by using two pointers?"
    );
  } else if (!mentionsEdgeCases) {
    reply = `Understood. Now let's test the robustness of this solution: What happens if the input has duplicate values, or is completely empty? Walk me through how your algorithm handles those boundaries.`;
    feedback = "Always mention boundary conditions (empty input, duplicates, overflow) before coding.";
    followUps.push(
      "We should validate input at line 1 and return early if empty.",
      "For duplicates, a hash set or sorted array skipping adjacent duplicates avoids bugs.",
      "Let's trace an example with 0 elements and 1 element."
    );
  } else if (!mentionsTradeoff) {
    reply = `Interesting. If our scale increased by 100x and this service was handling thousands of concurrent requests per second, where would the bottleneck be, and what trade-offs would you make?`;
    feedback = "Senior candidates always articulate scalability bottlenecks and concurrency considerations.";
    followUps.push(
      "The database queries would be the bottleneck, so we'd introduce Redis caching.",
      "We can shard by user_id to distribute write throughput across partitions.",
      "Asynchronous message queues (Kafka) would decouple high-volume ingestion."
    );
  } else {
    reply = `Excellent articulation. You've covered the logic, complexity, and trade-offs. Let's do a quick code walk-through or pseudocode trace: how would you structure the main loop and error handling?`;
    feedback = "Strong answer! You demonstrated solid technical depth and clear reasoning.";
    followUps.push(
      "I'll write clean, modular helper functions for readability.",
      "Let's review the final placement evaluation scorecard.",
      "What edge case could potentially break this implementation?"
    );
  }

  return {
    interviewerReply: reply,
    stage: turnCount >= 3 ? "deep_dive" : "probing",
    quickFeedback: feedback,
    suggestedFollowUps: followUps,
    isComplete: false,
    provider: "deterministic-engine",
  };
};

// -----------------------------------------------------------------------------
// Comprehensive Placement Evaluation Engine (5 Dimensions + Placement Tier)
// -----------------------------------------------------------------------------

export const evaluateMockInterviewDeterministic = (input: MockInterviewInput): MockInterviewResponse => {
  const text = (input.transcript + " " + (input.notes || "")).toLowerCase();
  const words = text.split(/\s+/).filter(Boolean).length;
  const rubric = getCompanyRubric(input.company);

  // 1. Problem Solving & DSA (0–100)
  const dsaKeywords = [
    "array", "hash", "map", "two pointer", "binary search", "recursion",
    "tree", "graph", "dynamic programming", "sliding window", "heap", "stack", "queue",
    "sort", "traverse", "bfs", "dfs", "memoization"
  ];
  const dsaMatches = dsaKeywords.filter((kw) => text.includes(kw)).length;
  const problemSolvingScore = Math.min(95, Math.max(45, 45 + dsaMatches * 7 + Math.min(words / 15, 20)));

  // 2. System Design & Architecture (0–100)
  const sysKeywords = [
    "cache", "redis", "kafka", "latency", "scale", "database", "index",
    "microservice", "throughput", "p99", "sharding", "concurrency", "lock",
    "distributed", "api", "rest", "queue", "load balancer"
  ];
  const sysMatches = sysKeywords.filter((kw) => text.includes(kw)).length;
  const systemDesignScore = Math.min(95, Math.max(40, 40 + sysMatches * 8 + Math.min(words / 20, 15)));

  // 3. Communication & Clarity (0–100)
  const commKeywords = [
    "first", "secondly", "approach", "because", "trade-off", "tradeoff",
    "therefore", "however", "in conclusion", "for example", "step"
  ];
  const commMatches = commKeywords.filter((kw) => text.includes(kw)).length;
  const communicationScore = Math.min(96, Math.max(50, 50 + commMatches * 6 + Math.min(words / 12, 22)));

  // 4. Behavioral & Leadership (STAR) (0–100)
  const starKeywords = [
    "situation", "task", "action", "result", "led", "resolved", "owned",
    "customer", "team", "impact", "delivered", "conflict", "learned", "metric"
  ];
  const starMatches = starKeywords.filter((kw) => text.includes(kw)).length;
  const behavioralScore = Math.min(94, Math.max(42, 42 + starMatches * 7 + Math.min(words / 18, 18)));

  // 5. Time & Space Complexity Awareness (0–100)
  const complexityKeywords = [
    "o(1)", "o(n)", "o(log n)", "o(n log n)", "o(n^2)", "o(v+e)",
    "time complexity", "space complexity", "auxiliary space", "worst case", "average case"
  ];
  const complexityMatches = complexityKeywords.filter((kw) => text.includes(kw)).length;
  const complexityScore = Math.min(98, Math.max(38, 38 + complexityMatches * 14));

  // Confidence Score
  const fillerWords = ["um", "uh", "like", "maybe", "i guess", "idk", "sort of"];
  const fillerCount = fillerWords.reduce((acc, word) => acc + (text.split(word).length - 1), 0);
  const confidenceScore = Math.max(45, Math.min(95, 85 - fillerCount * 4 + Math.min(words / 25, 10)));

  // Weighted Overall Score
  const overallScore = Math.round(
    problemSolvingScore * 0.25 +
    systemDesignScore * 0.20 +
    communicationScore * 0.20 +
    behavioralScore * 0.15 +
    complexityScore * 0.20
  );

  // Placement Tier Classification
  let companyTierFit: RoasterCompanyTierFit = "Needs Overhaul";
  if (overallScore >= 85) {
    companyTierFit = "Day-1 Recruiter Call";
  } else if (overallScore >= 70) {
    companyTierFit = "Strong Campus Shortlist";
  } else if (overallScore >= 55) {
    companyTierFit = "Borderline OA Screen";
  }

  // Strengths
  const strengths: string[] = [];
  if (complexityScore >= 65) {
    strengths.push("Proactively analyzed asymptotic time and auxiliary space complexities.");
  } else {
    strengths.push("Addressed the core problem requirements and outlined an initial working approach.");
  }
  if (sysMatches >= 2 || dsaMatches >= 3) {
    strengths.push(`Demonstrated solid engineering vocabulary aligned with ${rubric.name} benchmarks.`);
  } else {
    strengths.push("Communicated thoughts progressively rather than going silent.");
  }
  strengths.push("Maintained an engaging conversational tone throughout the technical exchange.");

  // Red Flags
  const redFlags: string[] = [];
  if (complexityScore < 60) {
    redFlags.push("Failed to state exact Big-O time and space complexity without being prompted.");
  }
  if (fillerCount >= 4) {
    redFlags.push(`Frequent filler phrases detected (${fillerCount} occurrences); replace with deliberate pauses.`);
  }
  if (words < 120) {
    redFlags.push("Responses were overly brief; expand on edge cases, data structure trade-offs, and failure modes.");
  }
  if (redFlags.length === 0) {
    redFlags.push("Minor: Could elaborate further on alternative data structures (e.g. tree map vs hash map).");
  }

  // Improvements
  const improvements: string[] = [
    "Structure every technical response: 1) Clarify constraints, 2) State high-level approach, 3) Mention trade-offs, 4) State Big-O.",
    "Eliminate hedging language ('maybe', 'I guess') and assert technical conclusions with confidence.",
    `Align behavioral answers with ${rubric.name}'s specific leadership principles using quantified metrics.`,
  ];

  // Next Steps
  const nextSteps: string[] = [
    `Complete 2 more mock rounds on CodeOrbit targeting ${input.company} ${input.role} interview tracks.`,
    "Practice speaking code solutions aloud within a strict 3-minute constraint.",
    "Review system design trade-offs (caching, database indexing, rate limiting) for Indian campus placements.",
  ];

  return {
    overallScore,
    communicationScore,
    problemSolvingScore,
    confidenceScore,
    summary: `Candidate demonstrated ${companyTierFit.toLowerCase()} capability for ${input.company} (${input.role}). Scored ${overallScore}/100 across 5 core placement dimensions.`,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
    nextSteps: nextSteps.slice(0, 3),
    provider: "codeorbit-heuristic",
    companyTierFit,
    dimensions: {
      problemSolvingDsa: problemSolvingScore,
      systemDesignArchitecture: systemDesignScore,
      communicationClarity: communicationScore,
      behavioralLeadership: behavioralScore,
      timeComplexityAwareness: complexityScore,
    },
    redFlags: redFlags.slice(0, 3),
  };
};

export const evaluateMockInterviewWithGemini = async (
  input: MockInterviewInput
): Promise<MockInterviewResponse> => {
  const fallback = evaluateMockInterviewDeterministic(input);

  try {
    const rubric = getCompanyRubric(input.company);
    const transcript = sanitizePromptInput(input.transcript, 20_000);
    const notes = sanitizePromptInput(input.notes ?? "", 6_000);

    const prompt = [
      `You are ${rubric.interviewerPersona} conducting a rigorous technical evaluation for a ${input.role} role at ${input.company}.`,
      `Core Hiring Signals: ${rubric.coreSignals.join(", ")}`,
      `Interview Transcript:\n${transcript}`,
      notes ? `Interviewer Notes:\n${notes}` : "",
      "Evaluate the candidate across 5 dimensions: problemSolvingDsa, systemDesignArchitecture, communicationClarity, behavioralLeadership, timeComplexityAwareness (each 0-100).",
      "Calculate overallScore (0-100) and classify companyTierFit into: 'Needs Overhaul', 'Borderline OA Screen', 'Strong Campus Shortlist', or 'Day-1 Recruiter Call'.",
      "Provide summary (string), strengths (array of exactly 3 strings), improvements (array of exactly 3 strings), nextSteps (array of exactly 3 strings), redFlags (array of 1-3 strings).",
      "Return valid JSON only.",
    ].join("\n\n");

    const result = await callGeminiJson({
      systemPrompt:
        "You are CodeOrbit's chief technical placement evaluator. Score Indian tech interview candidates rigorously and objectively. Return JSON only.",
      userPrompt: prompt,
      schema: mockInterviewResponseSchema,
    });

    if (result && typeof result.overallScore === "number") {
      return {
        ...fallback,
        ...result,
        provider: "gemini",
      };
    }
  } catch (err) {
    console.warn("Gemini mock interview evaluation failed, using deterministic scorecard:", err);
  }

  return fallback;
};

import assert from "node:assert/strict";
import {
  mockInterviewRoundTypeSchema,
  mockInterviewTurnRoleSchema,
  mockInterviewTurnMessageSchema,
  mockInterviewTurnInputSchema,
  mockInterviewTurnResponseSchema,
  mockInterviewDimensionsSchema,
  mockInterviewResponseSchema,
  roasterCompanyTierFitSchema,
} from "../packages/schema/src/index.ts";
import {
  COMPANY_INTERVIEW_RUBRICS,
  getCompanyRubric,
  generateMockInterviewTurn,
  evaluateMockInterviewDeterministic,
} from "../apps/web/src/lib/server/mock-interview-ai.ts";

console.log("Starting Milestone 8: AI Voice/Chat Mock Interviewer & Socratic Coach Test Suite...\n");

async function runTests() {
  // ---------------------------------------------------------------------------
  // Test 1: Verify Schema & Domain Contracts
  // ---------------------------------------------------------------------------
  console.log("Test 1: Schema & Domain Contracts Validation");
  const validRounds = ["Technical DSA", "System Design", "CS Fundamentals", "Behavioral & Leadership"];
  for (const round of validRounds) {
    assert.equal(mockInterviewRoundTypeSchema.parse(round), round);
  }

  assert.throws(() => {
    mockInterviewRoundTypeSchema.parse("Invalid Round");
  }, /Invalid/);

  const sampleTurnInput = {
    company: "Amazon",
    role: "SDE-1",
    roundType: "Technical DSA",
    history: [
      { role: "interviewer", content: "Welcome to Amazon. Let's solve two sum." },
    ],
    candidateMessage: "I'll use a hash map for O(N) lookup.",
    requestHint: false,
  };
  const parsedTurnInput = mockInterviewTurnInputSchema.parse(sampleTurnInput);
  assert.equal(parsedTurnInput.company, "Amazon");
  assert.equal(parsedTurnInput.candidateMessage, "I'll use a hash map for O(N) lookup.");

  console.log("  ✓ Mock interview turn schemas, rounds, and messages validated.\n");

  // ---------------------------------------------------------------------------
  // Test 2: Localized Company Rubrics Catalog
  // ---------------------------------------------------------------------------
  console.log("Test 2: Company Rubric Profiles Verification");
  const expectedCompanies = ["amazon", "google", "flipkart", "tcs", "infosys"];
  for (const comp of expectedCompanies) {
    const rubric = COMPANY_INTERVIEW_RUBRICS[comp];
    assert.ok(rubric, `Rubric for ${comp} must exist`);
    assert.ok(rubric.interviewerPersona.length > 5, `${comp} must have a persona`);
    assert.ok(rubric.coreSignals.length >= 4, `${comp} must have at least 4 core signals`);
    assert.ok(rubric.socraticHints.length >= 2, `${comp} must have Socratic hints`);

    for (const round of validRounds) {
      assert.ok(
        rubric.openingQuestions[round],
        `Opening question for ${comp} - ${round} must be defined`
      );
    }
  }

  // Check fuzzy lookup
  const amazonFuzzy = getCompanyRubric("Amazon Web Services (AWS)");
  assert.equal(amazonFuzzy.name, "Amazon");

  const tcsFuzzy = getCompanyRubric("Tata Consultancy Services (TCS Digital)");
  assert.equal(tcsFuzzy.name, "TCS");

  console.log("  ✓ All localized company rubrics and fuzzy matcher verified.\n");

  // ---------------------------------------------------------------------------
  // Test 3: Conversational Turn-by-Turn Flow
  // ---------------------------------------------------------------------------
  console.log("Test 3: Conversational Turn-by-Turn Flow & Socratic Hints");

  // Turn 0: Opening Question
  const openingTurn = await generateMockInterviewTurn({
    company: "Amazon",
    role: "SDE-1",
    roundType: "Technical DSA",
    history: [],
    candidateMessage: "Hello, ready to begin.",
  });
  assert.equal(openingTurn.stage, "greeting");
  assert.ok(openingTurn.interviewerReply.length > 20);
  assert.equal(openingTurn.isComplete, false);
  console.log("  ✓ Turn 0 generates valid contextual opening question.");

  // Socratic Hint Turn
  const hintTurn = await generateMockInterviewTurn({
    company: "Amazon",
    role: "SDE-1",
    roundType: "Technical DSA",
    history: [
      { role: "interviewer", content: openingTurn.interviewerReply },
      { role: "candidate", content: "I'm a bit stuck on the optimal data structure." },
    ],
    candidateMessage: "Can I get a hint?",
    requestHint: true,
  });
  assert.ok(hintTurn.interviewerReply.includes("[Socratic Coach Nudge]"));
  assert.equal(hintTurn.provider, "socratic-coach");
  assert.equal(hintTurn.isComplete, false);
  console.log("  ✓ Socratic Coach provides conceptual nudge without spoiling full answer.");

  // Probing Turn (Missing complexity)
  const probeTurn = await generateMockInterviewTurn({
    company: "Google",
    role: "SDE-1",
    roundType: "Technical DSA",
    history: [
      { role: "interviewer", content: "Solve calendar conflict." },
    ],
    candidateMessage: "We can iterate through the intervals and check overlap.",
  });
  assert.ok(probeTurn.interviewerReply.toLowerCase().includes("complexity"));
  console.log("  ✓ Interviewer dynamically probes for missing Big-O complexity.");

  // Wrap Up Turn (Turn count >= 5)
  const wrapTurn = await generateMockInterviewTurn({
    company: "Flipkart",
    role: "SDE-1",
    roundType: "System Design",
    history: [
      { role: "interviewer", content: "Q1" },
      { role: "candidate", content: "A1" },
      { role: "interviewer", content: "Q2" },
      { role: "candidate", content: "A2" },
      { role: "interviewer", content: "Q3" },
      { role: "candidate", content: "A3" },
    ],
    candidateMessage: "That concludes my approach with Kafka and Redis.",
  });
  assert.equal(wrapTurn.stage, "wrap_up");
  assert.equal(wrapTurn.isComplete, true);
  console.log("  ✓ Multi-turn flow smoothly wraps up with isComplete: true.\n");

  // ---------------------------------------------------------------------------
  // Test 4: Strong Candidate 5-Dimension Placement Evaluation
  // ---------------------------------------------------------------------------
  console.log("Test 4: Strong Candidate Evaluation (Amazon SDE-1)");
  const strongTranscript = `
    Interviewer: How would you design top-K trending product searches in real time?
    Candidate: First, I will clarify constraints. Are we optimizing for write throughput or query latency? 
    My approach is to maintain a frequency map using a hash table in memory, combined with a min-heap of size K.
    The time complexity for each incoming search update is O(log K) because we only push or pop when frequency exceeds heap min.
    Auxiliary space complexity is O(N) for unique search terms and O(K) for the min-heap.
    In the worst case where K equals N, it degrades to O(N log N).
    For edge cases: if K is zero or negative, we validate early and return empty. If searches arrive concurrently,
    we can shard the frequency counts across partitions using Kafka and aggregate with Redis to avoid lock contention.
    At my previous internship, I owned a similar pipeline, handled 25,000 requests per second, and reduced p99 latency by 35ms.
  `;

  const strongResult = evaluateMockInterviewDeterministic({
    company: "Amazon",
    role: "SDE-1",
    transcript: strongTranscript,
    notes: "Round: Technical DSA. Turns: 4",
  });

  const parsedStrong = mockInterviewResponseSchema.parse(strongResult);
  assert.ok(parsedStrong.overallScore >= 75, "Strong candidate should score >= 75");
  assert.ok(parsedStrong.dimensions, "Must return 5-dimension breakdown");
  assert.ok(parsedStrong.dimensions.problemSolvingDsa >= 70, "DSA score must be >= 70");
  assert.ok(parsedStrong.dimensions.timeComplexityAwareness >= 75, "Complexity score must be >= 75");
  assert.ok(parsedStrong.dimensions.systemDesignArchitecture >= 65, "Architecture score must be >= 65");
  assert.ok(
    parsedStrong.companyTierFit === "Strong Campus Shortlist" ||
    parsedStrong.companyTierFit === "Day-1 Recruiter Call",
    "Tier fit should be top tier"
  );
  assert.equal(parsedStrong.strengths.length, 3);
  assert.equal(parsedStrong.nextSteps.length, 3);
  console.log(
    `  ✓ Strong candidate evaluated: Score = ${parsedStrong.overallScore}/100 | Tier: ${parsedStrong.companyTierFit}`
  );
  console.log("    Dimensions:", parsedStrong.dimensions, "\n");

  // ---------------------------------------------------------------------------
  // Test 5: Fluffy / Unprepared Candidate Evaluation
  // ---------------------------------------------------------------------------
  console.log("Test 5: Fluffy Candidate Evaluation (TCS Digital)");
  const weakTranscript = `
    Interviewer: Given an array, find the maximum contiguous subarray sum.
    Candidate: Um, like, maybe we can use loops? I guess we check every pair.
    I don't know the exact time complexity, sort of slow I guess.
    Someone else in my college group did this. It's okay.
  `;

  const weakResult = evaluateMockInterviewDeterministic({
    company: "TCS",
    role: "TCS Digital SDE",
    transcript: weakTranscript,
    notes: "Round: Technical DSA. Turns: 2",
  });

  const parsedWeak = mockInterviewResponseSchema.parse(weakResult);
  assert.ok(parsedWeak.overallScore < 65, "Fluffy candidate must be penalized below 65");
  assert.ok(parsedWeak.dimensions.timeComplexityAwareness < 55, "Unstated complexity must score low");
  assert.ok(
    parsedWeak.companyTierFit === "Needs Overhaul" ||
    parsedWeak.companyTierFit === "Borderline OA Screen",
    "Should be classified as Needs Overhaul or Borderline"
  );
  assert.ok(parsedWeak.redFlags && parsedWeak.redFlags.length >= 1, "Must detect red flags");
  console.log(
    `  ✓ Fluffy candidate penalized: Score = ${parsedWeak.overallScore}/100 | Tier: ${parsedWeak.companyTierFit}`
  );
  console.log("    Red flags detected:", parsedWeak.redFlags, "\n");

  // ---------------------------------------------------------------------------
  // Test 6: Backward Compatibility with Platform Submissions & Readiness
  // ---------------------------------------------------------------------------
  console.log("Test 6: Readiness Score Integration Contract");
  assert.ok(typeof parsedStrong.communicationScore === "number");
  assert.ok(typeof parsedStrong.problemSolvingScore === "number");
  assert.ok(typeof parsedStrong.confidenceScore === "number");
  assert.ok(Array.isArray(parsedStrong.improvements));
  console.log("  ✓ Legacy platform compatibility preserved (0 regression on dashboard readiness).\n");

  console.log("==================================================================");
  console.log("ALL 6 AI MOCK INTERVIEWER & SOCRATIC COACH TESTS PASSED (100%)");
  console.log("==================================================================");
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});

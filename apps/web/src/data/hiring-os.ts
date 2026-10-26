import {
  adminContentQueueItemSchema,
  companyTrackItemSchema,
  companyTrackSchema,
  faqItemSchema,
  featureFlagSchema,
  jobApplicationSchema,
  proofProfileSchema,
  publicPricingTierSchema,
  readinessDimensionSchema,
  resumeTemplateDescriptorSchema,
  recruiterCandidateSummarySchema,
  resourceItemSchema,
  roleTrackSchema,
  campusCohortSnapshotSchema,
  type AdminContentQueueItem,
  type CampusCohortSnapshot,
  type CompanyTrack,
  type CompanyTrackItem,
  type FaqItem,
  type FeatureFlag,
  type JobApplication,
  type ProofProfile,
  type PublicPricingTier,
  type ReadinessDimension,
  type ResumeTemplateDescriptor,
  type RecruiterCandidateSummary,
  type ResourceItem,
  type RoleTrack,
} from "@codeorbit/schema";

export const trustPrinciples = [
  {
    title: "India-first hiring context",
    description: "Built for fresher, intern, and lateral hiring patterns common across India-based teams and campus funnels.",
  },
  {
    title: "Privacy-aware by design",
    description: "Authenticated surfaces, consent-aware AI usage, and recruiter-safe proof sharing instead of public oversharing.",
  },
  {
    title: "Outcome-led workflow",
    description: "Readiness signals connect coding, resumes, interviews, and applications into one system instead of isolated tools.",
  },
] as const;

export const readinessDimensions = readinessDimensionSchema.array().parse([
  {
    key: "topic-mastery",
    label: "Topic mastery",
    description: "Depth across interview-critical topics such as arrays, trees, graphs, system patterns, and frontend problem solving.",
    weight: 22,
  },
  {
    key: "company-track-completion",
    label: "Company-track completion",
    description: "Completion quality across company and role-aligned question sets, not just generic practice volume.",
    weight: 16,
  },
  {
    key: "speed-to-solve",
    label: "Speed to solve",
    description: "How reliably the candidate reaches a clean solution within interview-friendly time targets.",
    weight: 12,
  },
  {
    key: "hint-dependence",
    label: "Hint independence",
    description: "How often a candidate can recover and reason without AI or editorial nudges.",
    weight: 10,
  },
  {
    key: "consistency",
    label: "Consistency",
    description: "Streak quality, repetition discipline, and whether practice is sustained enough to matter in a hiring cycle.",
    weight: 12,
  },
  {
    key: "mock-interview",
    label: "Mock interview performance",
    description: "Communication, structure, behavioral clarity, and round simulation quality over time.",
    weight: 12,
  },
  {
    key: "resume-fit",
    label: "Resume JD fit",
    description: "How well the current resume variant maps to the target role and recruiter-safe ATS expectations.",
    weight: 8,
  },
  {
    key: "proof-evidence",
    label: "Project and GitHub evidence",
    description: "Projects, shipping evidence, repo quality, and proof artifacts that support interview claims.",
    weight: 8,
  },
]);

export const companyDirectory = companyTrackSchema.array().parse([
  {
    slug: "amazon",
    name: "Amazon",
    headline: "High-volume interview readiness for intern, fresher, and L4-style loops.",
    hiringFocus: "OA, problem-solving depth, and leadership-principle clarity.",
    geographyRelevance: "India + Global",
    overview: "Strong for candidates targeting structured data structures rounds plus practical behavioral signal quality.",
    roleSlugs: ["sde-intern", "fresher-sde", "backend-engineer"],
    freshnessNote: "Maintained against current public prep patterns and recent candidate feedback.",
  },
  {
    slug: "google",
    name: "Google",
    headline: "Signal-heavy problem solving with strong clarity, edge-case handling, and follow-up depth.",
    hiringFocus: "Algorithmic quality, reasoning, and communication under pressure.",
    geographyRelevance: "India + Global",
    overview: "Useful for candidates who need better structure, speed, and explanation quality in high-signal interviews.",
    roleSlugs: ["sde-intern", "fresher-sde", "frontend-engineer", "backend-engineer"],
    freshnessNote: "Editorially reviewed around current public interview and candidate prep patterns.",
  },
  {
    slug: "microsoft",
    name: "Microsoft",
    headline: "Balanced preparation across coding, collaboration, and implementation trade-offs.",
    hiringFocus: "Clear explanations, maintainable solutions, and practical engineering judgment.",
    geographyRelevance: "India + Global",
    overview: "Good for candidates who need to connect coding quality with product and engineering trade-offs.",
    roleSlugs: ["sde-intern", "fresher-sde", "frontend-engineer", "backend-engineer"],
    freshnessNote: "Maintained with India-relevant role mapping and recent round formats.",
  },
  {
    slug: "infosys",
    name: "Infosys",
    headline: "Campus and fresher hiring preparation with practical OA and screening focus.",
    hiringFocus: "Speed, aptitude-adjacent coding, and reliable implementation basics.",
    geographyRelevance: "India-first",
    overview: "Well suited for early career candidates moving through India campus or mass hiring style funnels.",
    roleSlugs: ["sde-intern", "fresher-sde"],
    freshnessNote: "Refreshed to stay useful for India-first fresher hiring cycles.",
  },
  {
    slug: "tcs",
    name: "TCS",
    headline: "Fresher and campus readiness built around consistency, fundamentals, and assessment hygiene.",
    hiringFocus: "Round familiarity, baseline coding speed, and communication readiness.",
    geographyRelevance: "India-first",
    overview: "Best for candidates who need a dependable, structured ramp into India campus assessments and interviews.",
    roleSlugs: ["sde-intern", "fresher-sde"],
    freshnessNote: "Curated for India-first assessment formats and role expectations.",
  },
  {
    slug: "wipro",
    name: "Wipro",
    headline: "Assessment-led preparation with a focus on reliable execution and fresher interview comfort.",
    hiringFocus: "Coding basics, screening rounds, and confidence-building repetition.",
    geographyRelevance: "India-first",
    overview: "Useful for candidates looking for a stronger readiness layer before campus or off-campus applications.",
    roleSlugs: ["sde-intern", "fresher-sde"],
    freshnessNote: "Maintained around fresher hiring and India-specific screening expectations.",
  },
  {
    slug: "zoho",
    name: "Zoho",
    headline: "Hands-on implementation practice with practical coding and product-minded communication.",
    hiringFocus: "Problem solving, practical engineering, and focused candidate storytelling.",
    geographyRelevance: "India-first",
    overview: "Strong fit for candidates targeting product companies that care about grounded implementation skill.",
    roleSlugs: ["fresher-sde", "frontend-engineer", "backend-engineer"],
    freshnessNote: "Reviewed for current public interview expectations and product hiring trends in India.",
  },
  {
    slug: "flipkart",
    name: "Flipkart",
    headline: "Product-engineering readiness tuned for scale, clarity, and speed.",
    hiringFocus: "Problem solving, system thinking, and practical depth.",
    geographyRelevance: "India-first",
    overview: "Good for candidates aiming at India product companies with stronger problem solving and execution loops.",
    roleSlugs: ["fresher-sde", "frontend-engineer", "backend-engineer"],
    freshnessNote: "Maintained around India product hiring and likely round expectations.",
  },
  {
    slug: "razorpay",
    name: "Razorpay",
    headline: "Modern product-engineering prep with strong backend, frontend, and debugging signal.",
    hiringFocus: "Implementation depth, practical system judgment, and ownership.",
    geographyRelevance: "India-first",
    overview: "Helpful for candidates who need readiness beyond leetcode-style volume alone.",
    roleSlugs: ["fresher-sde", "frontend-engineer", "backend-engineer"],
    freshnessNote: "Reviewed for India fintech and startup engineering expectations.",
  },
  {
    slug: "swiggy",
    name: "Swiggy",
    headline: "Operational scale and product thinking blended into interview readiness.",
    hiringFocus: "Speed, trade-off awareness, and execution quality.",
    geographyRelevance: "India-first",
    overview: "Useful for candidates aiming at fast-moving India product teams where reliability and ownership both matter.",
    roleSlugs: ["fresher-sde", "frontend-engineer", "backend-engineer"],
    freshnessNote: "Maintained for India-first product engineering interview patterns.",
  },
]);

export const roleDirectory = roleTrackSchema.array().parse([
  {
    slug: "sde-intern",
    name: "SDE Intern",
    level: "Intern",
    summary: "A ramp for students who need clear technical fundamentals, recruiter-safe resumes, and structured campus applications.",
    focusSkills: ["DSA fundamentals", "communication basics", "resume clarity", "OA readiness"],
    interviewSignals: ["solving consistency", "coachability", "clean thinking", "intern-ready projects"],
  },
  {
    slug: "fresher-sde",
    name: "Fresher SDE",
    level: "Fresher",
    summary: "For graduates targeting India-first company hiring with strong coding signal plus portfolio proof.",
    focusSkills: ["problem solving", "project proof", "interview structure", "application quality"],
    interviewSignals: ["readiness score", "resume fit", "track completion", "mock interview improvement"],
  },
  {
    slug: "frontend-engineer",
    name: "Frontend Engineer",
    level: "Early Career",
    summary: "Role-specific readiness combining UI engineering, JavaScript depth, debugging, and communication clarity.",
    focusSkills: ["JavaScript", "React", "performance", "frontend architecture"],
    interviewSignals: ["implementation clarity", "portfolio quality", "UI proof", "product reasoning"],
  },
  {
    slug: "backend-engineer",
    name: "Backend Engineer",
    level: "Early Career",
    summary: "A readiness path for APIs, data modeling, systems thinking, and practical implementation trade-offs.",
    focusSkills: ["data structures", "APIs", "databases", "scalability basics"],
    interviewSignals: ["problem solving depth", "service design proof", "debugging quality", "communication"],
  },
]);

export const resumeTemplates = resumeTemplateDescriptorSchema.array().parse([
  {
    key: "signal-single-column",
    name: "Signal Single Column",
    headline: "Balanced ATS resume for product and platform roles",
    description: "A premium single-column layout tuned for early-career developers who want strong readability, compact sections, and recruiter-safe exports.",
    bestFor: ["General product roles", "Balanced ATS readability", "Most first-time exports"],
  },
  {
    key: "india-fresher",
    name: "India Fresher",
    headline: "Campus-friendly format for internships and fresher pipelines",
    description: "Optimized for India-first hiring cycles with sharper education placement, project proof, and clean bullet discipline for fresher screening.",
    bestFor: ["Campus placements", "Internship cycles", "Mass hiring and fresher funnels"],
  },
  {
    key: "product-engineer",
    name: "Product Engineer",
    headline: "Proof-heavy format for startup and product engineering teams",
    description: "Pushes projects, shipped outcomes, and technical ownership higher so the resume reads like a product-engineering case rather than a generic template.",
    bestFor: ["Startups and product teams", "Backend or frontend roles", "Project-led applications"],
  },
]) satisfies ResumeTemplateDescriptor[];

const companyNamesBySlug = Object.fromEntries(companyDirectory.map((company) => [company.slug, company.name]));

const questionPlaybook = {
  "two-sum": {
    title: "Two Sum",
    topic: "Arrays and hashing",
    difficulty: "Easy",
    idealTimeMinutes: 12,
    explanation: "Still one of the fastest ways to see whether a candidate can move from brute force to hash-map reasoning without losing clarity.",
    hints: ["Start from the O(n^2) baseline.", "Store complements, not just values.", "Keep index handling explicit."],
    rubric: ["Correct use of a map", "Explains time complexity", "Returns stable indices"],
  },
  "reverse-string": {
    title: "Reverse String",
    topic: "Strings and two pointers",
    difficulty: "Easy",
    idealTimeMinutes: 8,
    explanation: "Simple on paper, but useful for checking composure, pointer movement, and implementation hygiene in fast screens.",
    hints: ["Think in-place first.", "Move both pointers symmetrically.", "Call out mutation clearly."],
    rubric: ["Correct pointer movement", "No extra work", "Readable implementation"],
  },
  "valid-parentheses": {
    title: "Valid Parentheses",
    topic: "Stacks and validation",
    difficulty: "Easy",
    idealTimeMinutes: 12,
    explanation: "A recurring stack screen because it surfaces edge-case handling and clean control flow quickly.",
    hints: ["Map closing brackets to opening brackets.", "Push only openers.", "Empty-stack cases matter."],
    rubric: ["Handles mismatches", "Uses stack cleanly", "Explains edge cases"],
  },
  "binary-search": {
    title: "Binary Search",
    topic: "Binary search fundamentals",
    difficulty: "Easy",
    idealTimeMinutes: 10,
    explanation: "Still a must-do for interviews that want to test boundary handling, loop invariants, and calm problem narration.",
    hints: ["Define the invariant before coding.", "Watch off-by-one errors.", "Explain why left and right move."],
    rubric: ["Correct boundaries", "Explains invariant", "Avoids infinite loops"],
  },
  "valid-anagram": {
    title: "Valid Anagram",
    topic: "Hash maps and strings",
    difficulty: "Easy",
    idealTimeMinutes: 10,
    explanation: "A common early filter for character counting, frequency maps, and implementation cleanliness.",
    hints: ["Frequency counts beat sorting in interviews.", "Compare lengths early.", "Keep the pass count minimal."],
    rubric: ["Frequency logic is correct", "Checks lengths early", "Clear complexity explanation"],
  },
  "maximum-subarray": {
    title: "Maximum Subarray",
    topic: "Dynamic programming and Kadane",
    difficulty: "Medium",
    idealTimeMinutes: 18,
    explanation: "Useful because it distinguishes memorization from candidates who can explain a running-state optimization clearly.",
    hints: ["Track local best and global best separately.", "Explain the reset decision.", "Narrate with one example."],
    rubric: ["Kadane logic is correct", "Can explain recurrence", "Reads well under pressure"],
  },
  "longest-substring-without-repeating-characters": {
    title: "Longest Substring Without Repeating Characters",
    topic: "Sliding window",
    difficulty: "Medium",
    idealTimeMinutes: 20,
    explanation: "A classic medium that reveals whether the candidate truly understands sliding-window state, not just the name of the pattern.",
    hints: ["Track last seen positions.", "Only move the left pointer forward.", "Use a string example out loud."],
    rubric: ["Correct window movement", "Handles repeats correctly", "Explains the pattern clearly"],
  },
  "product-of-array-except-self": {
    title: "Product of Array Except Self",
    topic: "Prefix and suffix products",
    difficulty: "Medium",
    idealTimeMinutes: 20,
    explanation: "A strong signal for candidates who can avoid division, reason about space trade-offs, and compose two clean passes.",
    hints: ["Think prefix pass then suffix pass.", "Avoid division.", "Call out output array reuse."],
    rubric: ["Correct prefix-suffix logic", "No division", "Explains space trade-offs"],
  },
  "merge-intervals": {
    title: "Merge Intervals",
    topic: "Sorting and interval logic",
    difficulty: "Medium",
    idealTimeMinutes: 22,
    explanation: "Still one of the best medium questions for testing sorted reasoning, merging logic, and explanation quality.",
    hints: ["Sort first.", "Compare against the last merged interval.", "Explain why sorting unlocks the scan."],
    rubric: ["Sorts correctly", "Merges overlaps cleanly", "Explains why it works"],
  },
  "search-in-rotated-sorted-array": {
    title: "Search in Rotated Sorted Array",
    topic: "Binary search on modified order",
    difficulty: "Medium",
    idealTimeMinutes: 20,
    explanation: "Frequently used when interviewers want to test binary-search maturity beyond the base pattern.",
    hints: ["One side is always sorted.", "Decide which half to keep from the sorted side.", "Use the invariant to stay calm."],
    rubric: ["Understands sorted half", "Updates bounds correctly", "Talks through cases"],
  },
  "top-k-frequent-elements": {
    title: "Top K Frequent Elements",
    topic: "Hash maps and heaps",
    difficulty: "Medium",
    idealTimeMinutes: 24,
    explanation: "Shows whether the candidate can combine counting with ranking logic and justify a heap or sorting trade-off.",
    hints: ["Count frequencies first.", "Then choose sorting or heap based on constraints.", "Mention complexity before coding."],
    rubric: ["Correct frequency model", "Reasonable data structure choice", "Explains complexity trade-offs"],
  },
  "number-of-islands": {
    title: "Number of Islands",
    topic: "Graphs and grid traversal",
    difficulty: "Medium",
    idealTimeMinutes: 24,
    explanation: "A reliable graph-screen question because it tests traversal fundamentals, mutation discipline, and complexity reasoning.",
    hints: ["Model it as graph traversal.", "Mark visited nodes immediately.", "Talk through bounds checks first."],
    rubric: ["Correct traversal", "Handles bounds and visited state", "States complexity clearly"],
  },
  "rotting-oranges": {
    title: "Rotting Oranges",
    topic: "Breadth-first search",
    difficulty: "Medium",
    idealTimeMinutes: 24,
    explanation: "A practical BFS question that checks queue usage, layer timing, and whether the candidate can explain state transitions under pressure.",
    hints: ["Treat each minute as one BFS layer.", "Count fresh oranges separately.", "Think about impossible cases early."],
    rubric: ["Uses BFS layers correctly", "Tracks remaining fresh cells", "Explains the minute counter"],
  },
  "median-of-two-sorted-arrays": {
    title: "Median of Two Sorted Arrays",
    topic: "Advanced binary search",
    difficulty: "Hard",
    idealTimeMinutes: 35,
    explanation: "A stretch question for interviews that want very strong partition reasoning and calm handling of edge-heavy binary search.",
    hints: ["Partition the shorter array.", "Think in left and right halves.", "Use sentinels for boundaries."],
    rubric: ["Correct partition logic", "Explains invariants", "Handles edge cases cleanly"],
  },
} satisfies Record<
  string,
  Pick<CompanyTrackItem, "topic" | "difficulty" | "hints" | "idealTimeMinutes" | "rubric" | "explanation"> & {
    title: string;
  }
>;

const trackBlueprints = [
  { id: "amazon-two-sum-oa", companySlug: "amazon", roleSlug: "sde-intern", problemId: "two-sum", roundType: "OA", freshness: "fresh", geographyRelevance: "India + Global", sourceConfidence: "editor-reviewed", signal: "must-do", sourceLabel: "Public prep resources + candidate interview experience logs" },
  { id: "amazon-longest-substring-phone", companySlug: "amazon", roleSlug: "fresher-sde", problemId: "longest-substring-without-repeating-characters", roundType: "Phone", freshness: "fresh", geographyRelevance: "India + Global", sourceConfidence: "editor-reviewed", signal: "high-frequency", sourceLabel: "Public prep resources + candidate interview experience logs" },
  { id: "amazon-top-k-onsite", companySlug: "amazon", roleSlug: "backend-engineer", problemId: "top-k-frequent-elements", roundType: "Onsite", freshness: "maintained", geographyRelevance: "India + Global", sourceConfidence: "community-signal", signal: "stretch", sourceLabel: "Public prep resources + candidate interview experience logs" },
  { id: "google-binary-search-screen", companySlug: "google", roleSlug: "sde-intern", problemId: "binary-search", roundType: "Screening", freshness: "maintained", geographyRelevance: "India + Global", sourceConfidence: "editor-reviewed", signal: "must-do", sourceLabel: "Public prep resources + candidate interview experience logs" },
  { id: "google-islands-phone", companySlug: "google", roleSlug: "fresher-sde", problemId: "number-of-islands", roundType: "Phone", freshness: "fresh", geographyRelevance: "India + Global", sourceConfidence: "editor-reviewed", signal: "high-frequency", sourceLabel: "Public prep resources + candidate interview experience logs" },
  { id: "google-median-onsite", companySlug: "google", roleSlug: "frontend-engineer", problemId: "median-of-two-sorted-arrays", roundType: "Onsite", freshness: "maintained", geographyRelevance: "India + Global", sourceConfidence: "official-pattern", signal: "stretch", sourceLabel: "Public prep resources + candidate interview experience logs" },
  { id: "microsoft-valid-parentheses-screen", companySlug: "microsoft", roleSlug: "sde-intern", problemId: "valid-parentheses", roundType: "Screening", freshness: "maintained", geographyRelevance: "India + Global", sourceConfidence: "editor-reviewed", signal: "must-do", sourceLabel: "Public prep resources + candidate interview experience logs" },
  { id: "microsoft-merge-intervals-phone", companySlug: "microsoft", roleSlug: "fresher-sde", problemId: "merge-intervals", roundType: "Phone", freshness: "fresh", geographyRelevance: "India + Global", sourceConfidence: "editor-reviewed", signal: "high-frequency", sourceLabel: "Public prep resources + candidate interview experience logs" },
  { id: "microsoft-product-onsite", companySlug: "microsoft", roleSlug: "backend-engineer", problemId: "product-of-array-except-self", roundType: "Onsite", freshness: "maintained", geographyRelevance: "India + Global", sourceConfidence: "community-signal", signal: "high-frequency", sourceLabel: "Public prep resources + candidate interview experience logs" },
  { id: "infosys-reverse-string-oa", companySlug: "infosys", roleSlug: "sde-intern", problemId: "reverse-string", roundType: "OA", freshness: "fresh", geographyRelevance: "India-first", sourceConfidence: "editor-reviewed", signal: "must-do", sourceLabel: "India campus prep resources + interview experience logs" },
  { id: "infosys-valid-anagram-screen", companySlug: "infosys", roleSlug: "fresher-sde", problemId: "valid-anagram", roundType: "Screening", freshness: "fresh", geographyRelevance: "India-first", sourceConfidence: "community-signal", signal: "must-do", sourceLabel: "India campus prep resources + interview experience logs" },
  { id: "infosys-max-subarray-oa", companySlug: "infosys", roleSlug: "fresher-sde", problemId: "maximum-subarray", roundType: "OA", freshness: "maintained", geographyRelevance: "India-first", sourceConfidence: "community-signal", signal: "high-frequency", sourceLabel: "India campus prep resources + interview experience logs" },
  { id: "tcs-reverse-string-oa", companySlug: "tcs", roleSlug: "sde-intern", problemId: "reverse-string", roundType: "OA", freshness: "fresh", geographyRelevance: "India-first", sourceConfidence: "editor-reviewed", signal: "must-do", sourceLabel: "India campus prep resources + interview experience logs" },
  { id: "tcs-binary-search-screen", companySlug: "tcs", roleSlug: "fresher-sde", problemId: "binary-search", roundType: "Screening", freshness: "maintained", geographyRelevance: "India-first", sourceConfidence: "community-signal", signal: "must-do", sourceLabel: "India campus prep resources + interview experience logs" },
  { id: "tcs-max-subarray-oa", companySlug: "tcs", roleSlug: "fresher-sde", problemId: "maximum-subarray", roundType: "OA", freshness: "maintained", geographyRelevance: "India-first", sourceConfidence: "community-signal", signal: "high-frequency", sourceLabel: "India campus prep resources + interview experience logs" },
  { id: "wipro-valid-anagram-oa", companySlug: "wipro", roleSlug: "sde-intern", problemId: "valid-anagram", roundType: "OA", freshness: "fresh", geographyRelevance: "India-first", sourceConfidence: "community-signal", signal: "must-do", sourceLabel: "India campus prep resources + interview experience logs" },
  { id: "wipro-binary-search-screen", companySlug: "wipro", roleSlug: "fresher-sde", problemId: "binary-search", roundType: "Screening", freshness: "maintained", geographyRelevance: "India-first", sourceConfidence: "community-signal", signal: "must-do", sourceLabel: "India campus prep resources + interview experience logs" },
  { id: "wipro-reverse-string-phone", companySlug: "wipro", roleSlug: "fresher-sde", problemId: "reverse-string", roundType: "Phone", freshness: "maintained", geographyRelevance: "India-first", sourceConfidence: "community-signal", signal: "high-frequency", sourceLabel: "India campus prep resources + interview experience logs" },
  { id: "zoho-valid-parentheses-screen", companySlug: "zoho", roleSlug: "frontend-engineer", problemId: "valid-parentheses", roundType: "Screening", freshness: "fresh", geographyRelevance: "India-first", sourceConfidence: "editor-reviewed", signal: "must-do", sourceLabel: "Public prep resources + product-company interview experiences" },
  { id: "zoho-longest-substring-phone", companySlug: "zoho", roleSlug: "fresher-sde", problemId: "longest-substring-without-repeating-characters", roundType: "Phone", freshness: "fresh", geographyRelevance: "India-first", sourceConfidence: "editor-reviewed", signal: "high-frequency", sourceLabel: "Public prep resources + product-company interview experiences" },
  { id: "zoho-rotated-onsite", companySlug: "zoho", roleSlug: "backend-engineer", problemId: "search-in-rotated-sorted-array", roundType: "Onsite", freshness: "maintained", geographyRelevance: "India-first", sourceConfidence: "community-signal", signal: "stretch", sourceLabel: "Public prep resources + product-company interview experiences" },
  { id: "flipkart-merge-intervals-screen", companySlug: "flipkart", roleSlug: "fresher-sde", problemId: "merge-intervals", roundType: "Screening", freshness: "fresh", geographyRelevance: "India-first", sourceConfidence: "editor-reviewed", signal: "must-do", sourceLabel: "Public prep resources + product-company interview experiences" },
  { id: "flipkart-product-array-phone", companySlug: "flipkart", roleSlug: "backend-engineer", problemId: "product-of-array-except-self", roundType: "Phone", freshness: "maintained", geographyRelevance: "India-first", sourceConfidence: "official-pattern", signal: "high-frequency", sourceLabel: "Public prep resources + product-company interview experiences" },
  { id: "flipkart-islands-onsite", companySlug: "flipkart", roleSlug: "backend-engineer", problemId: "number-of-islands", roundType: "Onsite", freshness: "maintained", geographyRelevance: "India-first", sourceConfidence: "community-signal", signal: "stretch", sourceLabel: "Public prep resources + product-company interview experiences" },
  { id: "razorpay-valid-parentheses-screen", companySlug: "razorpay", roleSlug: "backend-engineer", problemId: "valid-parentheses", roundType: "Screening", freshness: "fresh", geographyRelevance: "India-first", sourceConfidence: "editor-reviewed", signal: "must-do", sourceLabel: "Fintech prep resources + interview experience logs" },
  { id: "razorpay-product-array-phone", companySlug: "razorpay", roleSlug: "backend-engineer", problemId: "product-of-array-except-self", roundType: "Phone", freshness: "fresh", geographyRelevance: "India-first", sourceConfidence: "editor-reviewed", signal: "high-frequency", sourceLabel: "Fintech prep resources + interview experience logs" },
  { id: "razorpay-top-k-onsite", companySlug: "razorpay", roleSlug: "backend-engineer", problemId: "top-k-frequent-elements", roundType: "Onsite", freshness: "maintained", geographyRelevance: "India-first", sourceConfidence: "community-signal", signal: "stretch", sourceLabel: "Fintech prep resources + interview experience logs" },
  { id: "swiggy-binary-search-screen", companySlug: "swiggy", roleSlug: "fresher-sde", problemId: "binary-search", roundType: "Screening", freshness: "fresh", geographyRelevance: "India-first", sourceConfidence: "editor-reviewed", signal: "must-do", sourceLabel: "Public prep resources + product-company interview experiences" },
  { id: "swiggy-islands-phone", companySlug: "swiggy", roleSlug: "backend-engineer", problemId: "number-of-islands", roundType: "Phone", freshness: "fresh", geographyRelevance: "India-first", sourceConfidence: "editor-reviewed", signal: "high-frequency", sourceLabel: "Public prep resources + product-company interview experiences" },
  { id: "swiggy-top-k-onsite", companySlug: "swiggy", roleSlug: "frontend-engineer", problemId: "top-k-frequent-elements", roundType: "Onsite", freshness: "maintained", geographyRelevance: "India-first", sourceConfidence: "community-signal", signal: "stretch", sourceLabel: "Public prep resources + product-company interview experiences" },
] as const;

export const trackItems = companyTrackItemSchema.array().parse(
  trackBlueprints.map((track, index) => {
    const question = questionPlaybook[track.problemId];
    const companyName = companyNamesBySlug[track.companySlug] ?? track.companySlug;

    return {
      ...track,
      title: `${companyName}: ${question.title}`,
      topic: question.topic,
      difficulty: question.difficulty,
      explanation: `${question.explanation} Use it as a ${track.signal ?? "high-frequency"} checkpoint for ${companyName} style ${track.roundType.toLowerCase()} rounds.`,
      hints: question.hints,
      idealTimeMinutes: question.idealTimeMinutes,
      rubric: question.rubric,
      lastUpdatedIso: `2026-03-${String(8 + (index % 9)).padStart(2, "0")}T09:00:00.000Z`,
    };
  })
);

export const publicPricingTiers = publicPricingTierSchema.array().parse([
  {
    id: "free",
    title: "Free",
    priceLabel: "₹0",
    cadence: "to start",
    description: "For candidates who want a trustworthy baseline before committing to a structured hiring workflow.",
    features: [
      "Practice problems and public company-track previews",
      "Starter readiness breakdown",
      "One resume baseline",
      "Public profile controls and privacy defaults",
    ],
    cta: "Start readiness assessment",
    availability: "live",
    spotlight: false,
  },
  {
    id: "pro",
    title: "Pro",
    priceLabel: "₹1,499",
    cadence: "per month",
    description: "For serious applicants who want verified readiness, better applications, and stronger hiring signal.",
    features: [
      "Full company and role tracks",
      "Verified readiness graph and weakness map",
      "Role-specific resume variants and exports",
      "Mock interviews, application tracker, and proof profile",
    ],
    cta: "Upgrade to Pro",
    availability: "live",
    spotlight: true,
  },
  {
    id: "interview-sprint",
    title: "Interview Sprint",
    priceLabel: "Apply for cohort",
    cadence: "2-4 week guided sprint",
    description: "A focused interview season workflow for candidates who need a tight, outcome-led push.",
    features: [
      "Sprint readiness plan",
      "Interview-focused score targets",
      "Resume and application review checkpoints",
      "Priority support during active hiring windows",
    ],
    cta: "Join sprint waitlist",
    availability: "waitlist",
    spotlight: false,
  },
  {
    id: "recruiter-campus",
    title: "Recruiter / Campus",
    priceLabel: "Contact sales",
    cadence: "beta",
    description: "For teams that want verified candidate filtering, readiness-aligned pipelines, and privacy-safe proof profiles.",
    features: [
      "Readiness-based candidate discovery",
      "Company-track alignment filters",
      "Campus and recruiter waitlist access",
      "Admin controls, flags, and hiring workflow foundations",
    ],
    cta: "Request beta access",
    availability: "contact",
    spotlight: false,
  },
]);

export const faqItems = faqItemSchema.array().parse([
  {
    question: "What makes CodeOrbit different from a coding prep site?",
    answer: "CodeOrbit is built as a verified developer hiring OS. Practice is only one layer. The product also turns that work into readiness scores, recruiter-safe resumes, proof profiles, mock interview history, and application workflows.",
  },
  {
    question: "Do you claim official partnerships or hiring guarantees?",
    answer: "No. CodeOrbit does not fabricate employer ties, placement claims, or guaranteed outcomes. Company tracks reflect editorial review and public candidate-prep patterns, not employer endorsement.",
  },
  {
    question: "Is this useful only for India-based candidates?",
    answer: "The product is India-first by default because hiring workflows, campus patterns, pricing, and recruiter expectations can differ. It still supports global roles and globally recognized company preparation.",
  },
  {
    question: "Can I keep my profile private while I prepare?",
    answer: "Yes. Public proof sharing is opt-in. Private workspaces, AI usage consent, and authenticated surfaces remain the default posture.",
  },
  {
    question: "What does the readiness score actually measure?",
    answer: "It combines topic mastery, company-track completion, speed to solve, hint independence, streak consistency, mock interview performance, resume fit, and project evidence into one hiring-focused picture.",
  },
]);

export const resourceItems = resourceItemSchema.array().parse([
  {
    slug: "india-fresher-readiness-playbook",
    title: "India fresher readiness playbook",
    category: "Hiring playbook",
    description: "How to move from random problem solving to recruiter-safe applications when you are early in your career.",
    readTimeMinutes: 7,
    updatedAtIso: "2026-03-15T09:00:00.000Z",
  },
  {
    slug: "company-tracks-vs-random-practice",
    title: "Why company tracks beat random practice",
    category: "Strategy",
    description: "A practical breakdown of why role- and company-aligned preparation creates better interview signal.",
    readTimeMinutes: 6,
    updatedAtIso: "2026-03-14T09:00:00.000Z",
  },
  {
    slug: "resume-proof-for-developers",
    title: "What recruiter-safe proof looks like for developers",
    category: "Resume and portfolio",
    description: "How to turn coding work, projects, and interview practice into better proof instead of louder claims.",
    readTimeMinutes: 8,
    updatedAtIso: "2026-03-13T09:00:00.000Z",
  },
]);

export const publicProofProfiles = proofProfileSchema.array().parse([
  {
    handle: "aarav-mehta",
    fullName: "Aarav Mehta",
    headline: "Fresher backend engineer focused on product and fintech roles.",
    location: "Bengaluru, India",
    bio: "Aarav uses CodeOrbit to turn structured problem practice, backend projects, and mock interviews into a recruiter-safe proof profile.",
    languageSupport: ["en", "hi"],
    solvedCount: 126,
    streakDays: 19,
    topTopics: ["Arrays", "Graphs", "APIs", "Databases"],
    readiness: {
      overallScore: 82,
      topicMasteryScore: 84,
      companyTrackScore: 79,
      speedToSolveScore: 76,
      hintDependenceScore: 81,
      consistencyScore: 88,
      mockInterviewScore: 78,
      resumeFitScore: 85,
      projectEvidenceScore: 80,
      weakTopics: ["Dynamic programming", "Behavioral storytelling"],
      companyScores: [
        { key: "razorpay", label: "Razorpay", score: 86, insight: "Strong backend and product-fit signal." },
        { key: "flipkart", label: "Flipkart", score: 81, insight: "Solid on scale basics, needs sharper trade-off language." },
      ],
      roleScores: [
        { key: "backend-engineer", label: "Backend Engineer", score: 85, insight: "Best match today." },
        { key: "fresher-sde", label: "Fresher SDE", score: 80, insight: "Ready to apply with resume tuning." },
      ],
      timeline: [
        { label: "Week 1", score: 58, recordedAtIso: "2026-02-01T09:00:00.000Z" },
        { label: "Week 3", score: 68, recordedAtIso: "2026-02-15T09:00:00.000Z" },
        { label: "Week 6", score: 74, recordedAtIso: "2026-03-01T09:00:00.000Z" },
        { label: "Today", score: 82, recordedAtIso: "2026-03-16T09:00:00.000Z" },
      ],
    },
    resumeVariants: [
      {
        id: "aarav-backend-pro",
        name: "Backend product resume",
        roleSlug: "backend-engineer",
        targetCompanySlug: "razorpay",
        locale: "en",
        templateKey: "recruiter-safe-modern",
        atsScore: 87,
        summary: "Weighted toward backend APIs, shipping proof, and project ownership.",
        updatedAtIso: "2026-03-15T09:00:00.000Z",
        lastExportedAtIso: "2026-03-15T18:30:00.000Z",
      },
    ],
    topProjects: [
      {
        title: "Merchant settlement simulator",
        summary: "Built a Node and Postgres service that models settlement flows, retries, and ledger-safe updates.",
        repositoryUrl: "https://github.com/example/merchant-settlement",
        proofPoints: ["Role-based APIs", "Postgres transactions", "Audit logs and retries"],
        lastUpdatedIso: "2026-03-10T09:00:00.000Z",
      },
    ],
    companyTrackProgress: [
      { key: "razorpay", label: "Razorpay", score: 86, insight: "Near ready to apply." },
      { key: "flipkart", label: "Flipkart", score: 81, insight: "Strong fit with a sharper resume variant." },
    ],
    publicResumeUrl: "https://example.com/resume/aarav-mehta.pdf",
    updatedAtIso: "2026-03-16T09:00:00.000Z",
  },
]);

export const jobWorkflowPreview = jobApplicationSchema.array().parse([
  {
    id: "razorpay-backend-1",
    company: "Razorpay",
    role: "Backend Engineer",
    location: "Bengaluru",
    source: "Company careers",
    status: "saved",
    readinessMatchScore: 86,
    resumeVariantId: "aarav-backend-pro",
    nextAction: "Attach backend product resume and apply this week.",
    stages: [{ stage: "Application prep", status: "planned", notes: "Resume already tuned for backend role." }],
    createdAtIso: "2026-03-16T09:00:00.000Z",
    updatedAtIso: "2026-03-16T09:00:00.000Z",
  },
  {
    id: "flipkart-fresher-1",
    company: "Flipkart",
    role: "Fresher SDE",
    location: "Bengaluru",
    source: "Referral",
    status: "interviewing",
    readinessMatchScore: 81,
    resumeVariantId: "aarav-backend-pro",
    nextAction: "Repeat system reasoning mock before next round.",
    stages: [
      { stage: "Application", status: "completed" },
      { stage: "Phone screen", status: "completed" },
      { stage: "Technical round 2", status: "planned", scheduledAtIso: "2026-03-22T11:00:00.000Z" },
    ],
    createdAtIso: "2026-03-05T09:00:00.000Z",
    updatedAtIso: "2026-03-16T09:00:00.000Z",
  },
]);

export const recruiterCandidatePreview = recruiterCandidateSummarySchema.array().parse([
  {
    handle: "aarav-mehta",
    fullName: "Aarav Mehta",
    headline: "Fresher backend engineer focused on product and fintech roles.",
    readinessScore: 82,
    targetRoleSlugs: ["backend-engineer", "fresher-sde"],
    targetCompanySlugs: ["razorpay", "flipkart"],
    interviewMomentum: "rising",
    proofProfileShared: true,
  },
  {
    handle: "priya-verma",
    fullName: "Priya Verma",
    headline: "Frontend engineer with strong React and performance fundamentals.",
    readinessScore: 78,
    targetRoleSlugs: ["frontend-engineer"],
    targetCompanySlugs: ["google", "swiggy", "zoho"],
    interviewMomentum: "steady",
    proofProfileShared: true,
  },
]);

export const campusCohortPreview = campusCohortSnapshotSchema.array().parse([
  {
    id: "iit-delhi-2026",
    cohortLabel: "IIT Delhi · 2026 graduating batch",
    studentsActive: 148,
    studentsReady: 39,
    applicationsTracked: 214,
    interviewsTracked: 67,
    topWeakAreas: ["Behavioral structure", "Dynamic programming", "Resume role fit"],
  },
  {
    id: "vtu-bengaluru-2026",
    cohortLabel: "VTU Bengaluru · placement sprint",
    studentsActive: 204,
    studentsReady: 51,
    applicationsTracked: 286,
    interviewsTracked: 83,
    topWeakAreas: ["OA speed", "Project proof", "Backend system reasoning"],
  },
]);

export const featureFlags = featureFlagSchema.array().parse([
  {
    key: "recruiter-beta-filtering",
    label: "Recruiter beta filtering",
    description: "Turns on readiness-based candidate filtering for recruiter beta environments.",
    enabledDefault: false,
  },
  {
    key: "campus-proof-sharing",
    label: "Campus proof profile sharing",
    description: "Allows placement cells to review curated proof-profile links during pilot programs.",
    enabledDefault: false,
  },
  {
    key: "resume-version-history",
    label: "Resume version history",
    description: "Stores recruiter-facing resume variants and export checkpoints.",
    enabledDefault: true,
  },
]);

export const adminContentQueue = adminContentQueueItemSchema.array().parse([
  {
    id: "track-google-frontend-refresh",
    type: "track",
    title: "Google frontend onsite refresh",
    status: "review",
    owner: "Content Ops",
    updatedAtIso: "2026-03-16T09:00:00.000Z",
  },
  {
    id: "rubric-razorpay-backend-v2",
    type: "rubric",
    title: "Razorpay backend rubric v2",
    status: "draft",
    owner: "Hiring Science",
    updatedAtIso: "2026-03-15T09:00:00.000Z",
  },
  {
    id: "pricing-pro-launch",
    type: "pricing",
    title: "Pro pricing launch config",
    status: "published",
    owner: "Growth",
    updatedAtIso: "2026-03-14T09:00:00.000Z",
  },
]);

export const companyTopics = Array.from(new Set(trackItems.map((item) => item.topic))).sort((left, right) =>
  left.localeCompare(right)
);

export const getCompanyBySlug = (slug: string) => companyDirectory.find((company) => company.slug === slug) ?? null;
export const getRoleBySlug = (slug: string) => roleDirectory.find((role) => role.slug === slug) ?? null;
export const getTracksByCompany = (companySlug: string) =>
  trackItems.filter((track) => track.companySlug === companySlug);
export const getTracksByRole = (roleSlug: string) => trackItems.filter((track) => track.roleSlug === roleSlug);
export const getProofProfileByHandle = (handle: string) =>
  publicProofProfiles.find((profile) => profile.handle === handle) ?? null;

export type HiringOsDataIndex = {
  campusCohorts: CampusCohortSnapshot[];
  companies: CompanyTrack[];
  roles: RoleTrack[];
  trackItems: CompanyTrackItem[];
  resumeTemplates: ResumeTemplateDescriptor[];
  pricing: PublicPricingTier[];
  faq: FaqItem[];
  resources: ResourceItem[];
  readiness: ReadinessDimension[];
  proofProfiles: ProofProfile[];
  recruiterCandidates: RecruiterCandidateSummary[];
  applications: JobApplication[];
  featureFlags: FeatureFlag[];
  adminQueue: AdminContentQueueItem[];
};

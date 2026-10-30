import assert from "node:assert/strict";
import {
  resumeRoasterInputSchema,
  resumeRoasterResponseSchema,
  roasterCompanyTierFitSchema,
  resumeResponseSchema,
} from "../packages/schema/src/index.ts";
import {
  COMPANY_ATS_PROFILES,
  roastResumeDeterministic,
} from "../apps/web/src/lib/server/resume-ai.ts";
import {
  buildResumeLatexSource,
  buildResumePdfBuffer,
} from "../apps/web/src/lib/server/resume-utils.ts";

console.log("Starting Milestone 7: ATS AI Resume Builder & Viral Roaster Test Suite...\n");

async function runTests() {
  // Test 1: Verify Schema & Domain Contracts
  console.log("Test 1: Roaster Schema & Tier Fit validation");
  const validTiers = [
    "Needs Overhaul",
    "Borderline OA Screen",
    "Strong Campus Shortlist",
    "Day-1 Recruiter Call",
  ];
  for (const tier of validTiers) {
    assert.equal(roasterCompanyTierFitSchema.parse(tier), tier);
  }

  // Reject invalid tier
  assert.throws(() => {
    roasterCompanyTierFitSchema.parse("Unranked");
  }, /Invalid/);
  console.log("  ✓ Roaster tier fits and domain schemas validated.\n");

  // Test 2: Target Company Profiles Verification
  console.log("Test 2: Company Role Profiles Catalog verification");
  const expectedCompanies = ["amazon", "infosys", "tcs", "flipkart", "google", "microsoft", "swiggy", "razorpay", "zoho"];
  for (const company of expectedCompanies) {
    const profile = COMPANY_ATS_PROFILES[company];
    assert.ok(profile, `Profile for ${company} must exist`);
    assert.ok(profile.expectedKeywords.length >= 8, `${company} must have at least 8 target keywords`);
    assert.ok(profile.cultureNotes.length > 20, `${company} must have rich culture criteria`);
  }
  console.log("  ✓ All 9 localized Indian & Global tech company profiles verified.\n");

  // Test 3: Amazon SDE-1 Targeted Resume Evaluation
  console.log("Test 3: Roasting Tech Resume against Amazon SDE-1 benchmarks");
  const amazonResume = `
    Rohan Patel | Bangalore | github.com/rohan-dev
    Built high-scale microservices using AWS EC2, S3, and distributed systems.
    Optimized database queries, reducing p99 latency by 45ms and saving 20% cloud compute costs.
    Engineered concurrent background job workers handling 50k requests per second.
    Extensive practice with data structures, algorithms, and unit testing.
  `;

  const amazonResult = roastResumeDeterministic({
    resumeText: amazonResume,
    targetCompany: "Amazon",
    targetRole: "SDE-1",
  });

  const parsedAmazon = resumeRoasterResponseSchema.parse(amazonResult);
  assert.ok(parsedAmazon.overallAtsScore >= 75, "Amazon resume with AWS & latency metrics should score >= 75");
  assert.ok(parsedAmazon.metricRoast.quantifiedBulletsCount >= 2, "Should detect at least 2 quantified metrics (45ms, 20%, 50k)");
  assert.equal(parsedAmazon.threeCriticalFixes.length, 3, "Must return exactly 3 actionable fixes");
  assert.match(parsedAmazon.socialShareText, /#CodeOrbitReady/, "Must contain viral #CodeOrbitReady hashtag");
  console.log("  ✓ Amazon SDE-1 evaluation: score =", parsedAmazon.overallAtsScore, "| Tier:", parsedAmazon.companyTierFit, "\n");

  // Test 4: Fluffy Resume Shredding (TCS / Infosys benchmark)
  console.log("Test 4: Fluffy Resume with generic buzzwords evaluation");
  const fluffyResume = `
    Aman Gupta | Delhi | aman@email.com
    Self-motivated and hardworking software engineer. Quick learner, passionate team player, and detail-oriented go-getter.
    Worked on college website in a team of 4 members. Created pages using HTML and CSS.
  `;

  const fluffyResult = roastResumeDeterministic({
    resumeText: fluffyResume,
    targetCompany: "TCS",
    targetRole: "TCS Digital SDE",
  });

  const parsedFluffy = resumeRoasterResponseSchema.parse(fluffyResult);
  assert.ok(parsedFluffy.overallAtsScore < 70, "Fluffy resume without metrics should be penalized");
  assert.ok(parsedFluffy.metricRoast.fluffyBulletsCount >= 3, "Must detect generic buzzwords (hardworking, passionate, team player)");
  assert.match(parsedFluffy.roastHeadline, /Danger Zone|Borderline|ChatGPT/i);
  console.log("  ✓ Fluffy resume penalized: score =", parsedFluffy.overallAtsScore, "| Buzzwords detected:", parsedFluffy.metricRoast.fluffyBulletsCount, "\n");

  // Test 5: Clean LaTeX Source Generation
  console.log("Test 5: Clean Recruiter-Approved LaTeX Source Generation");
  const mockDraft = {
    fullName: "Aarav Sharma",
    headline: "Incoming SDE-1 @ Amazon | NIT Trichy",
    summary: "Computer Science graduate with deep practice in distributed systems, algorithms, and high-concurrency microservices.",
    templateKey: "signal-single-column",
    templateName: "Signal Single-Column",
    atsScore: 92,
    markdown: "# Aarav Sharma\nIncoming SDE-1",
    skills: ["Data Structures", "Algorithms", "Java", "AWS", "Kafka", "SQL"],
    experience: [
      {
        title: "Software Engineering Intern",
        organization: "Flipkart",
        timeline: "May 2024 - Jul 2024",
        bullets: [
          "Optimized checkout latency by 35% across 2M daily active users.",
          "Implemented Redis caching layer with 99.9% uptime SLA.",
        ],
      },
    ],
    achievements: [
      "Ranked Top 1% in CodeOrbit National Placement Contest (Batch 2025).",
      "Solved 400+ DSA problems across arrays, trees, and graphs.",
    ],
    projects: [
      {
        title: "Distributed Order Processing Engine",
        link: "https://github.com/aarav/order-engine",
        bullets: [
          "Engineered an event-driven architecture using Apache Kafka and Go.",
          "Handled 15,000 orders/second with zero message drops.",
        ],
      },
    ],
    education: [
      {
        institution: "National Institute of Technology (NIT), Trichy",
        degree: "B.Tech in Computer Science and Engineering",
        details: "CGPA: 8.9/10",
      },
    ],
    certifications: ["AWS Certified Solutions Architect"],
    provider: "codeorbit-test",
    atsBreakdown: {
      summary: "High ATS compatibility",
      categories: [],
      matchedKeywords: ["AWS", "Kafka", "Java"],
      missingKeywords: [],
      improvementActions: [],
    },
    latexSource: "",
  };

  const latex = buildResumeLatexSource(mockDraft);
  assert.ok(latex.includes("\\documentclass[11pt]{article}"), "LaTeX must be clean article class");
  assert.ok(latex.includes("Aarav Sharma"), "LaTeX must contain candidate name");
  assert.ok(latex.includes("Distributed Order Processing Engine"), "LaTeX must contain project title");
  assert.ok(!latex.includes("TODO"), "LaTeX must contain zero TODOs");
  console.log("  ✓ Clean single-page LaTeX generated without word-processor artifacts.\n");

  // Test 6: PDF Binary Generation
  console.log("Test 6: Recruiter PDF binary generation with pdf-lib");
  const pdfBuffer = await buildResumePdfBuffer(mockDraft);
  assert.ok(Buffer.isBuffer(pdfBuffer), "Output must be a Node.js Buffer");
  assert.ok(pdfBuffer.length > 500, "PDF buffer must contain binary payload");
  assert.equal(pdfBuffer.subarray(0, 4).toString(), "%PDF", "Buffer header must match %PDF signature");
  console.log("  ✓ Valid single-page PDF binary generated (size: " + pdfBuffer.length + " bytes).\n");

  console.log("==================================================================");
  console.log("ALL 6 ATS RESUME BUILDER & ROASTER TESTS PASSED (100%)");
  console.log("==================================================================");
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});

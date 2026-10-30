import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scoreStr = searchParams.get("score") || "88";
    const score = Math.max(0, Math.min(100, parseInt(scoreStr, 10) || 88));
    const company = searchParams.get("company") || "Amazon";
    const role = searchParams.get("role") || "SDE-1";
    const tier = searchParams.get("tier") || "Strong Campus Shortlist";
    const candidate = searchParams.get("candidate") || "Verified Candidate";

    // Dynamic color palette based on ATS score tier
    let scoreColor = "#10B981"; // Emerald
    let scoreBg = "rgba(16, 185, 129, 0.15)";
    let scoreBorder = "rgba(16, 185, 129, 0.4)";
    if (score < 50) {
      scoreColor = "#F43F5E"; // Rose
      scoreBg = "rgba(244, 63, 94, 0.15)";
      scoreBorder = "rgba(244, 63, 94, 0.4)";
    } else if (score < 70) {
      scoreColor = "#F59E0B"; // Amber
      scoreBg = "rgba(245, 158, 11, 0.15)";
      scoreBorder = "rgba(245, 158, 11, 0.4)";
    } else if (score < 85) {
      scoreColor = "#06B6D4"; // Cyan
      scoreBg = "rgba(6, 182, 212, 0.15)";
      scoreBorder = "rgba(6, 182, 212, 0.4)";
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#0B0F17",
            backgroundImage:
              "radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.15), transparent 40%), radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.15), transparent 40%)",
            color: "#FFFFFF",
            padding: "50px 60px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "900",
                  fontSize: "24px",
                  color: "#FFFFFF",
                }}
              >
                C
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px" }}>
                  CodeOrbit
                </span>
                <span style={{ fontSize: "12px", color: "#94A3B8", letterSpacing: "0.5px" }}>
                  CAREER READINESS & VERIFIED HIRING ECOSYSTEM
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 16px",
                borderRadius: "999px",
                backgroundColor: "rgba(30, 41, 59, 0.8)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                fontSize: "13px",
                fontWeight: "600",
                color: "#E2E8F0",
              }}
            >
              🇮🇳 India Campus Placement 2026–2027
            </div>
          </div>

          {/* Main Body */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "40px",
              margin: "30px 0",
            }}
          >
            {/* Left: Score Box */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "36px 44px",
                borderRadius: "24px",
                backgroundColor: scoreBg,
                border: `2px solid ${scoreBorder}`,
                minWidth: "320px",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#94A3B8", letterSpacing: "1.5px" }}>
                ATS READINESS SCORE
              </span>
              <div style={{ display: "flex", alignItems: "baseline", margin: "10px 0" }}>
                <span
                  style={{
                    fontSize: "92px",
                    fontWeight: "900",
                    lineHeight: "1",
                    color: scoreColor,
                    letterSpacing: "-2px",
                  }}
                >
                  {score}
                </span>
                <span style={{ fontSize: "32px", fontWeight: "600", color: "#64748B", marginLeft: "6px" }}>
                  /100
                </span>
              </div>
              <div
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(15, 23, 42, 0.8)",
                  border: `1px solid ${scoreBorder}`,
                  fontSize: "13px",
                  fontWeight: "700",
                  color: scoreColor,
                }}
              >
                {tier}
              </div>
            </div>

            {/* Right: Candidate Profile & Badges */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                justifyContent: "center",
                padding: "10px 0",
              }}
            >
              <div style={{ fontSize: "15px", color: "#38BDF8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
                Target Placement Assessment
              </div>
              <div style={{ fontSize: "36px", fontWeight: "800", color: "#F8FAFC", marginTop: "6px", marginBottom: "14px" }}>
                {company} <span style={{ color: "#94A3B8", fontWeight: "500" }}>({role})</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "15px", color: "#CBD5E1" }}>
                  <span style={{ color: "#10B981", fontWeight: "bold" }}>✓</span>
                  <span>ATS Keyword Match & Quantitative Bullet Depth Cleared</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "15px", color: "#CBD5E1" }}>
                  <span style={{ color: "#10B981", fontWeight: "bold" }}>✓</span>
                  <span>Zero ChatGPT Hallucination / Anti-Keyword Stuffing Validated</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "15px", color: "#CBD5E1" }}>
                  <span style={{ color: "#38BDF8", fontWeight: "bold" }}>★</span>
                  <span>Evaluated via CodeOrbit AI Resume Roaster ({candidate})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "20px",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: "14px",
              color: "#94A3B8",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ color: "#38BDF8", fontWeight: "800", fontSize: "16px" }}>
                #CodeOrbitReady
              </span>
              <span>•</span>
              <span>Free instant ATS roasting & localized company prep</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", color: "#E2E8F0" }}>
              <span>codeorbit.app/resume-roaster</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (err) {
    console.error("OpenGraph image generation error:", err);
    return new Response("Failed to generate OpenGraph image", { status: 500 });
  }
}

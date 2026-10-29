import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get("title")?.slice(0, 80) || "CodeOrbit";
    const subtitle =
      searchParams.get("subtitle")?.slice(0, 120) ||
      "India-first verified developer hiring OS & career readiness ecosystem.";
    const score = searchParams.get("score")?.slice(0, 10);
    const badge = searchParams.get("badge")?.slice(0, 40) || "VERIFIED PROOF";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#0B0F19",
            padding: "60px 70px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            position: "relative",
          }}
        >
          {/* Ambient background glows */}
          <div
            style={{
              position: "absolute",
              top: "-120px",
              right: "-80px",
              width: "480px",
              height: "480px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(11, 15, 25, 0) 70%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-100px",
              left: "-60px",
              width: "420px",
              height: "420px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(16, 185, 129, 0.20) 0%, rgba(11, 15, 25, 0) 70%)",
            }}
          />

          {/* Top Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  backgroundColor: "#6366F1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  fontWeight: 900,
                  fontSize: "24px",
                  boxShadow: "0 4px 20px rgba(99, 102, 241, 0.5)",
                }}
              >
                CO
              </div>
              <span
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  letterSpacing: "-0.5px",
                  color: "#FFFFFF",
                }}
              >
                Code<span style={{ color: "#818CF8" }}>Orbit</span>
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 18px",
                borderRadius: "999px",
                backgroundColor: "rgba(99, 102, 241, 0.15)",
                border: "1px solid rgba(129, 140, 248, 0.3)",
                color: "#A5B4FC",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              <span>{badge}</span>
            </div>
          </div>

          {/* Main Body */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              maxWidth: "920px",
            }}
          >
            <h1
              style={{
                fontSize: "56px",
                fontWeight: 900,
                color: "#F8FAFC",
                lineHeight: "1.15",
                margin: 0,
                letterSpacing: "-1.5px",
              }}
            >
              {title}
            </h1>

            <p
              style={{
                fontSize: "24px",
                color: "#94A3B8",
                lineHeight: "1.45",
                margin: 0,
              }}
            >
              {subtitle}
            </p>
          </div>

          {/* Bottom Footer & Readiness Score Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(148, 163, 184, 0.15)",
              paddingTop: "28px",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <span style={{ fontSize: "16px", color: "#64748B", fontWeight: 600 }}>
                codeorbit.app
              </span>
              <span style={{ fontSize: "16px", color: "#475569" }}>•</span>
              <span style={{ fontSize: "16px", color: "#64748B" }}>
                India-first Verified Developer Ecosystem
              </span>
            </div>

            {score && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 22px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(52, 211, 153, 0.4)",
                }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: "#10B981",
                  }}
                />
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "#34D399",
                    letterSpacing: "0.5px",
                  }}
                >
                  READINESS: {score}/100
                </span>
              </div>
            )}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      }
    );
  } catch (error) {
    console.error("OpenGraph card generation error:", error);
    return new Response("Failed to generate OG image", { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, AuthenticationError } from "@/lib/server/auth-guard";
import {
  evaluateGauntletRound1,
  evaluateGauntletRound3Defense,
  evaluateGauntletRound4Behavioral,
  computeTotalPfi,
  getAvailableGauntletCredits,
  GAUNTLET_ROLE_CONFIGS,
  type GauntletRoleTrack,
} from "@/lib/server/gauntlet-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const gauntletActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("get_credits"),
  }),
  z.object({
    action: z.literal("start_round_1"),
    roleTrack: z.enum(["frontend-sde", "backend-sde", "fullstack-sde", "data-python", "mass-recruiter-ninja"]),
    resumeText: z.string().min(10).max(10_000),
  }),
  z.object({
    action: z.literal("submit_round_3_defense"),
    roleTrack: z.enum(["frontend-sde", "backend-sde", "fullstack-sde", "data-python", "mass-recruiter-ninja"]),
    candidateCode: z.string().max(20_000),
    defenseTranscript: z.string().min(5).max(10_000),
  }),
  z.object({
    action: z.literal("submit_round_4_behavioral"),
    roleTrack: z.enum(["frontend-sde", "backend-sde", "fullstack-sde", "data-python", "mass-recruiter-ninja"]),
    behavioralTranscript: z.string().min(5).max(10_000),
  }),
  z.object({
    action: z.literal("finalize_pfi"),
    r1: z.number().min(0).max(100),
    r2: z.number().min(0).max(350),
    r3: z.number().min(0).max(400),
    r4: z.number().min(0).max(150),
  }),
]);

export async function POST(request: NextRequest) {
  try {
    const viewer = await requireAuth(request.headers);
    const body = await request.json();
    const payload = gauntletActionSchema.parse(body);

    if (payload.action === "get_credits") {
      const quota = getAvailableGauntletCredits(viewer);
      return NextResponse.json(quota);
    }

    if (payload.action === "start_round_1") {
      const result = await evaluateGauntletRound1(payload.roleTrack, payload.resumeText);
      const targetProblem = GAUNTLET_ROLE_CONFIGS[payload.roleTrack].targetOaProblem;
      return NextResponse.json({
        ...result,
        targetProblem,
      });
    }

    if (payload.action === "submit_round_3_defense") {
      const result = await evaluateGauntletRound3Defense(
        payload.roleTrack,
        payload.candidateCode,
        payload.defenseTranscript
      );
      return NextResponse.json(result);
    }

    if (payload.action === "submit_round_4_behavioral") {
      const result = await evaluateGauntletRound4Behavioral(
        payload.roleTrack,
        payload.behavioralTranscript
      );
      return NextResponse.json(result);
    }

    if (payload.action === "finalize_pfi") {
      const summary = computeTotalPfi(payload.r1, payload.r2, payload.r3, payload.r4);
      return NextResponse.json(summary);
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { message: "Authentication required to participate in the proctored hiring gauntlet." },
        { status: 401 }
      );
    }
    const message = (error as Error).message || "Gauntlet evaluation failed.";
    return NextResponse.json({ message }, { status: 400 });
  }
}

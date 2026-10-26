import { notFound } from "next/navigation";
import { AppFrame } from "@/components/layout/app-frame";
import { ProblemWorkspacePreview } from "@/components/problems/problem-workspace-preview";
import { getProblemDetailData } from "@/lib/server/platform-data";

export default async function ProblemWorkspacePage({
  params,
}: {
  params: Promise<{ problemId: string }>;
}) {
  const { problemId } = await params;
  const problem = await getProblemDetailData(problemId);

  if (!problem) {
    notFound();
  }

  return (
    <AppFrame>
      <ProblemWorkspacePreview initialProblem={problem} problemId={problemId} />
    </AppFrame>
  );
}

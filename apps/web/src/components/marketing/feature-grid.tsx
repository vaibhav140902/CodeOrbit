import { SectionReveal, SurfaceCard } from "@codeorbit/ui";

const featureCards = [
  {
    title: "AI Problem Assist",
    description: "Get smart hints, ELI5 walkthroughs, and premium solver support inside the workspace.",
    tag: "Assist",
  },
  {
    title: "Mock Interviews",
    description: "Run webcam plus voice interview drills with company-specific feedback and score breakdowns.",
    tag: "Interview",
  },
  {
    title: "Resume Builder",
    description: "Generate ATS-friendly resume drafts and export PDFs tuned for Delhi and India-focused roles.",
    tag: "Resume",
  },
];

export function FeatureGrid() {
  return (
    <SectionReveal className="grid gap-3 sm:gap-4 md:grid-cols-3">
      {featureCards.map((feature) => (
        <SurfaceCard key={feature.title} className="p-5 sm:p-6" animated={true}>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[color:var(--accent)]">{feature.tag}</p>
          <h2 className="mt-3 text-lg font-semibold sm:text-xl">{feature.title}</h2>
          <p className="text-muted mt-2 text-sm leading-6">{feature.description}</p>
        </SurfaceCard>
      ))}
    </SectionReveal>
  );
}

import Link from "next/link";
import { Button, SectionReveal, SurfaceCard } from "@codeorbit/ui";

interface MigrationPlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function MigrationPlaceholder({
  eyebrow,
  title,
  description,
}: MigrationPlaceholderProps) {
  return (
    <div className="app-shell">
      <div className="page-container">
        <SectionReveal>
          <SurfaceCard className="p-5 sm:p-7 md:p-10" animated={true}>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">{eyebrow}</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold sm:text-4xl md:text-5xl">{title}</h1>
            <p className="text-muted mt-4 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8">
              {description}
            </p>
            <div className="mt-6 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
              <Button asChild variant="primary">
                <Link href="/problems">Open problems</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </SurfaceCard>
        </SectionReveal>
      </div>
    </div>
  );
}

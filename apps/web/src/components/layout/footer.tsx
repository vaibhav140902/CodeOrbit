import Link from "next/link";

const footerLinks = [
  { href: "/tracks", label: "Tracks" },
  { href: "/readiness-score", label: "Readiness" },
  { href: "/resume", label: "Resume OS" },
  { href: "/for-recruiters", label: "Recruiters" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function Footer() {
  return (
    <footer className="border-t border-[color:var(--border)]">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-4 px-4 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <p className="font-semibold text-[color:var(--text-main)]">CodeOrbit</p>
          <p className="mt-1 max-w-xl">
            India-first verified developer hiring OS for readiness, proof, interviews, and better applications.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-[color:var(--text-main)]">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

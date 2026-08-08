import type { ReactNode } from "react";
import { Reveal } from "@/components/Reveal";

/**
 * Shared shell for long-form policy pages (returns, terms). Keeps the
 * measure narrow for readability and gives every section a numbered rule.
 */
export function LegalPage({
  eyebrow,
  title,
  intro,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-14 pb-24 sm:px-8">
      <Reveal>
        <header className="pb-12">
          <p className="eyebrow text-primary">{eyebrow}</p>
          <h1 className="display-xl mt-4 text-4xl sm:text-6xl">{title}</h1>
          <p className="mt-6 max-w-prose text-sm leading-relaxed text-muted-foreground">{intro}</p>
          <p className="eyebrow mt-6 text-[10px] text-muted-foreground">{updated}</p>
        </header>
      </Reveal>
      <div className="space-y-12">{children}</div>
    </div>
  );
}

export function LegalSection({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Reveal>
      <section className="rule-line pt-8">
        <div className="flex items-baseline gap-4">
          <span className="display-xl shrink-0 text-2xl text-primary/40 tabular-nums">{n}</span>
          <h2 className="display-xl text-xl sm:text-2xl">{title}</h2>
        </div>
        <div className="legal-prose mt-5 space-y-4 pl-0 text-sm leading-relaxed text-muted-foreground sm:pl-12">
          {children}
        </div>
      </section>
    </Reveal>
  );
}

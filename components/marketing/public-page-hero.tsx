import type { ReactNode } from "react";

type PublicPageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function PublicPageHero({ eyebrow, title, description, children }: PublicPageHeroProps) {
  return (
    <section className="px-4 pb-10 pt-6 md:px-8 md:pb-12 md:pt-10">
      <div className="page-shell">
        <div className="glass-panel premium-shadow rounded-[2rem] border-border/80 p-6 md:p-10">
          <div className="max-w-3xl">
            <p className="section-eyebrow">{eyebrow}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              {description}
            </p>
            {children && <div className="mt-6 flex flex-wrap gap-3">{children}</div>}
          </div>
        </div>
      </div>
    </section>
  );
}

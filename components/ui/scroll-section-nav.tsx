"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type SectionEntry = { id: string; label: string };

export function ScrollSectionNav({ sections }: { sections: SectionEntry[] }) {
  const [active, setActive] = React.useState(sections[0]?.id ?? "");
  const [mounted, setMounted] = React.useState(false);

  // Portal needs document — only mount client-side; canonical mount-detection pattern
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { setMounted(true); }, []);

  React.useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { rootMargin: "-35% 0px -35% 0px", threshold: 0 },
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const nav = (
    <nav
      aria-label="Page sections"
      // Portal into body so no ancestor transform / overflow:hidden can break fixed positioning
      style={{ position: "fixed", right: 24, top: "50%", transform: "translateY(-50%)", zIndex: 9990 }}
      className="hidden flex-col gap-3 md:flex"
    >
      {sections.map(({ id, label }) => {
        const isActive = active === id;
        return (
          <div key={id} className="group flex items-center justify-end gap-2.5">

            {/* Label — slides in to the left of the dot on hover */}
            <span
              className={cn(
                "pointer-events-none whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all duration-200",
                isActive
                  ? "translate-x-0 border-primary/30 bg-primary/10 text-primary opacity-100"
                  : "translate-x-2 border-border/50 bg-card/70 text-muted-foreground opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
              )}
            >
              {label}
            </span>

            {/* Dot — right anchor */}
            <button
              onClick={() => scrollTo(id)}
              aria-label={`Go to ${label}`}
              className={cn(
                "shrink-0 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isActive
                  ? "h-3 w-3 bg-primary shadow-[0_0_10px_rgba(99,102,241,0.55)]"
                  : "h-2 w-2 border border-border/70 bg-muted/60 hover:border-primary/60 hover:bg-primary/25",
              )}
            />
          </div>
        );
      })}
    </nav>
  );

  if (!mounted) return null;
  return createPortal(nav, document.body);
}

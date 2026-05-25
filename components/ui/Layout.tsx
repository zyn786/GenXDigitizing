// @ts-nocheck
/**
 * Layout Primitives — reusable page shells, headers, grids.
 *
 * Every portal page should use these instead of ad-hoc divs.
 * Consistent spacing, consistent structure, identifiable from a screenshot.
 */

import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════
//  PageShell — scrollable container, centered, padded
// ═══════════════════════════════════════════════════════════════

export function PageShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-4 sm:py-5",
      "max-w-[900px] mx-auto w-full",
      className
    )}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Section — consistent vertical rhythm
// ═══════════════════════════════════════════════════════════════

export function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-5", className)}>{children}</div>;
}

// ═══════════════════════════════════════════════════════════════
//  PageHeader — profile strip + gradient title + subtitle
// ═══════════════════════════════════════════════════════════════

interface PageHeaderProps {
  /** User display name */
  name: string;
  /** Avatar URL (optional) */
  avatar?: string;
  /** Small badge text, e.g. "Designer", "Settings" */
  badge?: string;
  /** Badge color, defaults to purple */
  badgeColor?: string;
  /** Gradient for avatar circle, defaults to purple→pink */
  avatarGradient?: string;
  /** Optional right-side element (e.g. rating star, count) */
  right?: React.ReactNode;
  /** Page title, rendered as gradient text */
  title: string;
  /** Title gradient, defaults to purple→pink */
  titleGradient?: string;
  /** Subtitle below title */
  subtitle?: string;
}

export function PageHeader({
  name, avatar, badge, badgeColor, avatarGradient, right, title, titleGradient, subtitle,
}: PageHeaderProps) {
  const badgeBg = badgeColor ?? "#7C3AED";
  const grad = avatarGradient ?? "linear-gradient(135deg, #7C3AED, #D946EF)";
  const titleGrad = titleGradient ?? "linear-gradient(135deg, #7C3AED, #D946EF)";

  return (
    <>
      {/* Profile strip */}
      <Section>
        <div className="px-4 py-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
              style={{ background: grad }}>
              {avatar
                ? <img src={avatar} alt={name} className="w-full h-full rounded-full object-cover" />
                : (name?.charAt(0)?.toUpperCase() || "U")}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-jakarta font-bold text-md" style={{ color: "var(--txt)" }}>{name}</span>
              {badge && (
                <span className="text-2xs ml-2 px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: `${badgeBg}1a`, color: badgeBg, border: `1px solid ${badgeBg}40` }}>
                  {badge}
                </span>
              )}
            </div>
            {right}
          </div>
        </div>
      </Section>

      {/* Title */}
      <h2 className="font-jakarta font-bold text-xl sm:text-2xl leading-tight mb-1"
        style={{
          background: titleGrad,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm mb-5 font-medium" style={{ color: "var(--txt3)" }}>
          {subtitle}
        </p>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
//  StatGrid — 2-col mobile, 4-col desktop stat cards
// ═══════════════════════════════════════════════════════════════

interface StatItem {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: { bgSoft: string; border: string; icon: string; text: string };
}

export function StatGrid({ items }: { items: StatItem[] }) {
  return (
    <Section>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {items.map(s => (
          <div key={s.label} className="rounded-2xl p-3 sm:p-3.5 transition-all hover:translate-y-[-2px]"
            style={{
              background: s.color.bgSoft,
              border: `1px solid ${s.color.border}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: s.color.bgSoft, color: s.color.icon }}>
                {s.icon}
              </div>
              <span className="text-2xs uppercase tracking-wider font-semibold" style={{ color: "var(--txt3)" }}>
                {s.label}
              </span>
            </div>
            <div className="font-jakarta font-bold text-lg sm:text-xl" style={{ color: s.color.text }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════
//  FilterTabs — horizontal scrollable tab row
// ═══════════════════════════════════════════════════════════════

interface TabItem {
  key: string;
  label: string;
  icon?: string;
  count?: number;
  color: { bg: string; bgSoft: string; border: string; text: string; glow: string };
}

export function FilterTabs({ tabs, active, onChange }: {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <Section>
      <div className="flex gap-2 overflow-x-auto scrollbar-none flex-nowrap pb-1 -mx-0.5 px-0.5"
        style={{ WebkitOverflowScrolling: "touch" }}>
        {tabs.map(tab => {
          const isActive = active === tab.key;
          return (
            <button key={tab.key} onClick={() => onChange(isActive ? tabs[0].key : tab.key)}
              className="flex-shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 tab-switch"
              style={{
                background: isActive ? tab.color.bg : tab.color.bgSoft,
                color: isActive ? "#fff" : tab.color.text,
                borderColor: isActive ? tab.color.bg : tab.color.border,
                boxShadow: isActive ? `0 2px 12px ${tab.color.glow}` : "none",
              }}>
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span className="text-2xs opacity-75">({tab.count})</span>
              )}
            </button>
          );
        })}
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CardList — stacked expandable cards with left border
// ═══════════════════════════════════════════════════════════════

interface ListCardProps {
  id: string;
  expanded: boolean;
  onToggle: (id: string) => void;
  accentColor: string;
  header: React.ReactNode;
  children?: React.ReactNode;
}

function ListCard({ id, expanded, onToggle, accentColor, header, children }: ListCardProps) {
  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: "var(--surface)",
        border: `1px solid var(--border)`,
        borderLeft: `3px solid ${accentColor}`,
        boxShadow: expanded ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
      }}>
      <div className="px-4 sm:px-5 py-3.5 sm:py-4 cursor-pointer select-none"
        style={{ WebkitTapHighlightColor: "transparent" }}
        onClick={() => onToggle(id)}>
        {header}
      </div>
      {expanded && children && (
        <div className="px-4 sm:px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function CardList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2.5 mb-5", className)}>
      {children}
    </div>
  );
}

CardList.Item = ListCard;

// ═══════════════════════════════════════════════════════════════
//  EmptyState — consistent empty state
// ═══════════════════════════════════════════════════════════════

export function EmptyState({ icon, title, description, action }: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Section>
      <div className="text-center py-14 rounded-2xl border bg-[var(--surface)] border-[var(--border)]">
        {icon && <p className="text-4xl mb-3">{icon}</p>}
        <p className="font-jakarta font-bold text-lg" style={{ color: "var(--txt)" }}>{title}</p>
        {description && <p className="text-sm mt-1.5" style={{ color: "var(--txt2)" }}>{description}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </Section>
  );
}

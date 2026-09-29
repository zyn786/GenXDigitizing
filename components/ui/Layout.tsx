// @ts-nocheck
/**
 * Layout Primitives — reusable page shells, headers, grids.
 *
 * Every portal page should use these instead of ad-hoc divs.
 * Consistent spacing, consistent structure, identifiable from a screenshot.
 */

import { cn } from "@/lib/utils";
import Image from "next/image";

// ═══════════════════════════════════════════════════════════════
//  PageShell — scrollable container, centered, padded
// ═══════════════════════════════════════════════════════════════

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5 md:px-6",
        "mx-auto w-full max-w-[900px]",
        className
      )}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Section — consistent vertical rhythm
// ═══════════════════════════════════════════════════════════════

export function Section({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
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
  name,
  avatar,
  badge,
  badgeColor,
  avatarGradient,
  right,
  title,
  titleGradient,
  subtitle,
}: PageHeaderProps) {
  const badgeBg = badgeColor ?? "#7C3AED";
  const grad = avatarGradient ?? "linear-gradient(135deg, #7C3AED, #D946EF)";
  const titleGrad = titleGradient ?? "linear-gradient(135deg, #7C3AED, #D946EF)";

  return (
    <>
      {/* Profile strip */}
      <Section>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white"
              style={{ background: grad }}
            >
              {avatar ? (
                <Image
                  fill
                  src={avatar}
                  alt={name}
                  className="rounded-full object-cover"
                  sizes="36px"
                />
              ) : (
                name?.charAt(0)?.toUpperCase() || "U"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-syne text-md font-bold" style={{ color: "var(--txt)" }}>
                {name}
              </span>
              {badge && (
                <span
                  className="ml-2 rounded-full px-2 py-0.5 text-2xs font-semibold"
                  style={{
                    background: `${badgeBg}1a`,
                    color: badgeBg,
                    border: `1px solid ${badgeBg}40`,
                  }}
                >
                  {badge}
                </span>
              )}
            </div>
            {right}
          </div>
        </div>
      </Section>

      {/* Title */}
      <h2
        className="mb-1 font-syne text-xl font-bold leading-tight sm:text-2xl"
        style={{
          background: titleGrad,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mb-5 text-sm font-medium" style={{ color: "var(--txt3)" }}>
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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {items.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-3 transition-all hover:translate-y-[-2px] sm:p-3.5"
            style={{
              background: s.color.bgSoft,
              border: `1px solid ${s.color.border}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: s.color.bgSoft, color: s.color.icon }}
              >
                {s.icon}
              </div>
              <span
                className="text-2xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--txt3)" }}
              >
                {s.label}
              </span>
            </div>
            <div className="font-syne text-lg font-bold sm:text-xl" style={{ color: s.color.text }}>
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

export function FilterTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <Section>
      <div
        className="scrollbar-none -mx-0.5 flex flex-nowrap gap-2 overflow-x-auto px-0.5 pb-1"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(isActive ? tabs[0].key : tab.key)}
              className="tab-switch inline-flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all active:scale-95 sm:py-2"
              style={{
                background: isActive ? tab.color.bg : tab.color.bgSoft,
                color: isActive ? "#fff" : tab.color.text,
                borderColor: isActive ? tab.color.bg : tab.color.border,
                boxShadow: isActive ? `0 2px 12px ${tab.color.glow}` : "none",
              }}
            >
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
    <div
      className="overflow-hidden rounded-2xl transition-all"
      style={{
        background: "var(--surface)",
        border: `1px solid var(--border)`,
        borderLeft: `3px solid ${accentColor}`,
        boxShadow: expanded ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
      }}
    >
      <div
        className="cursor-pointer select-none px-4 py-3.5 sm:px-5 sm:py-4"
        style={{ WebkitTapHighlightColor: "transparent" }}
        onClick={() => onToggle(id)}
      >
        {header}
      </div>
      {expanded && children && (
        <div className="px-4 py-4 sm:px-5" style={{ borderTop: "1px solid var(--border)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function CardList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mb-5 flex flex-col gap-2.5", className)}>{children}</div>;
}

CardList.Item = ListCard;

// ═══════════════════════════════════════════════════════════════
//  EmptyState — consistent empty state
// ═══════════════════════════════════════════════════════════════

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Section>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-14 text-center">
        {icon && <p className="mb-3 text-4xl">{icon}</p>}
        <p className="font-syne text-lg font-bold" style={{ color: "var(--txt)" }}>
          {title}
        </p>
        {description && (
          <p className="mt-1.5 text-sm" style={{ color: "var(--txt2)" }}>
            {description}
          </p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </Section>
  );
}

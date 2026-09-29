import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  elevated?: boolean;
  compact?: boolean;
}

export function Card({ children, className, style, onClick, elevated, compact }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border",
        elevated ? "bg-[var(--elevated)]" : "bg-[var(--surface)]",
        "border-[var(--border)]",
        compact ? "p-4" : "p-5",
        onClick &&
          "cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border3)] hover:shadow-card-hover",
        className
      )}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function InfoCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-xl border border-[var(--border)] bg-[var(--elevated)] p-4", className)}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  deltaUp,
  sub,
  accentColor,
  icon,
}: {
  label: string;
  value: string | number;
  delta?: string;
  deltaUp?: boolean;
  sub?: string;
  accentColor?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="lift rounded-2xl border border-[var(--border)] bg-[var(--elevated)] p-4">
      <div className="mb-2 flex items-center gap-2">
        {icon && (
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${accentColor}15`, color: accentColor }}
          >
            {icon}
          </div>
        )}
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--txt3)]">
          {label}
        </p>
      </div>
      <p
        className="font-syne text-[20px] font-bold"
        style={accentColor ? { color: accentColor } : { color: "var(--txt)" }}
      >
        {value}
      </p>
      {(delta || sub) && (
        <div className="mt-1 flex items-center gap-1.5">
          {delta && (
            <span
              className={cn(
                "text-[11px] font-semibold",
                deltaUp === true
                  ? "text-[#10B981]"
                  : deltaUp === false
                    ? "text-[#DC2626]"
                    : "text-[#10B981]"
              )}
            >
              {delta}
            </span>
          )}
          {sub && <span className="text-[11px] text-[var(--txt3)]">{sub}</span>}
        </div>
      )}
    </div>
  );
}

export function CardHeader({
  title,
  action,
  subtitle,
}: {
  title: string;
  action?: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h3 className="font-syne text-[13px] font-bold text-[var(--txt)]">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[10px] text-[var(--txt3)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

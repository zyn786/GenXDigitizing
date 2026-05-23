interface GradientOrbProps {
  color?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function GradientOrb({
  color = "#3B82F6",
  size = 500,
  className = "",
  style,
}: GradientOrbProps) {
  return (
    <div className={`absolute pointer-events-none ${className}`} style={style} aria-hidden="true">
      <div
        className="rounded-full animate-float"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle, ${color}15, ${color}05 40%, transparent 70%)`,
        }}
      />
    </div>
  );
}

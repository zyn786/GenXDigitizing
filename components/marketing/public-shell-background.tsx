export function PublicShellBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Base gradient — dark mode */}
      <div className="absolute inset-0 hidden bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.14),transparent_34%),radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.12),transparent_28%),linear-gradient(180deg,#06101e_0%,#0a1320_40%,#0e1626_100%)] dark:block" />

      {/* Base gradient — light mode */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.05),transparent_32%),radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.04),transparent_26%),linear-gradient(180deg,#f5f5f4_0%,#fafaf9_40%,#f5f5f4_100%)] dark:hidden" />

      {/* Subtle top glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--primary)/0.06),transparent_60%)]" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,hsl(var(--background)/0.6)_100%)]" />
    </div>
  );
}
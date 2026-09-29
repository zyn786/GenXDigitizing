import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-4">
      {/* Rainbow top bar */}
      <div
        className="fixed inset-x-0 top-0 z-50 h-[2px]"
        style={{
          background: "linear-gradient(90deg,#2563EB,#F97316,#16A34A)",
        }}
      />

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle,#2563EB,transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle,#F97316,transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  );
}

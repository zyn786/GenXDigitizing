import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)]">
      {/* Rainbow top bar */}
      <div
        className="fixed top-0 inset-x-0 h-[2px] z-50"
        style={{
          background: "linear-gradient(90deg,#2563EB,#F97316,#16A34A)",
        }}
      />

      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle,#2563EB,transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle,#F97316,transparent 70%)" }}
        />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {children}
      </div>
    </div>
  );
}

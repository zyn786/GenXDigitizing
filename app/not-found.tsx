import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <div
        className="fixed inset-x-0 top-0 h-[2px]"
        style={{ background: "linear-gradient(90deg,#2563EB,#F97316,#16A34A)" }}
      />
      <div className="max-w-sm px-4 text-center">
        <div className="mb-4 bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text font-syne text-[80px] font-bold leading-none text-transparent">
          404
        </div>
        <h1 className="mb-2 font-syne text-xl font-bold text-[var(--txt)]">Page not found</h1>
        <p className="mb-6 text-sm leading-relaxed text-[var(--txt2)]">
          The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#F97316] px-5 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

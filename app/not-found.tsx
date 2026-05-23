import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div
        className="fixed top-0 inset-x-0 h-[2px]"
        style={{ background: "linear-gradient(90deg,#2563EB,#F97316,#16A34A)" }}
      />
      <div className="text-center max-w-sm px-4">
        <div
          className="text-[80px] font-syne font-extrabold leading-none mb-4
            bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent"
        >
          404
        </div>
        <h1 className="font-syne font-bold text-xl text-[var(--txt)] mb-2">
          Page not found
        </h1>
        <p className="text-sm text-[var(--txt2)] mb-6 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                     text-white text-[13px] font-medium transition-opacity hover:opacity-90
                     bg-gradient-to-r from-[#2563EB] to-[#F97316]"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

import { Mail, Phone } from "lucide-react";
import { SITE_INFO } from "@/lib/site-config";

export function TopBar() {
  const showPhone = SITE_INFO.phone !== null;

  return (
    <div className="fixed top-0 inset-x-0 z-[110] h-9
      bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316]
      shadow-[0_1px_8px_rgba(37,99,235,0.2)]">
      <div className="h-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 flex items-center justify-between">
        <a
          href={`mailto:${SITE_INFO.email}`}
          className="flex items-center gap-1.5 text-[11px] text-white/90 font-medium
            hover:text-white transition-colors no-underline flex-shrink-0"
        >
          <Mail size={11} />
          <span>{SITE_INFO.email}</span>
        </a>

        <span className="hidden sm:block text-[11px] md:text-xs text-white font-semibold
          whitespace-nowrap tracking-wide px-3">
          🎉 Free first file — No credit card needed
        </span>

        {showPhone ? (
          <a
            href={`tel:${SITE_INFO.phone}`}
            className="flex items-center gap-1.5 text-[11px] text-white/90 font-medium
              hover:text-white transition-colors no-underline flex-shrink-0"
          >
            <Phone size={11} />
            <span>{SITE_INFO.phone}</span>
          </a>
        ) : (
          <span className="flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

import { Mail, Phone } from "lucide-react";

export function TopBar() {
  return (
    <div className="fixed top-0 inset-x-0 z-[110] h-9
      bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316]
      shadow-[0_1px_8px_rgba(37,99,235,0.2)]">
      <div className="h-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 flex items-center justify-between">
        <a
          href="mailto:support@genxdigitizing.com"
          className="flex items-center gap-1.5 text-[11px] text-white/90 font-medium
            hover:text-white transition-colors no-underline flex-shrink-0"
        >
          <Mail size={11} />
          <span>support@genxdigitizing.com</span>
        </a>

        <span className="hidden sm:block text-[11px] md:text-xs text-white font-semibold
          whitespace-nowrap tracking-wide px-3">
          🎉 Free first file — No credit card needed
        </span>

        <a
          href="tel:+1234567890"
          className="flex items-center gap-1.5 text-[11px] text-white/90 font-medium
            hover:text-white transition-colors no-underline flex-shrink-0"
        >
          <Phone size={11} />
          <span>+1 (234) 567-890</span>
        </a>
      </div>
    </div>
  );
}

import { Mail, Phone } from "lucide-react";
import { SITE_INFO } from "@/lib/site-config";

export function TopBar() {
  const showPhone = SITE_INFO.phone !== null;

  return (
    <div className="fixed inset-x-0 top-0 z-[110] h-9 bg-gradient-to-r from-[#2563EB] via-[#1D4ED8] to-[#0F3460] shadow-[0_1px_8px_rgba(37,99,235,0.2)]">
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-4 sm:px-6 md:px-10 lg:px-12">
        <a
          href={`mailto:${SITE_INFO.email}`}
          className="flex flex-shrink-0 items-center gap-1.5 text-[11px] font-medium text-white/90 no-underline transition-colors hover:text-white"
        >
          <Mail size={11} />
          <span>{SITE_INFO.email}</span>
        </a>

        <span className="hidden whitespace-nowrap px-3 text-[11px] font-semibold tracking-wide text-white sm:block md:text-xs">
          🎉 Free first file — No credit card needed
        </span>

        {showPhone ? (
          <a
            href={`tel:${SITE_INFO.phone}`}
            className="flex flex-shrink-0 items-center gap-1.5 text-[11px] font-medium text-white/90 no-underline transition-colors hover:text-white"
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

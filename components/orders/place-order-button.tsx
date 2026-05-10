"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { OrderWizard } from "@/components/orders/order-wizard";
import { filterApprovedCatalog } from "@/lib/pricing/filter";
import type { PricingCatalog } from "@/lib/pricing/catalog";

interface PlaceOrderButtonProps {
  user?: { name?: string | null; email?: string | null } | null;
  isFirstOrder?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function PlaceOrderButton({ user, isFirstOrder, className, children }: PlaceOrderButtonProps) {
  const [open,    setOpen]    = useState(false);
  const [catalog, setCatalog] = useState<PricingCatalog | undefined>();
  const [error,   setError]   = useState<string | null>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open || catalog) return;
    fetch("/api/pricing")
      .then((r) => r.json() as Promise<{ ok: boolean; catalog: PricingCatalog }>)
      .then((d) => {
        if (d.ok) setCatalog(filterApprovedCatalog(d.catalog));
        else setError("Failed to load pricing data. Please try again.");
      })
      .catch(() => setError("Unable to load pricing. Check your connection and try again."));
  }, [open, catalog]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />

          {/* Modal panel */}
          <div
            className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
            role="dialog"
            aria-modal
            aria-label="Place a New Order"
          >
            <div className="relative flex w-full max-w-[760px] flex-col overflow-hidden rounded-t-[1.75rem] border border-white/[0.06] bg-[#0e0f1c]/95 shadow-2xl shadow-black/50 backdrop-blur-xl sm:rounded-[1.75rem]" style={{ maxHeight: "92dvh" }}>

              {/* Pull handle (mobile) */}
              <div className="absolute left-1/2 top-3 h-1 w-10 -translate-x-1/2 rounded-full bg-white/10 sm:hidden" />

              {/* Close button */}
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/50 transition hover:bg-white/[0.12] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Scrollable wizard */}
              <div className="overflow-y-auto p-6 md:p-8 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.08)_transparent]">
                {error ? (
                  <div className="flex flex-col items-center gap-4 py-12 text-center">
                    <p className="text-sm text-red-400">{error}</p>
                    <button
                      type="button"
                      onClick={() => { setError(null); setCatalog(undefined); }}
                      className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/80 transition hover:bg-white/[0.12]"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <OrderWizard
                    user={user}
                    isFirstOrder={isFirstOrder}
                    catalog={catalog}
                    onComplete={close}
                  />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

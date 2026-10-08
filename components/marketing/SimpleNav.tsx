"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  ["Services", "/home#services"],
  ["How It Works", "/home#how-it-works"],
  ["Pricing", "/home#pricing"],
  ["Portfolio", "/portfolio"],
];

export function SimpleNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="shrink-0 no-underline">
          <Image src="/images/black_logo.png" alt="GenX Digitizing" width={180} height={90} priority className="h-7 w-auto" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--txt2)] no-underline hover:bg-[var(--surface)] hover:text-[var(--txt)]">
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--txt2)] no-underline hover:text-[var(--txt)]">
            Sign in
          </Link>
          <Link href="/upload" className="rounded-xl bg-[var(--txt)] px-4 py-2.5 text-sm font-bold text-[var(--bg)] no-underline">
            Upload Design
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          className="rounded-lg p-2 md:hidden"
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-[var(--border)] bg-[var(--bg)] px-5 pb-5 pt-3 md:hidden">
          <div className="grid gap-1">
            {links.map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold text-[var(--txt)] no-underline hover:bg-[var(--surface)]">
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href="/login" onClick={() => setOpen(false)} className="rounded-xl border border-[var(--border2)] px-4 py-3 text-center text-sm font-semibold no-underline">
              Sign in
            </Link>
            <Link href="/upload" onClick={() => setOpen(false)} className="rounded-xl bg-[var(--txt)] px-4 py-3 text-center text-sm font-bold text-[var(--bg)] no-underline">
              Upload Design
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

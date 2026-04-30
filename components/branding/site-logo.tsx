import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

import { siteConfig } from "@/lib/site";

type SiteLogoProps = {
  href?: Route;
  size?: "sm" | "md";
};

export function SiteLogo({
  href = "/",
  size = "md",
}: SiteLogoProps) {
  const compact = size === "sm";

  const width = compact ? 160 : 220;
  const height = compact ? 52 : 72;
  const sizes = compact ? "160px" : "220px";
  const imageClass = compact
    ? "h-8 w-auto object-contain"
    : "h-12 w-auto object-contain md:h-14";

  return (
    <Link href={href} className="inline-flex items-center">
      <>
        <Image
          src="/brand/genx-logo-black.png"
          alt={siteConfig.name}
          width={width}
          height={height}
          sizes={sizes}
          className={`${imageClass} dark:hidden`}
          priority
        />
        <Image
          src="/brand/genx-logo-white.png"
          alt={siteConfig.name}
          width={width}
          height={height}
          sizes={sizes}
          className={`${imageClass} hidden dark:block`}
          priority
        />
      </>
    </Link>
  );
}
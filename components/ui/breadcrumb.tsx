import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Breadcrumb root                                                     */
/* ------------------------------------------------------------------ */

export function Breadcrumb({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav aria-label="Breadcrumb" className={cn(className)} {...props} />
  );
}

/* ------------------------------------------------------------------ */
/* BreadcrumbList                                                      */
/* ------------------------------------------------------------------ */

export function BreadcrumbList({
  className,
  ...props
}: React.HTMLAttributes<HTMLOListElement>) {
  return (
    <ol
      className={cn(
        "flex flex-wrap items-center gap-1 text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* BreadcrumbItem                                                      */
/* ------------------------------------------------------------------ */

export function BreadcrumbItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={cn("inline-flex items-center gap-1", className)} {...props} />;
}

/* ------------------------------------------------------------------ */
/* BreadcrumbLink                                                      */
/* ------------------------------------------------------------------ */

type BreadcrumbLinkProps = React.ComponentPropsWithoutRef<typeof Link> & {
  asChild?: boolean;
};

export function BreadcrumbLink({
  asChild,
  className,
  ...props
}: BreadcrumbLinkProps) {
  const Comp = asChild ? Slot : Link;

  return (
    <Comp
      className={cn(
        "transition-colors hover:text-foreground",
        className
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* BreadcrumbPage (current page, not a link)                           */
/* ------------------------------------------------------------------ */

export function BreadcrumbPage({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      role="link"
      aria-current="page"
      className={cn("font-medium text-foreground", className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* BreadcrumbSeparator                                                 */
/* ------------------------------------------------------------------ */

export function BreadcrumbSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLLIElement>) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:h-3.5 [&>svg]:w-3.5", className)}
      {...props}
    >
      <ChevronRight />
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* BreadcrumbHome (convenience)                                        */
/* ------------------------------------------------------------------ */

export function BreadcrumbHome({ href = "/" }: { href?: string }) {
  return (
    <BreadcrumbItem>
      <BreadcrumbLink href={href} className="flex items-center gap-1">
        <Home className="h-3.5 w-3.5" />
        <span className="sr-only">Home</span>
      </BreadcrumbLink>
    </BreadcrumbItem>
  );
}

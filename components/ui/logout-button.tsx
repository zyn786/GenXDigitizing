"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LogoutButton({ className, iconOnly }: { className?: string; iconOnly?: boolean }) {
  return (
    <Button
      variant="ghost"
      className={cn("gap-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive", className)}
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <LogOut className="h-4 w-4" />
      {!iconOnly && <span>Sign out</span>}
    </Button>
  );
}

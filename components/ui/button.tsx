import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:opacity-95",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline:
          "border border-border/80 bg-card/70 hover:bg-card hover:shadow-md",
        ghost:
          "hover:bg-secondary/80",
        premium:
          "bg-primary text-primary-foreground shadow-sm hover:opacity-95",
        destructive:
          "bg-destructive text-destructive-foreground hover:opacity-90",
      },
      shape: {
        default: "rounded-2xl",
        pill: "rounded-full",
      },
      size: {
        default: "h-12 px-5 py-2.5",
        lg: "h-12 px-6 text-sm",
        sm: "h-9 px-3 text-xs",
        icon: "h-12 w-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      shape: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      shape,
      size,
      asChild = false,
      type = "button",
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, shape, size }), className)}
          ref={ref}
          {...props}
        />
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, shape, size }), className)}
        ref={ref}
        type={type}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { buttonVariants };

import * as React from "react";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* FormField — wraps a label + control + message group                */
/* ------------------------------------------------------------------ */

type FormFieldProps = React.HTMLAttributes<HTMLDivElement> & {
  name?: string;
};

export function FormField({
  name,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div
      data-field={name}
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* FormLabel                                                           */
/* ------------------------------------------------------------------ */

type FormLabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

export function FormLabel({
  required,
  className,
  children,
  ...props
}: FormLabelProps) {
  return (
    <label
      className={cn(
        "text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-0.5 text-destructive" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* FormDescription                                                     */
/* ------------------------------------------------------------------ */

export function FormDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* FormMessage (error / hint text)                                     */
/* ------------------------------------------------------------------ */

type FormMessageProps = React.HTMLAttributes<HTMLParagraphElement> & {
  error?: boolean;
};

export function FormMessage({
  error,
  className,
  children,
  ...props
}: FormMessageProps) {
  if (!children) return null;

  return (
    <p
      className={cn(
        "text-xs",
        error ? "text-destructive" : "text-muted-foreground",
        className
      )}
      role={error ? "alert" : undefined}
      {...props}
    >
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* FormControl — wraps an input/select with proper aria wiring         */
/* ------------------------------------------------------------------ */

type FormControlProps = {
  children: React.ReactElement<{
    id?: string;
    "aria-invalid"?: boolean | "true" | "false";
    "aria-describedby"?: string;
  }>;
  errorId?: string;
  descriptionId?: string;
  isInvalid?: boolean;
};

export function FormControl({
  children,
  errorId,
  descriptionId,
  isInvalid,
}: FormControlProps) {
  const describedBy = [errorId, descriptionId].filter(Boolean).join(" ") || undefined;

  return React.cloneElement(children, {
    "aria-invalid": isInvalid ? ("true" as const) : undefined,
    "aria-describedby": describedBy || undefined,
  });
}

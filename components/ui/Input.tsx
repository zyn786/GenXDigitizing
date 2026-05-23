"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ── Input ─────────────────────────────────────────────────────

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:       string;
  error?:       string;
  hint?:        string;
  leftIcon?:    React.ReactNode;
  rightIcon?:   React.ReactNode;
  onRightIconClick?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, onRightIconClick, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-medium uppercase tracking-[0.5px] mb-1.5 text-[var(--txt3)]"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--txt3)] pointer-events-none">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-[9px] px-3.5 py-2.5 text-sm outline-none transition-colors",
              "bg-[var(--elevated)] border border-[var(--border2)] text-[var(--txt)]",
              "placeholder:text-[var(--txt3)]",
              "focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7]/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error && "border-[#F43F5E]/60 focus:border-[#F43F5E] focus:ring-[#F43F5E]/20",
              leftIcon  && "pl-9",
              rightIcon && "pr-10",
              className
            )}
            {...props}
          />

          {rightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--txt3)] hover:text-[var(--txt2)] transition-colors"
            >
              {rightIcon}
            </button>
          )}
        </div>

        {error && (
          <p className="mt-1 text-[11px] text-[#FB7185]">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1 text-[11px] text-[var(--txt3)]">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// ── Textarea ──────────────────────────────────────────────────

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?:  string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-[11px] font-medium uppercase tracking-[0.5px] mb-1.5 text-[var(--txt3)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full rounded-[9px] px-3.5 py-2.5 text-sm outline-none transition-colors resize-none",
            "bg-[var(--elevated)] border border-[var(--border2)] text-[var(--txt)]",
            "placeholder:text-[var(--txt3)]",
            "focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7]/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-[#F43F5E]/60 focus:border-[#F43F5E]",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-[11px] text-[#FB7185]">{error}</p>}
        {hint && !error && <p className="mt-1 text-[11px] text-[var(--txt3)]">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

// ── Select ────────────────────────────────────────────────────

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?:  string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, id, children, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[11px] font-medium uppercase tracking-[0.5px] mb-1.5 text-[var(--txt3)]"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full rounded-[9px] px-3.5 py-2.5 text-sm outline-none transition-colors cursor-pointer",
            "bg-[var(--elevated)] border border-[var(--border2)] text-[var(--txt)]",
            "focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7]/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-[#F43F5E]/60",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-[11px] text-[#FB7185]">{error}</p>}
        {hint && !error && <p className="mt-1 text-[11px] text-[var(--txt3)]">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Input, Textarea, Select };

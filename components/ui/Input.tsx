import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:    string;
  error?:    string;
  hint?:     string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, leftIcon, rightIcon, onRightIconClick, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const hasIcon = leftIcon || rightIcon;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--txt3)] mb-1.5">
            {label}
          </label>
        )}
        <div className={cn("relative", hasIcon && "flex items-center")}>
          {leftIcon && <span className="absolute left-3 text-[var(--txt3)]">{leftIcon}</span>}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full rounded-xl px-4 py-2.5 text-[13px] outline-none transition-all duration-200",
              "bg-[var(--bg)] border-[1.5px] border-[var(--border2)] text-[var(--txt)]",
              "placeholder:text-[var(--txt3)]",
              "focus:border-[#A855F7] focus:shadow-[0_0_0_3px_rgba(168,85,247,0.12)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error && "border-[#F43F5E] focus:border-[#F43F5E] focus:shadow-[0_0_0_3px_rgba(244,63,94,0.12)]",
              leftIcon && "pl-9",
              className
            )}
            {...props}
          />
          {rightIcon && (
            onRightIconClick ? (
              <button type="button" onClick={onRightIconClick} className="absolute right-3 text-[var(--txt3)] hover:text-[var(--txt)] bg-transparent border-none cursor-pointer p-0">
                {rightIcon}
              </button>
            ) : (
              <span className="absolute right-3 text-[var(--txt3)]">{rightIcon}</span>
            )
          )}
        </div>
        {error && <p className="text-[11px] mt-1 text-[#F43F5E]">{error}</p>}
        {hint && !error && <p className="text-[11px] mt-1 text-[var(--txt3)]">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--txt3)] mb-1.5">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            "w-full rounded-xl px-4 py-2.5 text-[13px] outline-none transition-all duration-200 resize-none",
            "bg-[var(--bg)] border-[1.5px] border-[var(--border2)] text-[var(--txt)]",
            "placeholder:text-[var(--txt3)]",
            "focus:border-[#A855F7] focus:shadow-[0_0_0_3px_rgba(168,85,247,0.12)]",
            error && "border-[#F43F5E] focus:border-[#F43F5E]",
            className
          )}
          {...props}
        />
        {error && <p className="text-[11px] mt-1 text-[#F43F5E]">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:   string;
  error?:   string;
  options?: { value: string; label: string }[];
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, children, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--txt3)] mb-1.5">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            "w-full rounded-xl px-4 py-2.5 text-[13px] outline-none transition-all duration-200 cursor-pointer",
            "bg-[var(--bg)] border-[1.5px] border-[var(--border2)] text-[var(--txt)]",
            "focus:border-[#A855F7] focus:shadow-[0_0_0_3px_rgba(168,85,247,0.12)]",
            error && "border-[#F43F5E]",
            className
          )}
          {...props}
        >
          {options
            ? options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)
            : children}
        </select>
        {error && <p className="text-[11px] mt-1 text-[#F43F5E]">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Input, Textarea, Select };

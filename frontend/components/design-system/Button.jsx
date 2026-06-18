"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

const variants = {
  primary:
    "bg-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] hover:bg-primary-dark",
  secondary:
    "border border-border bg-surface text-text-primary shadow-card hover:border-primary hover:bg-primary-light hover:text-primary",
  danger:
    "bg-danger text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-red-700",
  ghost:
    "bg-transparent text-text-secondary shadow-none hover:bg-primary-light hover:text-primary",
  link:
    "h-auto px-0 py-0 text-primary shadow-none underline-offset-4 hover:translate-y-0 hover:text-primary-dark hover:underline",
};

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    className,
    type = "button",
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-button font-semibold",
        "transition duration-150 ease-in-out hover:-translate-y-px active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-light",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100",
        variants[variant],
        sizes[size],
        loading && "pointer-events-none",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center gap-2",
          loading && "invisible",
        )}
      >
        {leftIcon ? (
          <span className="inline-flex h-4 w-4 items-center justify-center">
            {leftIcon}
          </span>
        ) : null}
        <span>{children}</span>
        {rightIcon ? (
          <span className="inline-flex h-4 w-4 items-center justify-center">
            {rightIcon}
          </span>
        ) : null}
      </span>

      {loading ? (
        <span className="absolute inset-0 inline-flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-[spin_700ms_linear_infinite]" />
        </span>
      ) : null}
    </button>
  );
});

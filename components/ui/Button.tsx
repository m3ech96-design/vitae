"use client";
import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "focus-ring inline-flex items-center justify-center gap-2 font-display font-medium tracking-wide transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none rounded-full",
          size === "sm" && "px-4 py-2 text-xs",
          size === "md" && "px-5 py-3 text-sm",
          size === "lg" && "px-7 py-4 text-base",
          variant === "primary" &&
            "bg-aura-gradient text-void-950 shadow-glow hover:brightness-110",
          variant === "ghost" &&
            "text-ink-200 hover:bg-white/5 border border-transparent",
          variant === "outline" &&
            "border border-white/15 text-ink-200 hover:border-aura-violet/60 hover:shadow-glow-sm bg-white/[0.02]",
          variant === "danger" &&
            "border border-aura-pink/40 text-aura-pink hover:bg-aura-pink/10",
          className
        )}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

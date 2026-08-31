"use client";
import { HTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  strong?: boolean;
  glow?: "violet" | "cyan" | "pink" | "none";
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, strong, glow = "none", children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "relative rounded-xl3 sheen-top overflow-hidden",
          strong ? "glass-strong" : "glass",
          glow === "violet" && "shadow-glow-sm",
          glow === "cyan" && "shadow-glow-cyan",
          glow === "pink" && "shadow-glow-pink",
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";

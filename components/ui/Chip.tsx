"use client";
import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

export function Chip({
  label,
  selected,
  onClick,
  tone = "violet",
  icon: Icon,
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  tone?: "violet" | "cyan" | "pink";
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "focus-ring flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-all duration-150 active:scale-95",
        selected
          ? tone === "violet"
            ? "border-aura-violet/70 bg-aura-violet/15 text-ink-100 shadow-glow-sm"
            : tone === "cyan"
            ? "border-aura-cyan/70 bg-aura-cyan/15 text-ink-100 shadow-glow-cyan"
            : "border-aura-pink/70 bg-aura-pink/15 text-ink-100 shadow-glow-pink"
          : "border-white/10 bg-white/[0.02] text-ink-600 hover:border-white/25 hover:text-ink-200"
      )}
    >
      {Icon && <Icon size={13} />}
      {label}
    </button>
  );
}

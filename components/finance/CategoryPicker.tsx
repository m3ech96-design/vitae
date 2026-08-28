"use client";
import { ExpenseCategory } from "@/lib/types";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_META } from "@/lib/finance-meta";

export function CategoryPicker({ value, onChange }: { value: ExpenseCategory; onChange: (c: ExpenseCategory) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {EXPENSE_CATEGORIES.map((c) => {
        const meta = EXPENSE_CATEGORY_META[c];
        const Icon = meta.icon;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className="focus-ring flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] transition-all"
            style={{
              borderColor: value === c ? meta.color : "rgba(255,255,255,0.1)",
              background: value === c ? `${meta.color}22` : "transparent",
              color: value === c ? "#F1F1FA" : "#8B90A8",
            }}
          >
            <Icon size={11} /> {meta.label}
          </button>
        );
      })}
    </div>
  );
}

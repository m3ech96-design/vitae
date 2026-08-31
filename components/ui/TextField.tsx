"use client";
import { InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  /** Appena salvato come Scoperta: il campo si schiarisce dal buio al leggibile, una volta
   * sola — l'inchiostro che si asciuga, non un avviso separato che dice "hai scoperto
   * qualcosa". Il chiamante lo tiene true solo per la durata dell'animazione. */
  justSaved?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ className, label, hint, id, justSaved, ...rest }, ref) => {
    return (
      <label className="block">
        {label && (
          <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">
            {label}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={clsx(
            "focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100 placeholder:text-ink-800 transition-colors duration-150",
            "focus:border-aura-violet/60 focus:bg-white/[0.05]",
            justSaved && "animate-inkReveal",
            className
          )}
          {...rest}
        />
        {hint && <span className="mt-1.5 block text-xs text-ink-800">{hint}</span>}
      </label>
    );
  }
);
TextField.displayName = "TextField";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  /** Vedi TextFieldProps.justSaved — stesso principio, stesso comportamento. */
  justSaved?: boolean;
}
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, justSaved, ...rest }, ref) => (
    <label className="block">
      {label && (
        <span className="mb-2 block font-display text-xs uppercase tracking-[0.14em] text-ink-600">
          {label}
        </span>
      )}
      <textarea
        ref={ref}
        className={clsx(
          "focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-100 placeholder:text-ink-800 transition-colors duration-150 min-h-[92px]",
          "focus:border-aura-violet/60 focus:bg-white/[0.05]",
          justSaved && "animate-inkReveal",
          className
        )}
        {...rest}
      />
    </label>
  )
);
TextArea.displayName = "TextArea";

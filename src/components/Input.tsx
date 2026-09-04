import React, { InputHTMLAttributes, forwardRef, ReactNode } from "react";
import clsx from "clsx";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leftIcon, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="field">
        {label && (
          <label htmlFor={inputId} className="font-semibold text-sm">
            {label}
          </label>
        )}
        <div className={clsx(leftIcon ? "search" : "relative")}>
          {leftIcon}
          <input
            ref={ref}
            id={inputId}
            className={clsx("input", error && "is-error", className)}
            aria-invalid={Boolean(error)}
            {...props}
          />
        </div>
        {error ? (
          <span className="hint error">{error}</span>
        ) : hint ? (
          <span className="hint">{hint}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

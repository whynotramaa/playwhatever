import React, { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

export type ButtonVariant = "primary" | "secondary" | "outline" | "yellow" | "tertiary";
export type ButtonSize = "sm" | "md" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isBlock?: boolean;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      isBlock = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variantClass = {
      primary: "btn-primary",
      secondary: "btn-secondary",
      outline: "btn-outline",
      yellow: "btn-yellow",
      tertiary: "btn-tertiary",
    }[variant];

    const sizeClass = {
      sm: "btn-small",
      md: "",
      icon: "btn-icon",
    }[size];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          "btn",
          variantClass,
          sizeClass,
          isBlock && "btn-block",
          isLoading && "is-loading",
          className
        )}
        {...props}
      >
        <span className="btn-label inline-flex items-center gap-2">{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";

import clsx from "clsx";

import { ButtonSize, ButtonVariant } from "../tokens";

type ButtonClassNames = {
  container: string;
  label: string;
};

type SizeClassNames = Record<ButtonSize, string>;

type VariantStyles = Record<ButtonVariant, ButtonClassNames>;

export const sizeClasses: SizeClassNames = {
  sm: "h-10 px-4 rounded-2xl",
  md: "h-12 px-6 rounded-3xl",
  lg: "h-14 px-7 rounded-3xl",
};

export const variantStyles: VariantStyles = {
  primary: {
    container: "bg-brand-600 active:bg-brand-700 dark:bg-brand-500 dark:active:bg-brand-600",
    label: "text-surface-50",
  },
  secondary: {
    container: "bg-surface-100 border border-brand-200 active:bg-brand-50 dark:bg-surface-900 dark:border-brand-500",
    label: "text-brand-700 dark:text-brand-100",
  },
  tertiary: {
    container:
      "bg-surface-50 border border-surface-200 active:bg-surface-100 dark:bg-surface-900 dark:border-surface-700",
    label: "text-text-primary dark:text-surface-50",
  },
  ghost: {
    container: "bg-transparent active:bg-brand-50 dark:active:bg-brand-900/40",
    label: "text-brand-600 dark:text-brand-200",
  },
  danger: {
    container: "bg-danger-600 active:bg-danger-700 dark:bg-danger-500 dark:active:bg-danger-600",
    label: "text-surface-50",
  },
};

export const resolveButtonClasses = (variant: ButtonVariant, size: ButtonSize): ButtonClassNames => {
  const baseContainer = "flex-row items-center justify-center gap-2 overflow-hidden";
  const baseLabel = "font-semibold";

  const variantClass = variantStyles[variant];

  return {
    container: clsx(baseContainer, sizeClasses[size], variantClass.container),
    label: clsx(baseLabel, variantClass.label),
  };
};

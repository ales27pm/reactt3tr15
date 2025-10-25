import React, { forwardRef } from "react";
import { Text, TextProps } from "react-native";
import clsx from "clsx";

import { TypographyVariant } from "../tokens";

type TypographyWeight = "regular" | "medium" | "semibold" | "bold";

type TypographyColor = "default" | "muted" | "inverse" | "brand" | "danger" | "success";

const variantClasses: Record<TypographyVariant, string> = {
  display: "text-4xl leading-[40px] tracking-tight",
  headline: "text-2xl leading-8",
  title: "text-xl leading-7",
  body: "text-base leading-6",
  caption: "text-sm leading-5",
  overline: "text-xs leading-4 uppercase tracking-wide",
};

const weightClasses: Record<TypographyWeight, string> = {
  regular: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

const colorClasses: Record<TypographyColor, string> = {
  default: "text-text-primary",
  muted: "text-text-muted",
  inverse: "text-text-inverse",
  brand: "text-brand-600",
  danger: "text-danger-600",
  success: "text-success-600",
};

export interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  weight?: TypographyWeight;
  color?: TypographyColor;
  className?: string;
}

export const resolveTypographyClasses = (
  variant: TypographyVariant,
  weight: TypographyWeight,
  color: TypographyColor,
): string => clsx(variantClasses[variant], weightClasses[weight], colorClasses[color]);

export const Typography = forwardRef<Text, TypographyProps>(
  ({ variant = "body", weight = "regular", color = "default", className, children, ...props }, ref) => (
    <Text ref={ref} className={clsx(resolveTypographyClasses(variant, weight, color), className)} {...props}>
      {children}
    </Text>
  ),
);

Typography.displayName = "Typography";

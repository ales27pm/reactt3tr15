import React, { forwardRef } from "react";
import { View, ViewProps } from "react-native";
import clsx from "clsx";

type SurfaceVariant = "raised" | "sunken" | "translucent";

type SurfaceState = "default" | "selected" | "warning" | "danger";

const variantClasses: Record<SurfaceVariant, string> = {
  raised: "bg-surface-50 shadow-elevated",
  sunken: "bg-surface-100 border border-surface-200",
  translucent: "bg-surface-900/80 border border-brand-500/40",
};

const stateClasses: Record<SurfaceState, string> = {
  default: "",
  selected: "ring-2 ring-brand-400",
  warning: "ring-2 ring-warning-500",
  danger: "ring-2 ring-danger-500",
};

export interface SurfaceProps extends ViewProps {
  variant?: SurfaceVariant;
  state?: SurfaceState;
  className?: string;
}

export const resolveSurfaceClasses = (variant: SurfaceVariant, state: SurfaceState): string =>
  clsx("rounded-3xl p-6", variantClasses[variant], stateClasses[state]);

export const Surface = forwardRef<View, SurfaceProps>(
  ({ variant = "raised", state = "default", className, children, ...props }, ref) => (
    <View ref={ref} className={clsx(resolveSurfaceClasses(variant, state), className)} {...props}>
      {children}
    </View>
  ),
);

Surface.displayName = "Surface";

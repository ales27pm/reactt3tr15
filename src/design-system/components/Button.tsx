import React, { forwardRef, useMemo } from "react";
import { ActivityIndicator, Pressable, PressableProps, View } from "react-native";
import Animated from "react-native-reanimated";
import { styled } from "nativewind";
import clsx from "clsx";

import { ButtonSize, ButtonVariant, palette } from "../tokens";
import { useScalePressFeedback } from "../animations/useScalePressFeedback";
import { Typography } from "./Typography";
import { resolveButtonClasses } from "./button-classes";

export interface ButtonProps extends Omit<PressableProps, "children"> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  loading?: boolean;
  textClassName?: string;
  className?: string;
}

const AnimatedPressable = styled(Animated.createAnimatedComponent(Pressable));

export const Button = forwardRef<Pressable, ButtonProps>(
  (
    {
      label,
      variant = "primary",
      size = "md",
      leadingIcon,
      trailingIcon,
      loading = false,
      disabled,
      textClassName,
      className,
      onPressIn,
      onPressOut,
      style,
      ...rest
    },
    ref,
  ) => {
    const { animatedStyle, handlePressIn, handlePressOut } = useScalePressFeedback({
      scaleTo: 0.96,
      disabled: disabled || loading,
    });

    const classes = useMemo(() => resolveButtonClasses(variant, size), [variant, size]);

    const indicatorColor =
      variant === "secondary" || variant === "tertiary" || variant === "ghost"
        ? palette.brand[600]
        : palette.surface[50];

    const isDisabled = disabled || loading;

    return (
      <AnimatedPressable
        ref={ref}
        className={clsx(classes.container, isDisabled && "opacity-60", className)}
        style={[animatedStyle, style]}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        onPressIn={(event) => {
          if (!isDisabled) {
            handlePressIn();
          }
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          if (!isDisabled) {
            handlePressOut();
          }
          onPressOut?.(event);
        }}
        disabled={disabled}
        {...rest}
      >
        <View className="flex-row items-center justify-center gap-2">
          {leadingIcon ? (
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {leadingIcon}
            </View>
          ) : null}
          {loading ? (
            <ActivityIndicator color={indicatorColor} size="small" />
          ) : (
            <Typography
              variant={size === "lg" ? "headline" : "body"}
              weight="semibold"
              className={clsx(classes.label, textClassName)}
            >
              {label}
            </Typography>
          )}
          {trailingIcon ? (
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {trailingIcon}
            </View>
          ) : null}
        </View>
      </AnimatedPressable>
    );
  },
);

Button.displayName = "Button";

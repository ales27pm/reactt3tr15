import React, { forwardRef, useCallback, useMemo } from "react";
import { ActivityIndicator, Pressable, PressableProps, View } from "react-native";
import Animated from "react-native-reanimated";
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

type AnimatedPressableComponentProps = React.ComponentPropsWithRef<typeof Pressable> & {
  className?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(
  Pressable,
) as React.ComponentType<AnimatedPressableComponentProps>;

type PressableComponentRef = React.ElementRef<typeof Pressable>;

export const Button = forwardRef<PressableComponentRef, ButtonProps>(
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

    const pressableStyle = useMemo<PressableProps["style"]>(() => {
      if (typeof style === "function") {
        return (state) => {
          const resolved = style(state);
          return [animatedStyle, resolved];
        };
      }
      return [animatedStyle, style];
    }, [animatedStyle, style]);

    type PressableEvent = Parameters<NonNullable<PressableProps["onPressIn"]>>[0];

    const handleInternalPressIn = useCallback(
      (event: PressableEvent) => {
        if (!isDisabled) {
          handlePressIn();
        }
        onPressIn?.(event);
      },
      [handlePressIn, isDisabled, onPressIn],
    );

    const handleInternalPressOut = useCallback(
      (event: PressableEvent) => {
        if (!isDisabled) {
          handlePressOut();
        }
        onPressOut?.(event);
      },
      [handlePressOut, isDisabled, onPressOut],
    );

    return (
      <AnimatedPressable
        ref={ref}
        className={clsx(classes.container, isDisabled && "opacity-60", className)}
        style={pressableStyle}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        onPressIn={handleInternalPressIn}
        onPressOut={handleInternalPressOut}
        disabled={isDisabled}
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

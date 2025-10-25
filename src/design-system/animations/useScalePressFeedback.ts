import { useCallback } from "react";
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface Options {
  scaleTo?: number;
  durationIn?: number;
  durationOut?: number;
  disabled?: boolean;
}

export const useScalePressFeedback = (options?: Options) => {
  const scale = useSharedValue(1);

  const { scaleTo = 0.96, durationIn = 120, durationOut = 160, disabled = false } = options ?? {};

  const handlePressIn = useCallback(() => {
    if (disabled) {
      return;
    }
    scale.value = withTiming(scaleTo, {
      duration: durationIn,
      easing: Easing.out(Easing.quad),
    });
  }, [disabled, durationIn, scale, scaleTo]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, {
      duration: durationOut,
      easing: Easing.out(Easing.cubic),
    });
  }, [durationOut, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return {
    animatedStyle,
    handlePressIn,
    handlePressOut,
    scale,
  };
};

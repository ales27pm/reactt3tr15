import React, { useEffect, useMemo } from "react";
import { Dimensions, StyleSheet, View, Text } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

type Stream = { x: number; len: number; speed: number; delay: number };

export default function MatrixRain({ density = 14, opacity = 0.25 }: { density?: number; opacity?: number }) {
  const streams: Stream[] = useMemo(() => {
    const cols = density;
    const gap = Math.max(12, Math.floor(SCREEN_W / cols));
    return Array.from({ length: cols }, (_, i) => ({
      x: i * gap + (i % 2 === 0 ? 6 : 0),
      len: 12 + ((i * 7) % 12),
      speed: 4000 + ((i * 473) % 3000),
      delay: (i * 217) % 1500,
    }));
  }, [density]);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      {streams.map((s, idx) => (
        <RainStream key={idx} {...s} />
      ))}
    </View>
  );
}

function RainStream({ x, len, speed, delay }: Stream) {
  const y = useSharedValue(-SCREEN_H);
  useEffect(() => {
    y.value = -SCREEN_H;
    const run = () => {
      y.value = withTiming(SCREEN_H + len * 16, { duration: speed, easing: Easing.linear }, (finished) => {
        if (finished) {
          y.value = -SCREEN_H;
          run();
        }
      });
    };
    const t = setTimeout(run, delay);
    return () => {
      clearTimeout(t);
    };
  }, [y, speed, delay, len]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  const glyphs = useMemo(() => randomMatrixString(len), [len]);

  return (
    <Animated.View style={[styles.stream, { left: x }, style]}>
      {glyphs.map((g, i) => (
        <Text key={i} style={styles.glyph}>
          {g}
        </Text>
      ))}
    </Animated.View>
  );
}

function randomMatrixString(n: number): string[] {
  const chars = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛ0123456789";
  const arr: string[] = [];
  for (let i = 0; i < n; i++) {
    arr.push(chars[(i * 37 + 17) % chars.length]);
  }
  return arr;
}

const styles = StyleSheet.create({
  stream: { position: "absolute", top: -SCREEN_H, flexDirection: "column" },
  glyph: {
    color: "#00FF00",
    fontSize: 12,
    lineHeight: 14,
    opacity: 0.9,
    textShadowColor: "#00FF00",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});

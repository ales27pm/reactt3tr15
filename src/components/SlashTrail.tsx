import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Polyline } from "react-native-svg";

export interface Point {
  x: number;
  y: number;
  timestamp: number;
}

interface SlashTrailProps {
  isActive: boolean;
  initialPoint?: Point;
  registerAddPoint?: (fn: (p: Point) => void) => void;
}

const SLASH_LIFETIME = 800; // ms
const MAX_SLASH_POINTS = 64;
const SLASH_WIDTH = 5;
const SLASH_COLOR = "#00FF00"; // neon green

export default function SlashTrail({ isActive, initialPoint, registerAddPoint }: SlashTrailProps) {
  const [trails, setTrails] = useState<{ points: Point[]; id: number }[]>([]);
  const trailId = useRef(0);

  // prune old trails
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTrails((prev) => prev.filter((t) => t.points.length && now - t.points[0].timestamp < SLASH_LIFETIME));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // start a new trail when activated with an initial point
  useEffect(() => {
    if (isActive && initialPoint) {
      setTrails((prev) => [...prev, { id: trailId.current++, points: [initialPoint] }]);
    }
  }, [isActive, initialPoint]);

  const addPoint = (p: Point) => {
    setTrails((prev) => {
      if (prev.length === 0) {
        // seed a new trail if none exists yet
        return [{ id: trailId.current++, points: [p] }];
      }
      const next = [...prev];
      const last = next[next.length - 1];
      const lp = last.points[last.points.length - 1];
      const dx = p.x - lp.x;
      const dy = p.y - lp.y;
      const dist2 = dx * dx + dy * dy;
      const dt = p.timestamp - lp.timestamp;
      if (dist2 < 9 || dt < 8) return prev; // min spacing and time throttle
      if (last.points.length >= MAX_SLASH_POINTS) last.points.shift();
      last.points.push(p);
      return next;
    });
  };

  // expose addPoint to parent
  useEffect(() => {
    if (registerAddPoint) registerAddPoint(addPoint);
  }, [registerAddPoint]);

  const drawableTrails = trails.filter((trail) => trail.points.length > 1);

  if (drawableTrails.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        {drawableTrails.map((trail) => {
          const pointsAttr = trail.points.map((point) => `${point.x},${point.y}`).join(" ");
          const opacity = computeOpacity(trail.points);
          return (
            <React.Fragment key={`trail-${trail.id}`}>
              <Polyline
                points={pointsAttr}
                stroke={SLASH_COLOR}
                strokeWidth={SLASH_WIDTH * 1.8}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={opacity * 0.25}
              />
              <Polyline
                points={pointsAttr}
                stroke={SLASH_COLOR}
                strokeWidth={SLASH_WIDTH}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={opacity}
              />
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

function computeOpacity(points: Point[]) {
  if (!points.length) return 0;
  const age = Date.now() - points[0].timestamp;
  const t = Math.min(1, Math.max(0, age / SLASH_LIFETIME));
  return 1 - t * 0.8; // fade out
}

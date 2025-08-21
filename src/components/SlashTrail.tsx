import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";

export interface Point { x: number; y: number; timestamp: number }

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
      setTrails(prev => prev.filter(t => t.points.length && now - t.points[0].timestamp < SLASH_LIFETIME));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // start a new trail when activated with an initial point
  useEffect(() => {
    if (isActive && initialPoint) {
      setTrails(prev => [...prev, { id: trailId.current++, points: [initialPoint] }]);
    }
  }, [isActive, initialPoint]);

  const addPoint = (p: Point) => {
    setTrails(prev => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = next[next.length - 1];
      const lp = last.points[last.points.length - 1];
      const dx = p.x - lp.x; const dy = p.y - lp.y;
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

  if (trails.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        {trails.map(trail => (
          <>
            <Path
              key={`g-${trail.id}`}
              path={createPath(trail.points)}
              style="stroke"
              strokeWidth={SLASH_WIDTH * 1.8}
              color={SLASH_COLOR}
              strokeJoin="round"
              strokeCap="round"
              opacity={computeOpacity(trail.points) * 0.25}
            />
            <Path
              key={`m-${trail.id}`}
              path={createPath(trail.points)}
              style="stroke"
              strokeWidth={SLASH_WIDTH}
              color={SLASH_COLOR}
              strokeJoin="round"
              strokeCap="round"
              opacity={computeOpacity(trail.points)}
            />
          </>
        ))}
      </Canvas>
    </View>
  );
}

function createPath(points: Point[]) {
  const path = Skia.Path.Make();
  if (!points.length) return path;
  path.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) path.lineTo(points[i].x, points[i].y);
  return path;
}

function computeOpacity(points: Point[]) {
  if (!points.length) return 0;
  const age = Date.now() - points[0].timestamp;
  const t = Math.min(1, Math.max(0, age / SLASH_LIFETIME));
  return 1 - t * 0.8; // fade out
}

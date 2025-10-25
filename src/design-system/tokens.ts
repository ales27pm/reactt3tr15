import { Platform } from "react-native";

type ColorScale = Record<number | string, string>;

export interface Palette {
  brand: ColorScale;
  accent: ColorScale;
  neutral: ColorScale;
  surface: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  danger: ColorScale;
  info: ColorScale;
  text: Record<"primary" | "secondary" | "muted" | "inverse", string>;
}

export interface TypographyTokens {
  families: {
    brand: string;
    sans: string;
    mono: string;
  };
  sizes: Record<"xs" | "sm" | "md" | "lg" | "xl" | "display", number>;
  lineHeights: Record<"xs" | "sm" | "md" | "lg" | "xl" | "display", number>;
  letterSpacing: Record<"tight" | "normal" | "wide", number>;
}

export interface ElevationToken {
  ios: string;
  android: {
    elevation: number;
    shadowColor: string;
    shadowOpacity: number;
    shadowRadius: number;
    shadowOffset: { width: number; height: number };
  };
}

export interface ElevationTokens {
  flat: ElevationToken;
  raised: ElevationToken;
  overlay: ElevationToken;
}

export interface DesignTokens {
  palette: Palette;
  typography: TypographyTokens;
  spacing: Record<string, number>;
  radii: Record<"sm" | "md" | "lg" | "xl" | "pill", number>;
  elevation: ElevationTokens;
}

export const palette: Palette = {
  brand: {
    50: "#EEF2FF",
    100: "#E0E7FF",
    200: "#C7D2FE",
    300: "#A5B4FC",
    400: "#818CF8",
    500: "#6366F1",
    600: "#4F46E5",
    700: "#4338CA",
    800: "#3730A3",
    900: "#312E81",
  },
  accent: {
    50: "#ECFEFF",
    100: "#CFFAFE",
    200: "#A5F3FC",
    300: "#67E8F9",
    400: "#22D3EE",
    500: "#06B6D4",
    600: "#0891B2",
    700: "#0E7490",
    800: "#155E75",
    900: "#164E63",
  },
  neutral: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5F5",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
  },
  surface: {
    50: "#FFFFFF",
    100: "#F8FAFC",
    200: "#F1F5F9",
    300: "#E2E8F0",
    600: "#1F2937",
    900: "#111827",
  },
  success: {
    50: "#ECFDF5",
    100: "#D1FAE5",
    200: "#A7F3D0",
    500: "#10B981",
    700: "#047857",
  },
  warning: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    500: "#F59E0B",
    700: "#B45309",
  },
  danger: {
    50: "#FEF2F2",
    100: "#FEE2E2",
    200: "#FECACA",
    500: "#EF4444",
    700: "#B91C1C",
  },
  info: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    500: "#3B82F6",
    700: "#1D4ED8",
  },
  text: {
    primary: "#0F172A",
    secondary: "#334155",
    muted: "#64748B",
    inverse: "#F8FAFC",
  },
};

const platformFont = (ios: string, android: string, defaultFont = "System") =>
  Platform.select({ ios, android, default: defaultFont }) ?? defaultFont;

export const typography: TypographyTokens = {
  families: {
    brand: platformFont("SF Pro Rounded", "Work Sans", "System"),
    sans: platformFont("SF Pro Text", "Roboto", "System"),
    mono: platformFont("SF Mono", "Roboto Mono", "monospace"),
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    display: 32,
  },
  lineHeights: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    display: 40,
  },
  letterSpacing: {
    tight: -0.2,
    normal: 0,
    wide: 0.4,
  },
};

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  18: 72,
  20: 80,
};

export const radii = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
};

export const elevation: ElevationTokens = {
  flat: {
    ios: "0px 0px 0px rgba(0,0,0,0)",
    android: {
      elevation: 0,
      shadowColor: "#00000000",
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
    },
  },
  raised: {
    ios: "0px 16px 32px rgba(15, 23, 42, 0.12)",
    android: {
      elevation: 8,
      shadowColor: "#0F172A",
      shadowOpacity: 0.16,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
    },
  },
  overlay: {
    ios: "0px 24px 48px rgba(15, 23, 42, 0.22)",
    android: {
      elevation: 12,
      shadowColor: "#0F172A",
      shadowOpacity: 0.24,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 12 },
    },
  },
};

export const tokens: DesignTokens = {
  palette,
  typography,
  spacing,
  radii,
  elevation,
};

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
export type TypographyVariant = "display" | "headline" | "title" | "body" | "caption" | "overline";

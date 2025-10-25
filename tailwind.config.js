/** @type {import('tailwindcss').Config} */
const plugin = require("tailwindcss/plugin");

module.exports = {
  content: ["./App.tsx", "./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  corePlugins: {
    space: false,
  },
  theme: {
    extend: {
      colors: {
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
      },
      fontFamily: {
        sans: ["System"],
        brand: ["System"],
        mono: ["monospace"],
      },
      spacing: {
        18: "72px",
        22: "88px",
        26: "104px",
        30: "120px",
        34: "136px",
      },
      borderRadius: {
        "3xl": "32px",
        "4xl": "40px",
        pill: "999px",
      },
      boxShadow: {
        outline: "0 0 0 1px rgba(99,102,241,0.24)",
        elevated: "0px 16px 32px rgba(15, 23, 42, 0.12)",
        overlay: "0px 24px 48px rgba(15, 23, 42, 0.22)",
      },
      fontSize: {
        xs: "10px",
        sm: "12px",
        base: "14px",
        lg: "18px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
        "4xl": "40px",
        "5xl": "48px",
        "6xl": "56px",
        "7xl": "64px",
        "8xl": "72px",
        "9xl": "80px",
      },
    },
  },
  darkMode: "class",
  plugins: [
    plugin(({ matchUtilities, theme }) => {
      const spacing = theme("spacing");

      matchUtilities(
        { space: (value) => ({ gap: value }) },
        { values: spacing, type: ["length", "number", "percentage"] },
      );

      matchUtilities(
        { "space-x": (value) => ({ columnGap: value }) },
        { values: spacing, type: ["length", "number", "percentage"] },
      );

      matchUtilities(
        { "space-y": (value) => ({ rowGap: value }) },
        { values: spacing, type: ["length", "number", "percentage"] },
      );
    }),
  ],
};

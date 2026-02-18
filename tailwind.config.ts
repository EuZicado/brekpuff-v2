import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["IBM Plex Mono", "monospace"], // Default to IBM Plex Mono
        mono: ["IBM Plex Mono", "monospace"],
      },
      fontSize: {
        display: ["2.5rem", { lineHeight: "1.1", fontWeight: "700" }],
        heading: ["1.75rem", { lineHeight: "1.25", fontWeight: "700" }],
        subheading: ["1.125rem", { lineHeight: "1.4", fontWeight: "600" }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "#0B0B0B", // Deep dark background
        foreground: "#E0E0E0", // Dust gray text
        primary: {
          DEFAULT: "#3AFF5C", // Neon Green
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#1A1A1A", // Dark Gray
          foreground: "#3AFF5C",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#222222",
          foreground: "#888888", // Dust Gray
        },
        accent: {
          DEFAULT: "#3AFF5C",
          foreground: "#000000",
        },
        popover: {
          DEFAULT: "#111111",
          foreground: "#E0E0E0",
        },
        card: {
          DEFAULT: "#111111",
          foreground: "#E0E0E0",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        lime: "hsl(var(--lime))",
        purple: "hsl(var(--purple))",
        yellow: "hsl(var(--yellow))",
        "yellow-soft": "hsl(var(--yellow-soft))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "scanline": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "pulse-neon": {
          "0%, 100%": { boxShadow: "0 0 5px #3AFF5C, 0 0 10px #3AFF5C" },
          "50%": { boxShadow: "0 0 2px #3AFF5C, 0 0 5px #3AFF5C" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "scanline": "scanline 2s linear infinite",
        "pulse-neon": "pulse-neon 2s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

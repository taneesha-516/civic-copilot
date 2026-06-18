/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./worker/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1B4FD8",
          light: "#EEF3FF",
          dark: "#1340B0",
        },
        accent: {
          DEFAULT: "#F59E0B",
          50: "#FFFBEB",
        },
        danger: {
          DEFAULT: "#DC2626",
          light: "#FEF2F2",
        },
        success: {
          DEFAULT: "#16A34A",
          light: "#F0FDF4",
        },
        surface: "#FFFFFF",
        background: "#F8FAFC",
        border: "#E2E8F0",
        text: {
          primary: "#0F172A",
          secondary: "#475569",
          muted: "#94A3B8",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        elevated: "0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
        modal: "0 20px 60px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        button: "10px",
        input: "10px",
        card: "16px",
        badge: "999px",
        modal: "20px",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-120%) skewX(-12deg)" },
          "100%": { transform: "translateX(220%) skewX(-12deg)" },
        },
        dashboardShimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
        sidebarPulseRing: {
          "0%": {
            transform: "scale(1)",
            opacity: "0.8",
            boxShadow: "0 0 0 0 rgba(34, 197, 94, 0.6)",
          },
          "70%": {
            transform: "scale(1)",
            boxShadow: "0 0 0 8px rgba(34, 197, 94, 0)",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "0.8",
            boxShadow: "0 0 0 0 rgba(34, 197, 94, 0)",
          },
        },
        bellRing: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "20%": { transform: "rotate(-15deg)" },
          "40%": { transform: "rotate(15deg)" },
          "60%": { transform: "rotate(-15deg)" },
          "80%": { transform: "rotate(15deg)" },
        },
        bounceMarker: {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "45%": { transform: "translateY(-18px) scale(1.04)" },
          "65%": { transform: "translateY(0) scale(0.98)" },
          "82%": { transform: "translateY(-6px) scale(1.02)" },
        },
        focusFlash: {
          "0%": { backgroundColor: "transparent" },
          "18%": { backgroundColor: "#EEF3FF" },
          "100%": { backgroundColor: "transparent" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        grain: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "48px 48px" },
        },
        "neural-fire": {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "0.8" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(760%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        "dashboard-shimmer": "dashboardShimmer 1.5s linear infinite",
        "pulse-ring": "pulse-ring 2s ease-out infinite",
        "sidebar-pulse-ring": "sidebarPulseRing 2s infinite",
        "bell-ring": "bellRing 300ms ease-in-out 1",
        "bounce-marker": "bounceMarker 0.72s ease-out 2",
        "focus-flash": "focusFlash 1.4s ease-out 1",
        float: "float 4s ease-in-out infinite",
        grain: "grain 1.1s steps(6) infinite",
        scan: "scan 1.2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;

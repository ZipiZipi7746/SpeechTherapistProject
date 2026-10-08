import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['"Heebo Variable"', "Heebo", "system-ui", "sans-serif"] },
      colors: {
        brand: {
          50: "#f6f3ff",
          100: "#ece6fd",
          200: "#d9ccfa",
          300: "#bfa6f4",
          400: "#a47feb",
          500: "#8b5fe0",
          600: "#7c4dcf",
          700: "#6a3db3",
          800: "#573392",
          900: "#3f2570",
        },
        ink: { DEFAULT: "#16132b", soft: "#5b5876", faint: "#8f8da8" },
        surface: { DEFAULT: "#ffffff", muted: "#f8f8fd", line: "#e7e5f3" },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #7c4dcf 0%, #c97be0 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, #f1ebff 0%, #fbeefe 100%)",
      },
      boxShadow: {
        card: "0 1px 2px rgba(22,19,43,.04), 0 4px 16px rgba(22,19,43,.05)",
        pop: "0 10px 40px rgba(60,37,112,.18)",
      },
      keyframes: {
        "toast-in": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "none" } },
        "sheet-in": { from: { transform: "translateY(100%)" }, to: { transform: "none" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        "toast-in": "toast-in .2s ease-out",
        "sheet-in": "sheet-in .25s ease-out",
        "fade-in": "fade-in .15s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        parish: {
          50: "#f4f6f8",
          100: "#e6ebf0",
          200: "#c9d4de",
          300: "#a3b4c4",
          400: "#7590a6",
          500: "#4d6f8c",
          600: "#3a5773",
          700: "#2f465d",
          800: "#28394c",
          900: "#243141",
          950: "#161f2a",
        },
        gold: {
          50: "#fbf7ee",
          100: "#f4e9cd",
          200: "#e9d19f",
          300: "#dcb46a",
          400: "#d19c47",
          500: "#c1853a",
          600: "#a06a2f",
          700: "#7f5228",
          800: "#684325",
          900: "#573922",
        },
        level: {
          geral: "#2563eb",
          pais: "#7c5a3a",
          infantil: "#16a34a",
          criancas: "#ca8a04",
          adolescentes: "#ea580c",
          jovens: "#dc2626",
          adultos: "#9333ea",
          catequistas: "#111827",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;

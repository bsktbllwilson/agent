import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        terracotta: {
          DEFAULT: "#D85A30",
          50: "#FDF3EF",
          100: "#FAE1D6",
          200: "#F4BDAA",
          300: "#ED9A7E",
          400: "#E37652",
          500: "#D85A30",
          600: "#B84925",
          700: "#8A371C",
          800: "#5C2513",
          900: "#2E130A",
        },
        sand: {
          50: "#FDFBF7",
          100: "#F8F4EC",
          200: "#F0E8D8",
          300: "#E5D8BF",
        },
      },
      fontFamily: {
        display: ["'DM Serif Display'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

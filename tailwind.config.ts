import type { Config } from "tailwindcss";

/**
 * CLEAN BLUE-STEEL THEME
 * ---------------------------------------------------------------
 * - Mode gelap : abu-biru (steel blue-gray)
 * - Mode cerah : putih-biru (blue-white)
 *
 * Seluruh komponen memakai kelas `slate-*` (netral) dan `emerald-*`
 * (aksen utama). Agar tema berganti konsisten di seluruh aplikasi tanpa
 * menulis ulang ratusan kelas, kedua palet tersebut dipetakan ulang:
 *   slate   -> abu-biru baja (steel)
 *   emerald -> biru industrial (aksen)
 * Palet `industrial` disediakan untuk kode baru.
 */
const steel = {
  50: "#f5f8fc",
  100: "#e9eff7",
  200: "#d4dfec",
  300: "#afc0d4",
  400: "#8598b2",
  500: "#62758f",
  600: "#4b5c75",
  700: "#3a4a61",
  800: "#2b394d",
  900: "#202c3d",
  950: "#162030",
};

const industrialBlue = {
  50: "#eef6ff",
  100: "#d9eaff",
  200: "#bcdaff",
  300: "#8ec3ff",
  400: "#59a2fb",
  500: "#3383f5",
  600: "#1f66e0",
  700: "#1a52c0",
  800: "#1c459b",
  900: "#1d3d7a",
  950: "#16274a",
};

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: steel,
        emerald: industrialBlue,
        industrial: {
          ...steel,
          accent: industrialBlue[500],
          "accent-dark": industrialBlue[600],
        },
      },
      // Sudut lembut namun tetap rapi
      borderRadius: {
        md: "6px",
        lg: "8px",
        xl: "10px",
        "2xl": "14px",
        "3xl": "18px",
      },
      fontFamily: {
        sans: [
          "\"Segoe UI Variable Text\"",
          "\"Segoe UI\"",
          "-apple-system",
          "BlinkMacSystemFont",
          "Roboto",
          "\"Helvetica Neue\"",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "\"JetBrains Mono\"",
          "\"Cascadia Mono\"",
          "Consolas",
          "\"Roboto Mono\"",
          "ui-monospace",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";
import uiPreset from "@clavonia/ui/tailwind-preset";

const config: Config = {
  presets: [uiPreset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "../../packages/*/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Set by next/font in app/layout.tsx
        heading: ["var(--font-playfair)", "Georgia", "serif"],
        body: ["var(--font-lora)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;

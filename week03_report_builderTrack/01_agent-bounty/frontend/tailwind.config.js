/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bounty: {
          deep: "#09637E",       // Deep Teal / Oceanic Brand
          cerulean: "#088395",   // Vibrant Teal / Interactive Accent
          sage: "#7AB2B2",       // Soft Sage / Borders & Muted Text
          ice: "#EBF4F6",        // Ice White / Clean Surface & Canvas
          dark: "#05303D",       // Ultra Deep Slate for Dark Cards
        },
      },
    },
  },
  plugins: [],
};

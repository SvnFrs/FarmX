/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        saltpan: {
          50: "#f5fbf6",
          100: "#d6f1db",
          200: "#ade2b7",
          300: "#7dcb90",
          400: "#52af6c",
          500: "#389453",
          600: "#2b7643",
          700: "#265f39",
          800: "#224d30",
          900: "#20412b",
          950: "#0d2616",
        },
      },
    },
  },
  plugins: [],
};

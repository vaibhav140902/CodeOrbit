/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "!./src/admin-scripts/**/*",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

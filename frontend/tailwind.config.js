/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gridgreen: '#00E599',
        gridcyan: '#00D8F6',
      },
    },
  },
  plugins: [],
}

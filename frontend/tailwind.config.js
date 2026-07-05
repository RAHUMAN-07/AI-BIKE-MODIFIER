/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#111111',
        panel: '#27272a',
        primary: '#8b5cf6',
      }
    },
  },
  plugins: [],
}

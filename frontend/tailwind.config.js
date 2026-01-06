/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'hospital-blue': '#ebf2f6',
        'accent-blue': '#6d98af',
        'dark-text': '#1a2b3c',
      },
    },
  },
  plugins: [],
}
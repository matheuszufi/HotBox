/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdeacc',
          200: '#fad199',
          300: '#f6b066',
          400: '#f28738',
          500: '#ef6820',
          600: '#e04d16',
          700: '#b73614',
          800: '#942c18',
          900: '#792616',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}

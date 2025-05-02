/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  safelist: [
    "flash-flicker", "fade-in", "scanlines", "boot-glow",
    "typing-line", "glow-pulse", "burn-in", "crt-line",
    "reverse-flash", "glitch-flicker", "screen-shake"
  ],
  plugins: [],
}

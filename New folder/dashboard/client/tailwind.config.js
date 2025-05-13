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
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out forwards',
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

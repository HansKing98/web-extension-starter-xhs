/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./source/**/*.{html,tsx,ts,jsx,js}",
    "./source/**/*.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'gradient': 'gradient 3s ease-in-out infinite',
        'shimmer': 'shimmer 0.5s ease-in-out',
      },
      keyframes: {
        gradient: {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      },
      backgroundSize: {
        '300': '300% 300%',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}


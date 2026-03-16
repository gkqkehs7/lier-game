import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        citizen: {
          bg: '#E1F5EE',
          text: '#085041',
        },
        liar: {
          bg: '#FBEAF0',
          text: '#72243E',
        },
        vote: {
          DEFAULT: '#EF4444',
        },
        defense: {
          DEFAULT: '#F59E0B',
        },
        ui: {
          bg: '#EEEDFE',
          text: '#3C3489',
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      keyframes: {
        bounce_in: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      animation: {
        bounce_in: 'bounce_in 0.4s ease-out',
        wiggle: 'wiggle 0.3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config

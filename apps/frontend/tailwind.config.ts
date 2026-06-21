import type { Config } from 'tailwindcss';

// Beba Photography design tokens. Distinctive editorial pairing:
// Fraunces (display serif, optical sizing) + Manrope (body grotesque).
export default {
  content: [
    './app/**/*.{vue,js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // "Gallery noir" palette — warm near-black, bone, antique gold.
        ink: {
          DEFAULT: '#0c0a09',
          soft: '#1a1614',
          muted: '#27211d',
        },
        bone: {
          DEFAULT: '#f6f1ea',
          dim: '#cfc6ba',
          faint: '#8c8278',
        },
        gold: {
          DEFAULT: '#c79a4b',
          soft: '#e0c585',
        },
      },
      letterSpacing: {
        tightest: '-0.05em',
      },
    },
  },
  plugins: [],
} satisfies Config;

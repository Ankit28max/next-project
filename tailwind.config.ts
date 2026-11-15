import type { Config } from 'tailwindcss';

// Design tokens. One accent colour ("brand") plus Tailwind's slate greys.
// Green / amber / red are used only to show status, always together with an icon and text.
const config: Config = {
  content: ['./src/components/**/*.{ts,tsx}', './src/app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff5fb',
          100: '#dbe8f6',
          200: '#b9d2ee',
          300: '#8ab3e1',
          400: '#5a8fd0',
          500: '#3a72bd',
          600: '#2a5aa3',
          700: '#234985',
          800: '#1f3d6d',
          900: '#1b3359',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        page: '72rem',
      },
    },
  },
  plugins: [],
};

export default config;

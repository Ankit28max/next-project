import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c3d9eb',
          300: '#95bedd',
          400: '#609dcc',
          500: '#3c81b8',
          600: '#2c679a',
          700: '#25537d',
          800: '#224667',
          900: '#1b3753',
          950: '#0d1f31',
        },
        civic: {
          primary: '#1b3753',    // Deep National Blue
          accent: '#2563eb',     // Action Blue
          gold: '#d97706',       // Civic Amber / Warning
          emerald: '#059669',    // Resolved / Safe Green
          rose: '#dc2626',       // High Risk / Urgent Red
          surface: '#f8fafc',
          border: '#e2e8f0',
        },
      },
    },
  },
  plugins: [],
};

export default config;

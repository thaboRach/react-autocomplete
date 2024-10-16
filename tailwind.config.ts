import type { Config } from 'tailwindcss';

const config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  prefix: 'ra-',
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;

export default config;

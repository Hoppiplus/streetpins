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
        'brand-bg':     'var(--brand-bg)',
        'brand-card':   'var(--brand-card)',
        'brand-border': 'var(--brand-border)',
        'brand-accent': 'var(--brand-accent)',
        'brand-muted':  'var(--brand-muted)',
        'brand-gold':   'var(--brand-gold)',
        'brand-text':   'var(--brand-text)',
      },
    },
  },
  plugins: [],
};

export default config;

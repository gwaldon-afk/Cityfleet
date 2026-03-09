import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // City Fleet Brand Colors
        cityfleet: {
          navy: '#002147',
          'navy-light': '#003366',
          gold: '#F4B020',
          'gold-light': '#F5C050',
        },
        // Job Status Colors
        status: {
          'in-progress': '#27AE60',
          'assigned': '#3498DB',
          'paused': '#F39C12',
          'blocked': '#E74C3C',
          'completed': '#95A5A6',
        },
      },
    },
  },
  plugins: [],
};

export default config;

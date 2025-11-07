/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(20, 184, 166)',
          dark: 'rgb(13, 148, 136)',
        },
        secondary: 'rgb(99, 102, 241)',
        success: 'rgb(34, 197, 94)',
        danger: 'rgb(239, 68, 68)',
        warning: 'rgb(251, 191, 36)',
        info: 'rgb(59, 130, 246)',
      },
    },
  },
  plugins: [],
}

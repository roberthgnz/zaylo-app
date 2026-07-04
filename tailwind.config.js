/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        text: { light: '#000000', dark: '#ffffff' },
        background: { light: '#ffffff', dark: '#000000' },
        'background-element': { light: '#F0F0F3', dark: '#212225' },
        'background-selected': { light: '#E0E1E6', dark: '#2E3135' },
        'text-secondary': { light: '#60646C', dark: '#B0B4BA' },
      },
      spacing: {
        half: '2px',
        one: '4px',
        two: '8px',
        three: '16px',
        four: '24px',
        five: '32px',
        six: '64px',
      },
    },
  },
  plugins: [],
};

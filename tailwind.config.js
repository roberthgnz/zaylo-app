/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        carbon: '#0B0B0B',
        bone: '#F6F4EE',
        'acid-lime': '#C8FF3D',
        'electric-blue': '#2F6BFF',
        'signal-red': '#FF4B4B',
        text: { light: '#0B0B0B', dark: '#F6F4EE' },
        background: { light: '#FFFFFF', dark: '#0B0B0B' },
        'background-element': { light: '#F6F4EE', dark: '#1A1A1A' },
        'background-selected': { light: '#E8E8E9', dark: '#2A2A2A' },
        'text-secondary': { light: '#57534E', dark: '#B0AFA9' },
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
      fontFamily: {
        sans: ['Geist_400Regular'],
        display: ['Geist_700Bold'],
      },
    },
  },
  plugins: [],
};

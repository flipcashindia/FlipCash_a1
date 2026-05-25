/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FEC925',
          dark: '#E5B520',
          light: '#FFD54F',
        },
        secondary: {
          DEFAULT: '#1B8A05',
          dark: '#156D04',
          light: '#22A906',
        },
        dark: {
          DEFAULT: '#1C1C1B',
          light: '#333333',
        },
        gray: {
          light: '#F5F5F5',
          medium: '#CCCCCC',
          dark: '#666666',
        },
        danger: {
          DEFAULT: '#FF0000',
          light: '#FF6666',
        },
        aqua: '#EAF6F4',
        offwhite: '#F0F7F6',
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'Montserrat', 'sans-serif'],
        serif: ['Didot', 'Bodoni MT', 'serif'],
      },
    },
  },
  plugins: [],
}
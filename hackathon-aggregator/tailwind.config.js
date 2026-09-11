/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFCFA',
          100: '#FBF9F5',
          200: '#F5F0E8',
          300: '#EDE6D8',
        },
        sage: {
          50: '#F4F7F4',
          100: '#E5EBE5',
          200: '#C8D4C8',
          300: '#9FB09F',
          400: '#7A917A',
          500: '#5C735C',
          600: '#455745',
          700: '#364436',
          800: '#243024',
          900: '#1A231A',
        },
        terracotta: {
          50: '#FDF3EF',
          100: '#FBE8DD',
          200: '#F5CFC0',
          300: '#ECAA8E',
          400: '#E07F5A',
          500: '#D4633A',
          600: '#B54A2A',
          700: '#933B24',
          800: '#6E2E1D',
          900: '#4A2115',
        },
        dusk: {
          50: '#F3F5FA',
          100: '#E4E8F2',
          200: '#C8CFE6',
          300: '#A3A8CC',
          400: '#7E84B3',
          500: '#5F6594',
          600: '#4B4F76',
          700: '#3A3D5C',
          800: '#2E3048',
          900: '#232535',
        },
        night: {
          50: '#1E1F21',
          100: '#18191A',
          200: '#131416',
          300: '#0E0F11',
          400: '#0A0B0D',
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(0, 0, 0, 0.06)',
        softHover: '0 8px 32px -4px rgba(0, 0, 0, 0.10)',
        ambient: '0 2px 16px -2px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        '4xl': '1.5rem',
      },
      transitionProperty: {
        theme: 'background-color, border-color, color, box-shadow, transform',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        olive: {
          50: '#F4F6EE',
          100: '#E4E9D6',
          200: '#C8D2AE',
          300: '#A3B384',
          400: '#7C9159',
          500: '#5A783C',
          600: '#3F5D2A',
          700: '#354C24',
          800: '#2E3310',
          900: '#20240B',
        },
        gold: {
          50: '#FBF6E7',
          100: '#F3E7BF',
          200: '#E4CE8C',
          300: '#CFB264',
          400: '#A88937',
          500: '#8F722A',
          600: '#71591F',
        },
        clay: {
          100: '#F0E2CE',
          200: '#DCBE94',
          300: '#B98A47',
          400: '#7C511A',
          500: '#5E3C12',
        },
        sand: {
          50: '#FBF8EE',
          100: '#EEE6C9',
          200: '#E2D6B0',
          300: '#CFC095',
        },
        ink: {
          DEFAULT: '#22260E',
          soft: '#4A5033',
          muted: '#767B60',
        },
        state: {
          success: '#3F7D45',
          warning: '#B07A1B',
          danger: '#9C3222',
          info: '#3A6079',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Tajawal', 'system-ui', 'sans-serif'],
        ar: ['Tajawal', 'Inter', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'Amiri', 'serif'],
        displayAr: ['Amiri', '"Cormorant Garamond"', 'serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
      },
      borderRadius: {
        xs: '4px',
        DEFAULT: '8px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(34, 38, 14, 0.05)',
        sm: '0 2px 6px rgba(34, 38, 14, 0.06)',
        md: '0 6px 18px -6px rgba(34, 38, 14, 0.14)',
        lg: '0 18px 40px -18px rgba(34, 38, 14, 0.22)',
        xl: '0 32px 70px -28px rgba(34, 38, 14, 0.30)',
        gold: '0 10px 30px -12px rgba(168, 137, 55, 0.45)',
      },
      maxWidth: {
        shell: '1440px',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};

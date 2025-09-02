/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        '24': 'repeat(24, minmax(0, 1fr))',
      },
      colors: {
        primary: {
          500: '#6366F1',
          600: '#4F46E5',
        },
        accent: {
          500: '#10B981',
        },
        danger: {
          500: '#EF4444',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          900: '#111827',
        },
        white: '#FFFFFF',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      fontSize: {
        h1: ['32px', '40px'],
        h2: ['24px', '32px'],
        h3: ['20px', '28px'],
        bodylg: ['16px', '24px'],
        bodysm: ['14px', '20px'],
        caption: ['12px', '16px'],
      },
      borderRadius: {
        lg: '8px',
        sm: '2px',
      },
      boxShadow: {
        dashboard: '0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.06)',
      },
      spacing: {
        4: '4px',
        8: '8px',
        16: '16px',
        24: '24px',
        32: '32px',
        48: '48px',
        64: '64px',
      },
      screens: {
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
    },
  },
  plugins: [],
}

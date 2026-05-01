/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        rose: {
          DEFAULT: '#C8839C',
          soft: '#E5C2CC',
          deep: '#A65F7A'
        },
        cream: '#FAF7F5',
        ink: '#1C1C1E',
        ash: '#8E8E93',
        hairline: '#E5E5EA'
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      boxShadow: {
        sheet: '0 -8px 32px rgba(0,0,0,0.12)',
        card: '0 1px 3px rgba(0,0,0,0.06)'
      }
    }
  },
  plugins: []
};

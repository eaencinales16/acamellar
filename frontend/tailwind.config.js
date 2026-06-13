export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ocean: {
          50:  '#eef7fb',
          100: '#d4ecf5',
          200: '#a8d8ea',
          300: '#72bedb',
          400: '#2E86AB',
          500: '#1d6f91',
          600: '#155a77',
          700: '#0f445c',
          800: '#0a2e40',
          900: '#061a25',
        },
        sand: {
          50:  '#fdfaf5',
          100: '#f9f2e4',
          200: '#f2e4c8',
          300: '#e8d0a3',
          400: '#d4a96a',
          500: '#c9906a',  /* driftwood */
          600: '#b07040',
          700: '#8a5530',
          800: '#6b4025',
          900: '#4a2a16',
        },
        seafoam: {
          50:  '#f0f8f5',
          100: '#d6ede6',
          200: '#b8d4c8',  /* sea glass */
          300: '#8ebfb0',
          400: '#5ea396',
          500: '#3d8a7c',
          600: '#2d6e63',
          700: '#1f524a',
          800: '#133832',
          900: '#091f1b',
        },
        coral: {
          50:  '#fdf2ef',
          100: '#fae0d8',
          200: '#f4bfb0',
          300: '#ed9a88',
          400: '#e8927c',
          500: '#d9674f',
          600: '#b84e38',
          700: '#8f3a28',
          800: '#67281a',
          900: '#3e170e',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'coastal-gradient': 'linear-gradient(135deg, #0a2e40 0%, #155a77 30%, #2E86AB 60%, #5ea396 85%, #b8d4c8 100%)',
        'shore-gradient':   'linear-gradient(180deg, #eef7fb 0%, #fdfaf5 100%)',
        'wave-gradient':    'linear-gradient(135deg, #1d6f91 0%, #3d8a7c 50%, #5ea396 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'wave':  'wave 8s linear infinite',
        'fade-up': 'fadeUp 0.6s ease-out both',
      },
      keyframes: {
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        wave:    { '0%': { backgroundPosition: '0% 50%' }, '100%': { backgroundPosition: '100% 50%' } },
        fadeUp:  { '0%': { opacity: 0, transform: 'translateY(20px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
      },
    }
  },
  plugins: []
};

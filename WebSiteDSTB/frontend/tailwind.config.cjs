module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: { 
    extend: {
      // Mobile-first breakpoints (Tailwind default is already mobile-first)
      screens: {
        'xs': '475px',
        // sm: '640px' (default)
        // md: '768px' (default) 
        // lg: '1024px' (default)
        // xl: '1280px' (default)
      },
      // Touch-friendly sizing
      spacing: {
        'touch': '44px', // minimum touch target size
      },
      fontSize: {
        'xs-mobile': '0.75rem',
        'sm-mobile': '0.875rem',
      }
    } 
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}",
  ],
  theme: {
    extend: {
      scrollSnapType: {
        mandatory: 'mandatory',
        'y-mandatory': 'y mandatory',
      },
      scrollSnapAlign: {
        start: 'start',
      },
    },
  },
  plugins: [],
}



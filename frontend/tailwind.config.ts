import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'goldenrod-lightest': '#f9dcaf',
        'goldenrod-lighter': '#ffce83',
        'goldenrod-md': '#f4b455',
        'goldenrod-darker': '#b78437',
        'goldenrod-darkest': '#885a14'
      }
    },
  },
  plugins: [],
}
export default config

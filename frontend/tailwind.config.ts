import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#e20a05',
          'primary-dark': '#b80804',
          accent: '#eadb08',
          'accent-dark': '#c9ba07',
        },
      },
    },
  },
  plugins: [],
}

export default config

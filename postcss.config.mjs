/**
 * Tailwind CSS v4 runs through PostCSS in Next.js.
 * Without this file nothing in globals.css is processed and the app
 * renders completely unstyled.
 */
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

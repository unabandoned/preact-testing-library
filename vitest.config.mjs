import { defineConfig } from 'vitest/config'

export default defineConfig({
  // The sources and tests write JSX with Preact's classic `h` pragma in .js files.
  oxc: {
    include: /\.js$/,
    exclude: /node_modules/,
    lang: 'jsx',
    jsx: { runtime: 'classic', pragma: 'h', pragmaFrag: 'Fragment', development: false }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/__tests__/**/*.js'],
    setupFiles: ['./vitest.setup.mjs']
  }
})

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
    setupFiles: ['./vitest.setup.mjs'],
    // The peer range covers Preact 10 and 11, which subscribe event listeners
    // differently, so the whole suite runs against both majors.
    projects: [
      { extends: true, test: { name: 'preact-11' } },
      {
        extends: true,
        test: {
          name: 'preact-10',
          // Inline Preact so its own internal `preact` imports go through the alias too.
          server: { deps: { inline: [/node_modules\/preact-10\//] } }
        },
        resolve: { alias: [{ find: /^preact(?=\/|$)/, replacement: 'preact-10' }] }
      }
    ]
  }
})

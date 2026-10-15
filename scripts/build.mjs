// Compiles src/ into the two shapes package.json#exports ships:
// dist/cjs/*.js (CommonJS) and dist/esm/*.mjs (ES modules). Files are emitted
// one-to-one rather than bundled, so `index` and `pure` share a single module
// instance (and a single set of mounted containers) at runtime.
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { build } from 'esbuild'

const entryPoints = readdirSync('src')
  .filter((f) => f.endsWith('.js'))
  .map((f) => `src/${f}`)

const common = {
  entryPoints,
  bundle: false,
  platform: 'neutral',
  target: 'es2020',
  loader: { '.js': 'jsx' },
  jsx: 'transform',
  jsxFactory: 'h',
  jsxFragment: 'Fragment',
  logLevel: 'warning'
}

rmSync('dist', { recursive: true, force: true })

await build({ ...common, format: 'cjs', outdir: 'dist/cjs' })
await build({
  ...common,
  format: 'esm',
  outdir: 'dist/esm',
  outExtension: { '.js': '.mjs' }
})

// Unbundled ESM keeps the source's extensionless relative specifiers
// ('./pure'), which Node's ESM resolver rejects; point them at the .mjs files.
for (const f of readdirSync('dist/esm')) {
  const path = `dist/esm/${f}`
  const code = readFileSync(path, 'utf8')
  writeFileSync(path, code.replace(/(from\s+["'])(\.\.?\/[^"']+?)(["'])/g, (m, a, spec, b) =>
    /\.m?js$/.test(spec) ? m : `${a}${spec}.mjs${b}`))
}

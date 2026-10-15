// Loads the built package the way consumers do - through package.json#exports,
// with Node's own ESM and CommonJS resolvers - so a broken dist/ layout, a bad
// relative specifier in the .mjs output or a stale exports map fails CI.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const name = '@unabandoned/testing-library-preact'
const api = ['render', 'renderHook', 'cleanup', 'act', 'fireEvent', 'screen', 'waitFor', 'within']

for (const entry of [name, `${name}/pure`]) {
  const esm = await import(entry)
  const cjs = require(entry)
  for (const key of api) {
    assert.ok(esm[key], `${entry} (import) is missing ${key}`)
    assert.ok(cjs[key], `${entry} (require) is missing ${key}`)
  }
}

// index re-exports pure, so both entry points must share one module instance.
assert.equal((await import(name)).render, (await import(`${name}/pure`)).render)
assert.equal(require(name).render, require(`${name}/pure`).render)

// The opt-out entry and the legacy root `pure.js` shim (for resolvers that ignore
// `exports`) must load too.
require(`${name}/dont-cleanup-after-each`)
assert.equal(process.env.PTL_SKIP_AUTO_CLEANUP, 'true')
assert.equal(require('../pure.js').render, require(name).render)

// Everything package.json points at has to be in the tarball.
// (npm <= 11 prints an array of results, npm 12 an object keyed by package name.)
const report = JSON.parse(
  execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { encoding: 'utf8' })
)
const packed = new Set(
  (Array.isArray(report) ? report[0] : Object.values(report)[0]).files.map((f) => f.path)
)
const pkg = require('../package.json')
const exportTargets = (node) =>
  typeof node === 'string' ? [node] : Object.values(node).flatMap(exportTargets)
const targets = [pkg.main, pkg.module, pkg.types, 'pure.js', 'pure.d.ts', 'types/pure.d.ts',
  ...exportTargets(pkg.exports)]
for (const t of targets) {
  assert.ok(packed.has(t.replace(/^\.\//, '')), `${t} is not in the packed tarball`)
}

console.log('smoke: ok')

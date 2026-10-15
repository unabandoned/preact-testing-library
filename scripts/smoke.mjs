// Loads the built package the way consumers do - through package.json#exports,
// with Node's own ESM and CommonJS resolvers - so a broken dist/ layout, a bad
// relative specifier in the .mjs output or a stale exports map fails CI.
import assert from 'node:assert/strict'
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

console.log('smoke: ok')

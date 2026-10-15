import { fireEvent as domFireEvent, createEvent } from '@testing-library/dom'
import { h, options, render } from 'preact'

let isCompat = false

//  Detects if preact/compat is used
const oldHook = options.vnode
options.vnode = (vnode) => {
  if (vnode.$$typeof) isCompat = true
  if (oldHook) oldHook(vnode)
}

// Matches the behavior of `preact/compat`:
// https://github.com/preactjs/preact/blob/2459326755dea9ad6184b42bda1128c5004b8544/compat/src/render.js#L173-L175
// https://github.com/preactjs/preact/blob/2459326755dea9ad6184b42bda1128c5004b8544/compat/src/render.js#L36-L37
const maybeAliasKey = (key, elem) => {
  if (
    key === 'change' &&
    (elem.tagName === 'INPUT' || elem.tagName === 'TEXTAREA') &&
    !/fil|che|rad/.test(elem.type)
  ) {
    return 'input'
  }

  return key;
}

// Preact 10 subscribes `onAnimationEnd` to "AnimationEnd" when the element has no
// `onanimationend` property (as in jsdom), so we used to fire the PascalCase type.
// Preact 11 always lowercases the name ("animationend"), the type the DOM and DTL use.
// Probe once which convention the installed Preact follows.
let listensLowerCase
const preactListensLowerCase = (elem) => {
  if (listensLowerCase === undefined) {
    const doc = elem.ownerDocument
    const container = doc.createElement('div')
    let hit = false
    render(h('div', { onPtlProbe: () => { hit = true } }), container)
    container.firstChild.dispatchEvent(new doc.defaultView.Event('ptlprobe'))
    render(null, container)
    listensLowerCase = hit
  }
  return listensLowerCase
}

// Similar to RTL we make are own fireEvent helper that just calls DTL's fireEvent with that
// we can that any specific behaviors to the helpers we need
export const fireEvent = (...args) => domFireEvent(...args)

Object.keys(domFireEvent).forEach((key) => {
  fireEvent[key] = (elem, init) => {
    // Preact registers event-listeners in lower-case, so onPointerStart becomes pointerStart
    // here we will copy this behavior, when we fire an element we will fire it in lowercase so
    // we hit the Preact listeners.
    const eventName = `on${key.toLowerCase()}`
    const isInElem = eventName in elem

    // Preact aliases some change events when using `preact/compat` to mirror React's behavior
    const maybeAliasedKey = !isCompat ? key : maybeAliasKey(key, elem)

    return isInElem || preactListensLowerCase(elem)
      ? domFireEvent[maybeAliasedKey](elem, init)
      : domFireEvent(
        elem,
        createEvent(maybeAliasedKey[0].toUpperCase() + maybeAliasedKey.slice(1), elem, init)
      )
  }
})

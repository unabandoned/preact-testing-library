// Compile-only checks for types/index.d.ts and pure.d.ts (`npm run test:types`).
import { h, ComponentChildren, createContext } from 'preact'
import { useContext } from 'preact/hooks'
import { render, renderHook, screen, fireEvent } from '@unabandoned/testing-library-preact'
import { render as pureRender, cleanup } from '@unabandoned/testing-library-preact/pure'

const Theme = createContext('light')

// A wrapper typed the usual way, with optional ComponentChildren.
function Provider ({ children }: { children?: ComponentChildren }) {
  return <Theme.Provider value="dark">{children}</Theme.Provider>
}

const result = render(<div>hi</div>, { wrapper: Provider, hydrate: false })
const unmounted: void = result.unmount()
result.debug()
result.debug([result.container], 100, { highlight: false })
result.rerender(<div>bye</div>)
fireEvent.click(screen.getByText('hi'))

const hook = renderHook(() => useContext(Theme), { wrapper: Provider })
const theme: string = hook.result.current
hook.rerender()

pureRender(<span />)
cleanup()

// @ts-expect-error wrapper must be a component, not an element
render(<div />, { wrapper: <Provider /> })

export { unmounted, theme }

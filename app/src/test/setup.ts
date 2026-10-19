import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'
import { toHaveNoViolations } from 'jest-axe'
import { MotionGlobalConfig } from 'motion/react'
import { server } from '@/test/server'

expect.extend(toHaveNoViolations)

// The first visit to a lazy page compiles its whole module chain, which can take a few seconds.
configure({ asyncUtilTimeout: 8000 })

// Animations finish instantly so tests are deterministic (animations.md §7).
MotionGlobalConfig.skipAnimations = true

// jsdom has no native <dialog> behaviour, so open/close are mimicked.
HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
  this.removeAttribute('open')
  this.dispatchEvent(new Event('close'))
}

Element.prototype.scrollIntoView = jest.fn()

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
})

class ResizeObserverStub {
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()
}
window.ResizeObserver = ResizeObserverStub

// jsdom predates AbortSignal.timeout / any, which the HTTP client uses.
if (typeof AbortSignal.timeout !== 'function') {
  AbortSignal.timeout = (ms: number) => {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), ms).unref()
    return controller.signal
  }
}
if (typeof AbortSignal.any !== 'function') {
  AbortSignal.any = (signals: AbortSignal[]) => {
    const controller = new AbortController()
    signals.forEach((signal) => signal.addEventListener('abort', () => controller.abort(), { once: true }))
    return controller.signal
  }
}

// A console.error during a test is a bug in the test or the code (testing.md §9).
let consoleError: jest.SpyInstance
beforeEach(() => {
  consoleError = jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    throw new Error(`console.error called: ${args.map(String).join(' ')}`)
  })
})
afterEach(() => {
  consoleError.mockRestore()
})

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

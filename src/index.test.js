/**
 * @jest-environment jsdom
 */

import 'regenerator-runtime/runtime'
import {
  reset,
  makeContainer,
  isNewCustomTag,
  fetchMarkUp,
  injectMarkUp,
  activateScripts
  // parseElement,
  // getPath,
  // monitorElements,
  // chips,
} from './index'

const originalFetch = global.fetch
const originalConsole = global.console
const resetDocument = () => {
  reset()
  global.fetch = originalFetch
  global.console = originalConsole
  document.body.innerHTML = ''
}

const setFetch = (result, pass = 'resolve') => {
  global.fetch = jest.fn(() => {
    if (pass === 'error') throw new Error('error')
    return {
      resolve: Promise.resolve(result),
      reject: Promise.reject(result)
    }[pass]
  })
}

beforeEach(() => resetDocument())

describe('Tests makeContainer()', () => {
  it('creates new container', () => {
    makeContainer('testing')
    expect(document.body.innerHTML).toBe('<div id="testing"></div>')
  })
})

describe('Tests isNewCustomTag()', () => {
  it('recognizes a new custom tag', () => {
    const called = isNewCustomTag('test-component')
    expect(called).toBe(true)
  })
  it('recognizes a repeated custom tag', () => {
    reset({ loadedTags: ['test-component'] })
    const called = isNewCustomTag('test-component')
    expect(called).toBe(false)
  })
  it('recognizes a non-custom tag', () => {
    const called = isNewCustomTag('component')
    expect(called).toBe(false)
  })
})

describe('Tests fetchMarkUp', () => {
  it('fetches markup', async () => {
    setFetch({
      text: () => Promise.resolve('<p>test</p>')
    })
    const html = await fetchMarkUp('test-component', 'https://example.com')
    expect(html).toBe('<p>test</p>')
  })
  it('fails fetching markup', async () => {
    global.console = { warn: jest.fn() }
    setFetch(
      {
        text: () => Promise.resolve('<p>test</p>')
      },
      'error'
    )
    await fetchMarkUp('test-component', 'https://example.com')
    expect(console.warn).toBeCalled()
  })
})

describe('Tests injectMarkUp', () => {
  it('returns the correct injected mark up', () => {
    const markUp = '<p>testing</p>'
    const returnedInjection = injectMarkUp(markUp)
    const html = returnedInjection.children[0].outerHTML
    expect(html).toBe('<p>testing</p>')
  })
  it('deals with lack of markUp', () => {
    const markUp = ''
    const returnedInjection = injectMarkUp(markUp)
    expect(returnedInjection).toBe(false)
  })
})

describe('Tests activateScripts', () => {
  it('ignores lack of fragment', () => {
    const returnedValue = activateScripts()
    expect(returnedValue).toBe(null)
  })
  it('runs scripts inside fragment', () => {
    let added = 0
    let removed = 0
    const markUpFragment = document.createDocumentFragment()
    const containerScript = document.createElement('script')
    markUpFragment.appendChild(containerScript)

    const callback = (mutations) =>
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) added += 1
        if (mutation.removedNodes.length) removed += 1
      })
    const mutationObserver = new MutationObserver(callback)

    mutationObserver.observe(markUpFragment, {
      childList: true
    })

    activateScripts(markUpFragment)

    setTimeout(() => {
      mutationObserver.disconnect()
      expect(added).toBe(1)
      expect(removed).toBe(1)
    }, 100)
  })
})

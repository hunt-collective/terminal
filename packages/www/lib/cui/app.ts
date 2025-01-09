import { callback, getToken } from './auth'
import { combineLines, dimensions } from './render'
import { setRenderCallback } from './hooks'
import { App as Root } from './root'
import { initializeTerminal } from './terminal'
import { logger } from './logging'

export class App {
  private last: string = ''

  constructor() {
    // Register render callback for hooks
    setRenderCallback(this.render.bind(this))
    this.render()
  }

  render() {
    const lines = Root()({ width: dimensions.width })
    const { text, styles } = combineLines(lines)
    const key = text + JSON.stringify(styles)

    if (key === this.last) return

    console.clear()
    console.log(text + logger.formatLogs(), ...styles)
    this.last = key
  }
}

// Auto-initialize when script loads
;(async () => {
  // Handle auth callback if present
  const hash = new URLSearchParams(location.search.slice(1))
  const code = hash.get('code')
  const state = hash.get('state')

  if (code && state) {
    await callback(code, state)
  }

  const token = await getToken()
  if (!token) {
    console.error('Sign in to access the console shop')
    return
  }

  await initializeTerminal()
  // Create app instance
  const app = new App()
  // @ts-expect-error
  window.app = app
})()

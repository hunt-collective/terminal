import { auth, callback } from './auth'
import { TerminalSplash } from './splash'

// Initialize authentication
const hash = new URLSearchParams(location.search.slice(1))
const code = hash.get('code')
const state = hash.get('state')

async function init() {
  if (code && state) await callback(code, state)

  const token = await auth()
  if (!token) {
    // console.error('Sign in to access the console shop')
    return
  }

  // Start splash screen
  const splash = new TerminalSplash(3000)
  splash.setDimensions(80, 20)
  splash.start()
}

init()

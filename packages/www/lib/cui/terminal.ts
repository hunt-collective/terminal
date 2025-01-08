import Terminal from '@terminaldotshop/sdk'
import { createContext } from './context'
import { API_URL, getToken } from './auth'

// Context for the Terminal SDK client
export const TerminalContext = createContext<Promise<Terminal>>()

// Helper hook to get Terminal client
export function useTerminal() {
  const [client] = TerminalContext.useContext()
  return client
}

// Initialize Terminal client
export async function initializeTerminal() {
  const promise = new Promise<Terminal>(async (resolve) => {
    const token = await getToken()
    if (!token) throw new Error('No access token available')

    const client = new Terminal({
      bearerToken: token,
      baseURL: API_URL,
    })
    resolve(client)
  })

  TerminalContext.Provider(promise)
  return promise
}

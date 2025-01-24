import Terminal from '@terminaldotshop/sdk'
import { createContext, useContext } from 'react'

export const TerminalContext = createContext<
  (() => Promise<Terminal | undefined>) | undefined
>(undefined)

export function useTerminal() {
  const client = useContext(TerminalContext)
  return client!()
}

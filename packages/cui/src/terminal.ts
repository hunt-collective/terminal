import Terminal from "@terminaldotshop/sdk"
import { createContext } from "@textjs/core/context"

export const TerminalContext = createContext<Promise<Terminal>>()

export function useTerminal() {
  const [client] = TerminalContext.useContext()
  return client
}

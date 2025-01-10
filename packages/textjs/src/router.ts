import { createContext } from "./context"
import { useState } from "./hooks/index"
import { useKeyboardManager } from "./keyboard"

export type Route = string
export type Router<T extends Route> = {
  route: T
  navigate: (to: T) => void
}

export const RouterContext = createContext<Router<any>>()

export function createRouter<T extends Route>(initial?: T) {
  const keyboardManager = useKeyboardManager()
  const [route, setRoute] = useState<T>(initial)
  const navigate = (to: T) => {
    keyboardManager.setCurrentRoute(to)
    setRoute(to)
  }

  keyboardManager.setCurrentRoute(route)
  return { route, navigate }
}

export function useRouter<T extends Route>() {
  const [router] = RouterContext.useContext()
  return router as Router<T>
}

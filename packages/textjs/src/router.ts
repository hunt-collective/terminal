import React, { createContext, useContext } from "react"
import { useKeyboardManager } from "./keyboard"

export type Route = string
export type Router<T extends Route> = {
  route: T
  navigate: (to: T) => void
}

export const RouterContext = createContext<Router<any> | undefined>(undefined)

export function createRouter<T extends Route>(initial?: T) {
  const [route, setRoute] = React.useState<T>(initial)
  const keyboardManager = useKeyboardManager()
  const navigate = (to: T) => {
    keyboardManager.setCurrentRoute(to)
    setRoute(to)
  }

  keyboardManager.setCurrentRoute(route)
  return { route, navigate }
}

export function useRouter<T extends Route>() {
  const router = useContext(RouterContext)
  return router as Router<T>
}

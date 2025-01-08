import { createContext } from './context'
import { useState } from './hooks'

export type Route =
  | 'shop'
  | 'cart'
  | 'account'
  | 'splash'
  | 'shipping'
  | 'payment'
  | 'confirm'
  | 'final'

interface RouterContextValue {
  route: Route
  navigate: (to: Route) => void
}

export const RouterContext = createContext<RouterContextValue>()

export function createRouter() {
  const [route, setRoute] = useState<Route>('splash')
  const navigate = (to: Route) => {
    setRoute(to)
  }
  return { route, navigate }
}

export function useRouter() {
  const [router] = RouterContext.useContext()
  return router
}

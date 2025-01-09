import { createContext } from './context'
import type { Route } from './router'

type KeyHandler = (event: KeyboardEvent) => void

interface HandlerRegistration {
  keys?: string[]
  handler: KeyHandler
  priority?: number
  stopPropagation?: boolean
}

interface KeyboardManager {
  currentRoute: Route | null
  setCurrentRoute(route: Route): void
  setRouteHandlers(route: Route, handlers: HandlerRegistration[]): void
  setModalHandlers(handlers: HandlerRegistration[] | null): void
  setGlobalHandlers(handlers: HandlerRegistration[]): void
  getRouteHandlers: (route: Route) => HandlerRegistration[] | undefined
  getModalHandlers: () => HandlerRegistration[] | null
  getGlobalHandlers: () => HandlerRegistration[]
}

export const KeyboardContext = createContext<KeyboardManager>()

// Single event handler function stored at module level
let activeManager: KeyboardManager | null = null
const handleKeyEvent = (event: KeyboardEvent) => {
  const manager = activeManager
  if (!manager) return

  // Priority order: Modal > Route > Global
  const modalHandlers = manager.getModalHandlers()
  const routeHandlers = manager.currentRoute
    ? manager.getRouteHandlers(manager.currentRoute)
    : null
  const globalHandlers = manager.getGlobalHandlers()

  // Process handlers in priority order, stopping if propagation is stopped
  const processHandlers = (handlers: HandlerRegistration[]) => {
    for (const { keys, handler, stopPropagation } of handlers) {
      if (
        !keys ||
        keys.some((k) => k.toLowerCase() === event.key.toLowerCase())
      ) {
        handler(event)
        if (stopPropagation) return true
      }
    }
    return false
  }

  if (modalHandlers?.length) {
    if (processHandlers(modalHandlers)) return
  }

  if (routeHandlers?.length) {
    if (processHandlers(routeHandlers)) return
  }

  if (globalHandlers?.length) {
    processHandlers(globalHandlers)
  }
}

function createManager(): KeyboardManager {
  const routeHandlers = new Map<Route, HandlerRegistration[]>()
  const globalHandlers: HandlerRegistration[] = []
  let modalHandlers: HandlerRegistration[] | null = null
  let currentRoute: Route | null = null

  return {
    get currentRoute() {
      return currentRoute
    },

    setCurrentRoute(route: Route) {
      currentRoute = route
      modalHandlers = null // Clear modal handlers on route change
    },

    setRouteHandlers(route: Route, handlers: HandlerRegistration[]) {
      routeHandlers.set(route, handlers)
    },

    setModalHandlers(handlers: HandlerRegistration[] | null) {
      modalHandlers = handlers
    },

    setGlobalHandlers(handlers: HandlerRegistration[]) {
      globalHandlers.length = 0
      globalHandlers.push(...handlers)
    },

    getRouteHandlers(route: Route) {
      return routeHandlers.get(route) || []
    },

    getModalHandlers() {
      return modalHandlers || []
    },

    getGlobalHandlers() {
      return globalHandlers
    },
  }
}

export function initializeKeyboardManager(): KeyboardManager {
  if (activeManager) return activeManager

  const manager = createManager()
  activeManager = manager
  window.addEventListener('keydown', handleKeyEvent)

  return manager
}

export function useKeyboardHandlers(
  route: Route,
  registrations: HandlerRegistration | HandlerRegistration[],
) {
  const [manager] = KeyboardContext.useContext()
  const handlers = Array.isArray(registrations)
    ? registrations
    : [registrations]
  manager.setRouteHandlers(route, handlers)
}

export function useModalKeyboardHandlers(
  registrations: HandlerRegistration | HandlerRegistration[] | null,
) {
  const [manager] = KeyboardContext.useContext()
  const handlers = registrations
    ? Array.isArray(registrations)
      ? registrations
      : [registrations]
    : null
  manager.setModalHandlers(handlers)
}

export function useGlobalKeyboardHandlers(
  registrations: HandlerRegistration | HandlerRegistration[],
) {
  const [manager] = KeyboardContext.useContext()
  const handlers = Array.isArray(registrations)
    ? registrations
    : [registrations]
  manager.setGlobalHandlers(handlers)
}

export type { HandlerRegistration }

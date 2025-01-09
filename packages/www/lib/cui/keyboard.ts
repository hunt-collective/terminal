import { createContext } from './context'
import type { Route } from './router'

type KeyHandler = (event: KeyboardEvent) => boolean | void

interface HandlerRegistration {
  keys?: string[]
  handler: KeyHandler
}

interface KeyboardManager {
  currentRoute: Route | null
  handlerStack: HandlerRegistration[][]
  setCurrentRoute(route: Route): void
  setRouteHandlers(route: Route, handlers: HandlerRegistration[]): void
  pushModalHandlers(handlers: HandlerRegistration[]): void
  popModalHandlers(): void
  setGlobalHandlers(handlers: HandlerRegistration[]): void
}

export const KeyboardContext = createContext<KeyboardManager>()

let activeManager: KeyboardManager | null = null

const handleKeyEvent = (event: KeyboardEvent) => {
  if (
    document.activeElement instanceof HTMLInputElement ||
    document.activeElement instanceof HTMLTextAreaElement ||
    (document.activeElement instanceof HTMLElement &&
      document.activeElement.isContentEditable)
  )
    return

  const manager = activeManager
  if (!manager) return

  for (const handlers of manager.handlerStack) {
    for (const { keys, handler } of handlers) {
      if (
        !keys ||
        keys.some((k) => k.toLowerCase() === event.key.toLowerCase())
      ) {
        // If handler returns true, stop propagation
        if (handler(event) === true) {
          event.preventDefault()
          return
        }
      }
    }
  }
}

function createManager(): KeyboardManager {
  const routeHandlers = new Map<Route, HandlerRegistration[]>()
  const globalHandlers: HandlerRegistration[] = []
  const modalStack: HandlerRegistration[][] = []
  let currentRoute: Route | null = null

  const manager: KeyboardManager = {
    get currentRoute() {
      return currentRoute
    },

    get handlerStack() {
      const stack = [...modalStack]
      if (currentRoute) {
        const routeHandlerList = routeHandlers.get(currentRoute)
        if (routeHandlerList) stack.push(routeHandlerList)
      }
      if (globalHandlers.length) stack.push(globalHandlers)
      return stack
    },

    setCurrentRoute(route: Route) {
      currentRoute = route
      modalStack.length = 0 // Clear modal stack on route change
    },

    setRouteHandlers(route: Route, handlers: HandlerRegistration[]) {
      routeHandlers.set(route, handlers)
    },

    pushModalHandlers(handlers: HandlerRegistration[]) {
      modalStack.push(handlers)
    },

    popModalHandlers() {
      modalStack.pop()
    },

    setGlobalHandlers(handlers: HandlerRegistration[]) {
      globalHandlers.length = 0
      globalHandlers.push(...handlers)
    },
  }

  return manager
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

export function useModalHandlers(
  registrations: HandlerRegistration | HandlerRegistration[],
) {
  const [manager] = KeyboardContext.useContext()
  const handlers = Array.isArray(registrations)
    ? registrations
    : [registrations]
  manager.pushModalHandlers(handlers)
  return () => manager.popModalHandlers()
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

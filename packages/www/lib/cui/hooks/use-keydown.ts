import { useEffect, currentComponent, hookIndex } from '.'

const keydownHandlers = new Map<string, (event: KeyboardEvent) => void>()

export function useKeydown(
  keysOrHandler:
    | KeyboardEvent['key']
    | KeyboardEvent['key'][]
    | ((event: KeyboardEvent) => void),
  maybeHandler?: (event: KeyboardEvent) => void,
) {
  const currentHookIndex = hookIndex
  const handlerId = `${currentComponent}-${currentHookIndex}`

  // Parse arguments to determine keys and handler
  const keys = typeof keysOrHandler === 'function' ? undefined : keysOrHandler
  const handler =
    typeof keysOrHandler === 'function' ? keysOrHandler : maybeHandler

  if (!handler) throw new Error('Handler is required')
  keydownHandlers.set(handlerId, handler)

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement instanceof HTMLSpanElement
      )
        return

      // If no keys specified, or if key matches
      if (
        !keys ||
        (Array.isArray(keys)
          ? keys.some((k) => e.key.toLowerCase() === k.toLowerCase())
          : e.key.toLowerCase() === keys.toLowerCase())
      ) {
        const currentHandler = keydownHandlers.get(handlerId)
        if (currentHandler) {
          currentHandler(e)
        }
      }
    }
    window.addEventListener('keydown', listener)
    return () => {
      window.removeEventListener('keydown', listener)
      keydownHandlers.delete(handlerId)
    }
  })
}

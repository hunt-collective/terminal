// Global state for hooks
const states = new Map<number, any[]>()
const effects = new Map<number, Array<() => void | (() => void)>>()
let currentComponent = 0
let hookIndex = 0

export function useState<T>(
  initial: T,
): [T, (valueOrFn: T | ((prev: T) => T)) => void] {
  const componentId = currentComponent
  const stateIndex = hookIndex++

  // Initialize state array for this component if needed
  if (!states.has(componentId)) {
    states.set(componentId, [])
  }
  const state = states.get(componentId)!

  // Initialize this state slot if needed
  if (state[stateIndex] === undefined) {
    state[stateIndex] = initial
  }

  const setValue = (valueOrFn: T | ((prev: T) => T)) => {
    const state = states.get(componentId)!
    const nextValue =
      typeof valueOrFn === 'function'
        ? (valueOrFn as (prev: T) => T)(state[stateIndex])
        : valueOrFn
    state[stateIndex] = nextValue
    triggerRender()
  }

  return [state[stateIndex], setValue]
}

export function useEffect(effect: () => void | (() => void)) {
  const componentId = currentComponent
  const effectIndex = hookIndex++

  if (!effects.has(componentId)) {
    effects.set(componentId, [])
  }

  // Store and run the effect if it's new
  const componentEffects = effects.get(componentId)!
  if (!componentEffects[effectIndex]) {
    const cleanup = effect()
    componentEffects[effectIndex] = effect
    if (cleanup) {
      const prevCleanup = cleanup
      componentEffects[effectIndex] = () => {
        prevCleanup()
        return effect()
      }
    }
  }
}

export function useKeydown(key: string, handler: () => void) {
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === key.toLowerCase()) {
        handler()
      }
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  })
}

let renderCallback: (() => void) | null = null

export function setRenderCallback(callback: () => void) {
  renderCallback = callback
}

const triggerRender = () => {
  if (renderCallback) {
    renderCallback()
  } else {
    console.warn('No render callback registered')
  }
}

export function prepareForRender(id: number) {
  currentComponent = id
  hookIndex = 0
}

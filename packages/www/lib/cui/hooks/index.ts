const states = new Map<number, any[]>()
const effects = new Map<number, Array<() => void | (() => void)>>()

export let currentComponent = 0
export let hookIndex = 0

export function useState<T>(
  initial: T | (() => T),
): [T, (valueOrFn: T | ((prev: T) => T)) => void] {
  const componentId = currentComponent
  const stateIndex = hookIndex++

  if (!states.has(componentId)) {
    states.set(componentId, [])
  }
  const state = states.get(componentId)!

  // Initialize this state slot if needed
  if (state[stateIndex] === undefined) {
    state[stateIndex] =
      typeof initial === 'function' ? (initial as () => T)() : initial
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

export * from './use-keydown'
export * from './use-query'
export * from './use-mutation'
export * from './use-cart'
export * from './use-profile'
export * from './use-products'
export * from './use-addresses'

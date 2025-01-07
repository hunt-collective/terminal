import { useState } from './hooks'

const contexts = new Map<symbol, any>()

export function createContext<T>(defaultValue?: T) {
  const key = Symbol()
  contexts.set(key, defaultValue)

  return {
    Provider: (value: T) => {
      contexts.set(key, value)
    },
    useContext: () => {
      const [, forceUpdate] = useState({})

      const getValue = () => contexts.get(key) as T
      const setValue = (newValue: T) => {
        contexts.set(key, newValue)
        forceUpdate({})
      }

      return [getValue(), setValue] as const
    },
  }
}

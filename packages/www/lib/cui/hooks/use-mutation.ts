import { useState, type QueryKey } from '.'

type MutationFn<T, V> = (variables: V) => Promise<T>

interface MutationConfig<T, V> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  optimisticUpdate?: (vars: V) => void
  rollback?: () => void
}

const mutationTimestamps = new Map<QueryKey, number>()

export function useMutation<T, V>(
  key: QueryKey,
  mutationFn: MutationFn<T, V>,
  config: MutationConfig<T, V> = {},
) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [, forceUpdate] = useState({})

  const mutate = async (variables: V) => {
    const timestamp = Date.now()
    mutationTimestamps.set(key, timestamp)

    setIsLoading(true)
    setError(null)

    try {
      config.optimisticUpdate?.(variables)
      // Force a re-render after optimistic update
      forceUpdate({})

      const data = await mutationFn(variables)

      // Only update if this is the most recent mutation
      if (mutationTimestamps.get(key) === timestamp) {
        config.onSuccess?.(data)
        setIsLoading(false)
        forceUpdate({})
      }

      return data
    } catch (err) {
      if (mutationTimestamps.get(key) === timestamp) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        setIsLoading(false)
        config.onError?.(error)
        config.rollback?.()
        forceUpdate({})
      }
      throw err
    }
  }

  return { mutate, isLoading, error }
}

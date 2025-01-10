import { useState, useEffect } from "./index"

export type QueryKey = string
type QueryFn<T> = () => Promise<T>

interface QueryConfig<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  enabled?: boolean
}

interface QueryState<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  timestamp: number
}

const activeQueries = new Set<QueryKey>()
const queryCache = new Map<QueryKey, QueryState<any>>()

const isStale = (timestamp: number, staleTime: number = 30000) => {
  return Date.now() - timestamp > staleTime
}

export function useQuery<T>(
  key: QueryKey,
  queryFn: QueryFn<T>,
  config: QueryConfig<T> = {},
) {
  const [state, setState] = useState<QueryState<T>>(() => {
    return (
      queryCache.get(key) || {
        data: null,
        isLoading: true,
        error: null,
        timestamp: 0,
      }
    )
  })

  useEffect(() => {
    // Prevent fetching if disabled, fresh data exists, or query is in progress
    if (
      config.enabled === false ||
      (state.data && !isStale(state.timestamp)) ||
      activeQueries.has(key)
    ) {
      return
    }

    activeQueries.add(key)
    setState((prev) => ({ ...prev, isLoading: true }))

    queryFn().then(
      (data) => {
        const newState = {
          data,
          isLoading: false,
          error: null,
          timestamp: Date.now(),
        }
        setState(newState)
        queryCache.set(key, newState)
        activeQueries.delete(key)
        config.onSuccess?.(data)
      },
      (err) => {
        const error = err instanceof Error ? err : new Error(String(err))
        setState((prev) => ({ ...prev, error, isLoading: false }))
        activeQueries.delete(key)
        config.onError?.(error)
      },
    )
  })

  return state
}

export function invalidateQuery(key: QueryKey) {
  const cached = queryCache.get(key)
  if (cached) {
    queryCache.set(key, { ...cached, timestamp: 0 })
  }
}

export function setQueryData<T>(key: QueryKey, data: T) {
  const cached = queryCache.get(key)
  if (cached) {
    queryCache.set(key, {
      ...cached,
      data,
      timestamp: Date.now(),
    })
  }
}

import { useTerminal } from '../terminal'
import { useQuery } from '@tanstack/react-query'

export function useProducts() {
  const promise = useTerminal()
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const client = await promise
      const { data } = await client!.product.list()
      return data
    },
  })
}

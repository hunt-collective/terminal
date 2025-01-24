import { useTerminal } from '../terminal'
import { useQuery } from '@tanstack/react-query'

export function useAddresses() {
  const promise = useTerminal()
  return useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const client = await promise
      const { data } = await client!.address.list()
      return data
    },
  })
}

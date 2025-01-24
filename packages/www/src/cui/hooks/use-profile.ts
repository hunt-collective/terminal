import { useTerminal } from '../terminal'
import { useQuery } from '@tanstack/react-query'

export function useProfile() {
  const promise = useTerminal()
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const client = await promise
      const { data } = await client!.profile.me()
      return data
    },
  })
}

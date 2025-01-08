import { TerminalContext } from '../terminal'
import { useQuery } from './use-query'

export function useProfile() {
  const [promise] = TerminalContext.useContext()
  return useQuery('profile', async () => {
    const client = await promise
    const { data } = await client.profile.me()
    return data
  })
}

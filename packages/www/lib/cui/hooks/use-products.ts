import { TerminalContext } from '../terminal'
import { useQuery } from './use-query'

export function useProducts() {
  const [promise] = TerminalContext.useContext()
  return useQuery('products', async () => {
    const client = await promise
    const { data } = await client.product.list()
    return data
  })
}

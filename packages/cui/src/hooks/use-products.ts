import { useQuery } from "@textjs/core"
import { TerminalContext } from "@/terminal"

export function useProducts() {
  const [promise] = TerminalContext.useContext()
  return useQuery("products", async () => {
    const client = await promise
    const { data } = await client.product.list()
    return data
  })
}

import { useQuery } from "@textjs/core"
import { TerminalContext } from "@/terminal"

export function useAddresses() {
  const [promise] = TerminalContext.useContext()
  return useQuery("addresses", async () => {
    const client = await promise
    const { data } = await client.address.list()
    return data
  })
}

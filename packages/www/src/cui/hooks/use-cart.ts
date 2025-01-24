import { useTerminal } from '../terminal'
import { useProducts } from '../hooks'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useCart() {
  const promise = useTerminal()
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const client = await promise
      const { data } = await client!.cart.get()
      return data
    },
  })
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient()
  const promise = useTerminal()
  const { data: cart } = useCart()
  const { data: products } = useProducts()

  return useMutation({
    mutationFn: async ({
      variantId,
      quantity,
    }: {
      variantId: string
      quantity: number
    }) => {
      const client = await promise
      const { data } = await client!.cart.setItem({
        productVariantID: variantId,
        quantity,
      })
      return data
    },
    onMutate: async ({ variantId, quantity }) => {
      if (!cart || !products) return

      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['cart'] })

      // Snapshot the previous value
      const previousCart = queryClient.getQueryData(['cart'])

      const product = products.find((p) =>
        p.variants.find((v) => v.id === variantId),
      )
      const variant = product?.variants.find((v) => v.id === variantId)
      if (!variant) return

      const item = cart.items.find((i) => i.productVariantID === variantId)
      const newQuantity = Math.max(quantity, 0)

      // Optimistic update
      if (item) {
        item.quantity = newQuantity
        item.subtotal = variant.price * newQuantity

        if (item.quantity === 0) {
          const index = cart.items.indexOf(item) ?? 0
          cart.items.splice(index, 1)
          // cart.selected = Math.max(index - 1, 0)
        }
      } else {
        cart.items.push({
          id: '',
          productVariantID: variant.id,
          quantity: newQuantity,
          subtotal: variant.price * newQuantity,
        })
      }

      cart.subtotal = cart.items.reduce((acc, item) => acc + item.subtotal, 0)

      queryClient.setQueryData(['cart'], cart)

      // Return a context with the previous and new todo
      return { previousCart, newCart: cart }
    },
    onError: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })
}

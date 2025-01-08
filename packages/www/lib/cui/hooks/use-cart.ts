import { TerminalContext } from '../terminal'
import {
  invalidateQuery,
  setQueryData,
  useMutation,
  useProducts,
  useQuery,
} from '.'

export function useCart() {
  const [promise] = TerminalContext.useContext()
  return useQuery('cart', async () => {
    const client = await promise
    const { data } = await client.cart.get()
    return data
  })
}

export function useUpdateCartItem() {
  const [promise] = TerminalContext.useContext()
  const { data: cart } = useCart()
  const { data: products } = useProducts()

  return useMutation(
    'updateCart',
    async ({
      variantId,
      quantity,
    }: {
      variantId: string
      quantity: number
    }) => {
      const client = await promise
      const { data } = await client.cart.setItem({
        productVariantID: variantId,
        quantity,
      })
      return data
    },
    {
      optimisticUpdate: ({ variantId, quantity }) => {
        if (!cart || !products) return

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

        setQueryData('cart', cart)
      },
      onSuccess: (cart) => setQueryData('cart', cart),
      rollback: () => invalidateQuery('cart'),
    },
  )
}

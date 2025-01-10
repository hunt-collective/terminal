import { useCart, useProducts, useUpdateCartItem } from "@/hooks"
import { CheckoutLayout } from "@/layouts/checkout"
import type Terminal from "@terminaldotshop/sdk"
import { CartItemQuantity } from "@/components"
import { Component, useState } from "@textjs/core"
import { Box, Flex, Stack, Text } from "@textjs/core/components"
import { formatPrice, styles } from "@/styles"
import { useRouter } from "@textjs/core/router"
import { useKeyboardHandlers } from "@textjs/core/keyboard"

const CartItem = Component<{
  item: Terminal.Cart.Item
  product: Terminal.Product
  variant: Terminal.ProductVariant
  selected: boolean
}>(({ item, product, variant, selected }) => {
  return Box({
    padding: { x: 1, y: 0 },
    border: true,
    borderStyle: {
      color: selected ? styles.white : styles.gray,
    },
    children: Stack([
      Flex({
        justify: "between",
        children: [
          Text(product.name, selected ? styles.white : styles.gray),
          Flex({
            gap: 1,
            children: [
              CartItemQuantity({ item }),
              Text(formatPrice(item.subtotal).padStart(5), {
                style: styles.gray,
              }),
            ],
          }),
        ],
      }),
      variant ? Text(variant.name, styles.gray) : "",
    ]),
  })
})

export const CartPage = Component(() => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { data: cart } = useCart()
  const { data: products } = useProducts()
  const { navigate } = useRouter()
  const { mutate: updateItem } = useUpdateCartItem()

  useKeyboardHandlers("cart", [
    {
      keys: ["ArrowDown", "j"],
      handler: () => {
        if (!cart) return
        setSelectedIndex((prev) =>
          Math.min(prev + 1, Math.max(0, cart.items.length - 1)),
        )
      },
    },
    {
      keys: ["ArrowUp", "k"],
      handler: () => {
        setSelectedIndex((prev) => Math.max(0, prev - 1))
      },
    },
    {
      keys: ["+", "ArrowRight", "l"],
      handler: () => {
        if (!cart) return
        const item = cart.items[selectedIndex]
        if (item) {
          updateItem({
            variantId: item.productVariantID,
            quantity: item.quantity + 1,
          })
        }
      },
    },
    {
      keys: ["-", "ArrowLeft", "h"],
      handler: () => {
        if (!cart) return
        const item = cart.items[selectedIndex]
        if (item) {
          updateItem({
            variantId: item.productVariantID,
            quantity: Math.max(0, item.quantity - 1),
          })
        }
      },
    },
    {
      keys: ["Escape"],
      handler: () => navigate("shop"),
    },
    {
      keys: ["Enter", "c"],
      handler: () => navigate("shipping"),
    },
  ])

  if (!cart || !products) return Text("Loading...", styles.gray)

  return CheckoutLayout({
    current: "cart",
    children: [
      !cart.items.length
        ? Text("Your cart is empty", styles.gray)
        : Stack(
            cart.items.map((item, index) => {
              const product = products.find((p) =>
                p.variants.find((v) => v.id === item.productVariantID),
              )
              if (!product) return []

              const variant = product.variants.find(
                (v) => v.id === item.productVariantID,
              )
              if (!variant) return []

              return CartItem({
                item,
                product,
                variant,
                selected: index === selectedIndex,
              })
            }),
          ),
    ],
  })
})

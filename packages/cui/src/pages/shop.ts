import type Terminal from "@terminaldotshop/sdk"
import { styles, formatPrice } from "@/styles"
import { Box, Break, Flex, Stack, Text } from "@textjs/core/components"
import { Layout } from "@/layouts/base"
import { useProducts, useCart, useUpdateCartItem } from "../hooks"
import { CartItemQuantity } from "@/components"
import { Component, useState } from "@textjs/core"
import { useRouter } from "@textjs/core/router"
import { useKeyboardHandlers } from "@textjs/core/keyboard"

function ProductListItem(
  product: Terminal.Product,
  isSelected: boolean,
  highlightColor: string,
) {
  const style = isSelected
    ? { ...styles.white, background: highlightColor }
    : styles.gray

  return Box({
    padding: { x: 2, y: 0 },
    style: isSelected ? { background: highlightColor } : undefined,
    children: Text(product.name, { style }),
  })
}

function ProductSection(
  title: string,
  products: Terminal.Product[],
  selectedIndex: number,
  allProducts: Terminal.Product[],
  highlightColor: string,
) {
  return Stack([
    Text(`~ ${title} ~`, { style: styles.white }),
    ...products.map((product) => {
      const index = allProducts.findIndex((p) => p.id === product.id)
      return ProductListItem(product, index === selectedIndex, highlightColor)
    }),
  ])
}

function SubscriptionButton() {
  return Flex({
    gap: 1,
    children: [
      Text("subscribe", {
        color: "white",
        background: "#FF4800",
        padding: "0px 5px",
      }),
      Text("enter", styles.gray),
    ],
  })
}

function ProductDetails({
  product,
  cart,
  width,
  highlightColor,
}: {
  product: Terminal.Product
  cart: Terminal.Cart | undefined
  width: number
  highlightColor: string
}) {
  const variant = product.variants[0]
  const item = cart?.items.find((i) => i.productVariantID === variant.id) ?? {
    id: "",
    productVariantID: variant.id,
    quantity: 0,
    subtotal: 0,
  }

  return Box({
    padding: { x: 1, y: 0 },
    width,
    children: Stack([
      Text(product.name, { style: styles.white }),
      Stack({
        gap: 1,
        children: [
          Text(variant.name, { style: styles.gray }),
          Text(formatPrice(variant.price), {
            style: { color: highlightColor },
          }),
          Text(product.description, {
            style: styles.gray,
            maxWidth: width - 2,
          }),
          product.subscription === "required"
            ? SubscriptionButton()
            : CartItemQuantity({ item }),
        ],
      }),
    ]),
  })
}

function getHighlightColor(productName: string): string {
  switch (productName) {
    case "segfault":
      return "#169FC1"
    case "dark mode":
      return "#118B39"
    case "[object Object]":
      return "#F5BB1D"
    case "404":
      return "#D53C81"
    case "artisan":
      return "#EB4432"
    default:
      return "#FF5C00"
  }
}

export const ShopPage = Component(() => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const { data: products } = useProducts()
  const { data: cart } = useCart()
  const { mutate: updateItem } = useUpdateCartItem()

  useKeyboardHandlers("shop", [
    {
      keys: ["ArrowDown", "j"],
      handler: () => {
        if (!products) return
        setSelectedIndex((prev) => Math.min(prev + 1, products.length - 1))
      },
    },
    {
      keys: ["ArrowUp", "k"],
      handler: () => {
        setSelectedIndex((prev) => Math.max(0, prev - 1))
      },
    },
    {
      keys: ["ArrowRight", "l", "+"],
      handler: () => {
        if (!products || !cart) return
        const product = products[selectedIndex]
        if (product && product.subscription !== "required") {
          const variant = product.variants[0]
          const item = cart.items.find((i) => i.productVariantID === variant.id)
          updateItem({
            variantId: variant.id,
            quantity: (item?.quantity || 0) + 1,
          })
        }
      },
    },
    {
      keys: ["ArrowLeft", "h", "-"],
      handler: () => {
        if (!products || !cart) return
        const product = products[selectedIndex]
        if (product && product.subscription !== "required") {
          const variant = product.variants[0]
          const item = cart.items.find((i) => i.productVariantID === variant.id)
          if (item) {
            updateItem({
              variantId: variant.id,
              quantity: Math.max(0, item.quantity - 1),
            })
          }
        }
      },
    },
    {
      keys: ["Enter"],
      handler: () => router.navigate("cart"),
    },
  ])

  if (!products || !cart) return Text("loading...")

  const gap = 2
  const third = Math.floor(75 / 3)
  const listWidth = third
  const detailsWidth = third * 2 - gap

  const featured = products.filter((p) => p.tags?.featured === "true")
  const originals = products.filter((p) => p.tags?.featured !== "true")
  const selectedProduct = products[selectedIndex]
  const highlightColor = selectedProduct
    ? getHighlightColor(selectedProduct.name)
    : "#FF5C00"

  return Layout(
    Flex({
      gap,
      children: [
        Stack({
          width: listWidth,
          children: [
            ProductSection(
              "featured",
              featured,
              selectedIndex,
              products,
              highlightColor,
            ),
            Break(),
            ProductSection(
              "originals",
              originals,
              selectedIndex,
              products,
              highlightColor,
            ),
          ],
        }),
        ProductDetails({
          product: selectedProduct,
          cart: cart,
          width: detailsWidth,
          highlightColor,
        }),
      ],
    }),
  )
})

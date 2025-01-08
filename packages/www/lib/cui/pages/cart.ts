import type Terminal from '@terminaldotshop/sdk'
import type { Model } from '../app'
import { createPage, styles, formatPrice } from '../render'
import { Box, Flex, Stack, Text } from '../components'
import { CheckoutLayout } from '../layouts/checkout'

export type CartState = {
  selected: number
}

function updateSelectedItem(model: Model, previous: boolean) {
  let next: number
  if (previous) {
    next = model.state.cart.selected - 1
  } else {
    next = model.state.cart.selected + 1
  }

  if (next < 0) {
    next = 0
  }
  const max = (model.cart?.items.length ?? 0) - 1
  if (next > max) {
    next = max
  }

  return next
}

function CartItem(
  item: Terminal.CartResource.Cart.Item,
  selected: boolean,
  model: Model,
) {
  const product = model.products.find((p) =>
    p.variants.find((v) => v.id === item.productVariantID),
  )
  if (!product) return []

  const variant = product.variants.find((v) => v.id === item.productVariantID)

  return Box({
    padding: { x: 1, y: 0 },
    border: true,
    borderStyle: {
      color: selected ? styles.white : styles.gray,
    },
    children: Stack([
      Flex({
        justify: 'between',
        children: [
          Text(product.name, selected ? styles.white : styles.gray),
          Flex({
            children: [
              Text(selected ? '-' : ' ', styles.gray),
              Text(item.quantity.toString(), styles.white),
              Text(selected ? '+' : ' ', styles.gray),
              Text(formatPrice(item.subtotal), styles.gray),
            ],
            gap: 1,
          }),
        ],
      }),
      variant ? Text(variant.name, styles.gray) : '',
    ]),
  })
}

export const CartPage = createPage({
  name: 'cart',
  view: (model, state) => {
    return CheckoutLayout({
      current: 'cart',
      children: [
        !model.cart?.items.length
          ? Text('Your cart is empty', styles.gray)
          : Stack(
              model.cart.items.map((item, index) =>
                CartItem(item, index === state.selected, model),
              ),
            ),
      ],
    })
  },
  update: (msg, model) => {
    if (msg.type !== 'browser:keydown') return

    const { key } = msg.event
    const items = model.cart?.items || []
    const selectedItem = items[model.state.cart.selected]

    switch (key.toLowerCase()) {
      case 'arrowdown':
      case 'j':
        return { state: { selected: updateSelectedItem(model, false) } }

      case 'arrowup':
      case 'k':
        return { state: { selected: updateSelectedItem(model, true) } }

      case 'arrowright':
      case 'l':
      case '+':
        if (selectedItem) {
          return {
            message: {
              type: 'cart:quantity-updated',
              variantId: selectedItem.productVariantID,
              quantity: selectedItem.quantity + 1,
            },
          }
        }
        break

      case 'arrowleft':
      case 'h':
      case '-':
        if (selectedItem && selectedItem.quantity > 0) {
          return {
            message: {
              type: 'cart:quantity-updated',
              variantId: selectedItem.productVariantID,
              quantity: selectedItem.quantity - 1,
            },
          }
        }
        break

      case 'escape':
        return { message: { type: 'app:navigate', page: 'shop' } }

      case 'c':
      case 'enter':
        return { message: { type: 'app:navigate', page: 'shipping' } }
    }
  },
})

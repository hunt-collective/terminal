import type Terminal from '@terminaldotshop/sdk'
import type { Model } from '../app'
import { createView, styles, formatPrice } from '../render'
import { Box, Flex, Stack, Text } from '../components'
import { Layout } from '../layouts/base'

export type CartState = {
  selected: number
}

type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'confirmation'

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

function Breadcrumbs(currentStep: CheckoutStep) {
  const steps: CheckoutStep[] = ['cart', 'shipping', 'payment', 'confirmation']
  return Flex(
    steps.flatMap((step, index) => [
      Text(step, {
        style: step === currentStep ? styles.white : styles.gray,
      }),
      index < steps.length - 1 ? Text('/', { style: styles.gray }) : '',
    ]),
    { gap: 1 },
  )
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

  return Box(
    Stack([
      Flex(
        [
          Text(product.name, {
            style: selected ? styles.white : styles.gray,
          }),
          Flex(
            [
              Text(selected ? '-' : ' ', { style: styles.gray }),
              Text(item.quantity.toString(), { style: styles.white }),
              Text(selected ? '+' : ' ', { style: styles.gray }),
              Text(formatPrice(item.subtotal), { style: styles.gray }),
            ],
            { gap: 1 },
          ),
        ],
        { justify: 'between' },
      ),
      variant ? Text(variant.name, { style: styles.gray }) : '',
    ]),
    {
      padding: { x: 1, y: 0 },
      border: true,
      borderStyle: {
        color: selected ? styles.white : styles.gray,
      },
    },
  )
}

export const CartView = createView({
  name: 'cart',
  view: (model, state) => {
    return Layout(
      Stack(
        [
          Breadcrumbs('cart'),
          !model.cart?.items.length
            ? Text('Your cart is empty', { style: styles.gray })
            : Stack(
                model.cart.items.map((item, index) =>
                  CartItem(item, index === state.selected, model),
                ),
              ),
        ],
        { gap: 1 },
      ),
    )
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
        return { message: { type: 'app:navigate', view: 'shop' } }
    }
  },
})

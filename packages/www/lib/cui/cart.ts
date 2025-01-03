import type Terminal from '@terminaldotshop/sdk'
import type { Model } from './app'
import { createView, styles, formatPrice } from './render'
import { box, flex, stack, text } from './layout'

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

function renderBreadcrumbs(currentStep: CheckoutStep) {
  const steps: CheckoutStep[] = ['cart', 'shipping', 'payment', 'confirmation']
  return flex([
    ...steps.flatMap(
      (step, index) => [
        text(step, {
          style: step === currentStep ? styles.white : styles.gray,
        }),
        index < steps.length - 1 ? text(' / ', { style: styles.gray }) : '',
      ],
      { width: 80 },
    ),
  ])
}

function renderCartItem(
  model: Model,
  item: Terminal.CartResource.Cart.Item,
  selected: boolean,
) {
  const product = model.products.find((p) =>
    p.variants.find((v) => v.id === item.productVariantID),
  )
  if (!product) return []

  const variant = product.variants.find((v) => v.id === item.productVariantID)

  return box(
    stack(
      [
        flex(
          [
            text(product.name, {
              style: selected ? styles.white : styles.gray,
            }),
            flex(
              [
                text(selected ? '- ' : ' ', { style: styles.gray }),
                text(item.quantity.toString(), { style: styles.white }),
                text(selected ? ' + ' : '   ', { style: styles.gray }),
                text(formatPrice(item.subtotal), { style: styles.gray }),
              ],
              { justify: 'end' },
            ),
          ],
          { justify: 'between' },
        ),
        variant ? text(variant.name, { style: styles.gray }) : '',
      ],
      { gap: 1 },
    ),
    {
      padding: { x: 1, y: 0 },
      width: model.dimensions.width,
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
    return stack(
      [
        renderBreadcrumbs('cart'),

        !model.cart?.items.length
          ? text('Your cart is empty', { style: styles.gray })
          : stack(
              model.cart.items.map((item, index) =>
                renderCartItem(model, item, index === state.selected),
              ),
            ),
      ],
      { gap: 1, width: model.dimensions.width },
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

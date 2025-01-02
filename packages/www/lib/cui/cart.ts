import type Terminal from '@terminaldotshop/sdk'
import type { Model, ModelUpdate } from './app'
import { createView, styles, formatPrice } from './render'
import type { StyledLine } from './types'

export type CartState = {
  selected: number
}

type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'confirmation'

function updateSelectedItem(
  model: Model,
  previous: boolean,
): [ModelUpdate, undefined] {
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

  return [
    {
      state: {
        cart: {
          selected: next,
        },
      },
    },
    undefined,
  ]
}

function renderBreadcrumbs(currentStep: CheckoutStep) {
  const steps: CheckoutStep[] = ['cart', 'shipping', 'payment', 'confirmation']
  const breadcrumbs = steps
    .map((step, index) => {
      const isActive = step === currentStep
      const separator = index < steps.length - 1 ? ' / ' : ''
      return [
        {
          text: step,
          style: isActive ? styles.white : styles.gray,
        },
        { text: separator, style: styles.gray },
      ]
    })
    .flat()

  return [
    { texts: breadcrumbs },
    undefined, // newline
  ]
}

function renderCartItem(
  state: Model,
  item: Terminal.CartResource.Cart.Item,
  selected: boolean,
) {
  const lines: StyledLine[] = []
  const product = state.products.find((p) =>
    p.variants.find((v) => v.id === item.productVariantID),
  )
  if (!product) return lines

  const variant = product.variants.find((v) => v.id === item.productVariantID)

  // Box top border
  lines.push({
    texts: [
      {
        text: '┌' + '─'.repeat(78) + '┐',
        style: selected ? styles.white : styles.gray,
      },
    ],
  })

  // Item name and price row
  lines.push({
    texts: [
      {
        text: '│',
        style: selected ? styles.white : styles.gray,
      },
      {
        text: ` ${product.name}`,
        style: selected ? styles.white : styles.gray,
        pad: 30,
      },
      {
        text: selected ? '- ' : ' ',
        style: styles.gray,
      },
      {
        text: selected
          ? item.quantity.toString()
          : item.quantity.toString().padStart(2),
        style: styles.white,
      },
      {
        text: selected ? ' + ' : '   ',
        style: styles.gray,
        pad: 10,
      },
      {
        text: formatPrice(item.subtotal),
        style: styles.gray,
        pad: selected ? 31 : 33,
      },
      {
        text: '│',
        style: selected ? styles.white : styles.gray,
      },
    ],
  })

  // Variant details row
  if (variant) {
    lines.push({
      texts: [
        {
          text: '│',
          style: selected ? styles.white : styles.gray,
        },
        {
          text: ` ${variant.name}`,
          style: styles.gray,
          pad: 77,
        },
        {
          text: '│',
          style: selected ? styles.white : styles.gray,
        },
      ],
    })
  }

  // Box bottom border
  lines.push({
    texts: [
      {
        text: '└' + '─'.repeat(78) + '┘',
        style: selected ? styles.white : styles.gray,
      },
    ],
  })

  lines.push(undefined) // newline
  return lines
}

export const CartView = createView({
  name: 'cart',
  key: (model) => {
    const cartKey = model.cart?.items
      .map((item) => `${item.productVariantID}-${item.quantity}`)
      .join('-')
    return `cart-${cartKey}-${model.state.cart.selected}`
  },
  view: (model, state) => {
    const lines = []

    // Add breadcrumbs
    lines.push(...renderBreadcrumbs('cart'))

    if (!model.cart?.items.length) {
      lines.push({
        texts: [{ text: 'Your cart is empty', style: styles.gray }],
      })
    } else {
      // Render cart items
      model.cart.items.forEach((item, index) => {
        lines.push(...renderCartItem(model, item, index === state.selected))
      })

      // Render free shipping message
      lines.push(undefined)
      lines.push({
        texts: [
          {
            text: 'free shipping on US orders over $40',
            style: styles.gray,
          },
        ],
      })
    }

    return lines
  },
  update: (msg, model) => {
    if (msg.type !== 'browser:keydown') return [model, undefined]

    const { key } = msg.event
    const items = model.cart?.items || []
    const selectedIndex = model.state.shop.selected
    const selectedItem = items[selectedIndex]

    switch (key.toLowerCase()) {
      case 'arrowdown':
      case 'j':
        return updateSelectedItem(model, false)

      case 'arrowup':
      case 'k':
        return updateSelectedItem(model, true)

      case 'arrowright':
      case 'l':
      case '+':
        if (selectedItem) {
          return [
            model,
            () => ({
              type: 'UpdateQuantity',
              variantId: selectedItem.productVariantID,
              delta: selectedItem.quantity + 1,
            }),
          ]
        }
        break

      case 'arrowleft':
      case 'h':
      case '-':
        if (selectedItem && selectedItem.quantity > 0) {
          return [
            model,
            () => ({
              type: 'UpdateQuantity',
              variantId: selectedItem.productVariantID,
              delta: selectedItem.quantity - 1,
            }),
          ]
        }
        break

      case 'escape':
        return [model, () => ({ type: 'app:navigate', view: 'shop' })]
    }

    return [model, undefined]
  },
})

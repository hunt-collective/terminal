import type { CheckoutStep, Context, StyledLine } from './types'
import { createView, styles, formatPrice, pad } from './render'
import type Terminal from '@terminaldotshop/sdk'
import { HeaderView } from './header'

// Helper functions that return StyledLine[] instead of rendering directly
function renderBreadcrumbs(currentStep: CheckoutStep): StyledLine[] {
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
  context: Context,
  item: Terminal.Cart['items'][0],
  isSelected: boolean,
): StyledLine[] {
  const lines: StyledLine[] = []
  const product = context.products.find((p) =>
    p.variants.find((v) => v.id === item.productVariantID),
  )
  if (!product) return lines

  const variant = product?.variants.find((v) => v.id === item.productVariantID)

  // Box top border
  lines.push({
    texts: [
      {
        text: '┌' + '─'.repeat(78) + '┐',
        style: isSelected ? styles.white : styles.gray,
      },
    ],
  })

  // Item name and price row
  lines.push({
    texts: [
      {
        text: '│',
        style: isSelected ? styles.white : styles.gray,
      },
      {
        text: ` ${product.name}`,
        style: isSelected ? styles.white : styles.gray,
        pad: 30,
      },
      {
        text: isSelected ? '- ' : ' ',
        style: styles.gray,
      },
      {
        text: isSelected
          ? item.quantity.toString()
          : item.quantity.toString().padStart(2),
        style: styles.white,
      },
      {
        text: isSelected ? ' + ' : '   ',
        style: styles.gray,
        pad: 10,
      },
      {
        text: formatPrice(item.subtotal),
        style: styles.gray,
        pad: isSelected ? 31 : 33,
      },
      {
        text: '│',
        style: isSelected ? styles.white : styles.gray,
      },
    ],
  })

  // Variant details row
  if (variant) {
    lines.push({
      texts: [
        {
          text: '│',
          style: isSelected ? styles.white : styles.gray,
        },
        {
          text: ` ${variant.name}`,
          style: styles.gray,
          pad: 77,
        },
        {
          text: '│',
          style: isSelected ? styles.white : styles.gray,
        },
      ],
    })
  }

  // Box bottom border
  lines.push({
    texts: [
      {
        text: '└' + '─'.repeat(78) + '┘',
        style: isSelected ? styles.white : styles.gray,
      },
    ],
  })

  lines.push(undefined) // newline
  return lines
}

function renderFooter(): StyledLine[] {
  const footer =
    pad('↕ items', 15) +
    pad('+/- qty', 15) +
    pad('c checkout', 15) +
    'esc back'

  return [
    undefined,
    {
      texts: [
        {
          text: footer,
          style: { color: '#666', 'font-family': 'monospace' },
        },
      ],
    },
  ]
}

// Single cached view for the entire cart
const CartContentView = createView({
  name: 'CartContentView',
  getCacheKey: (
    context: Context,
    selectedIndex: number,
    currentStep: CheckoutStep,
  ) => {
    const cartKey = context.cart?.items
      .map((item) => `${item.productVariantID}-${item.quantity}`)
      .join('-')
    return `cart-content-${cartKey}-${selectedIndex}-${currentStep}`
  },
  render: (
    context: Context,
    selectedIndex: number,
    currentStep: CheckoutStep,
  ) => {
    const lines: StyledLine[] = []

    // Add breadcrumbs
    lines.push(...renderBreadcrumbs(currentStep))

    if (!context.cart?.items.length) {
      lines.push({
        texts: [{ text: 'Your cart is empty', style: styles.gray }],
      })
    } else {
      // Render cart items
      context.cart.items.forEach((item, index) => {
        lines.push(...renderCartItem(context, item, index === selectedIndex))
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

    // Add footer
    lines.push(...renderFooter())

    return lines
  },
})

export class CartView {
  private currentStep: CheckoutStep = 'cart'
  private selectedItemIndex: number = 0
  private context: Context

  constructor(context: Context) {
    this.context = context
  }

  private attachKeyboardListeners(): void {
    window.addEventListener('keydown', this.handleKeyboardNavigation)
  }

  private handleKeyboardNavigation = (event: KeyboardEvent): void => {
    if (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement ||
      document.activeElement instanceof HTMLSpanElement
    )
      return

    const key = event.key.toLowerCase()

    switch (key) {
      case 'arrowdown':
      case 'j':
        this.moveSelection('down')
        break
      case 'arrowup':
      case 'k':
        this.moveSelection('up')
        break
      case 'arrowright':
      case 'l':
      case '+':
        this.updateQuantity(1)
        break
      case 'arrowleft':
      case 'h':
      case '-':
        this.updateQuantity(-1)
        break
    }
  }

  private moveSelection(direction: 'up' | 'down'): void {
    if (!this.context.cart?.items.length) return

    const increment = direction === 'down' ? 1 : -1
    let newIndex = this.selectedItemIndex + increment

    if (newIndex < 0) {
      newIndex = 0
    } else if (newIndex >= this.context.cart.items.length) {
      newIndex = this.context.cart.items.length - 1
    }

    this.selectedItemIndex = newIndex
    this.render()
  }

  private async updateQuantity(delta: number): Promise<void> {
    if (!this.context.cart?.items.length) return

    const item = this.context.cart.items[this.selectedItemIndex]
    if (!item) return

    const newQuantity = Math.max(item.quantity + delta, 0)

    // Optimistic update
    item.quantity = newQuantity
    item.subtotal = (item.subtotal / item.quantity) * newQuantity
    this.context.cart.subtotal = this.context.cart.items.reduce(
      (acc, item) => acc + item.subtotal,
      0,
    )

    // Clear cache since cart data changed
    CartContentView.clearCache()

    this.render()

    try {
      const response = await this.context.client.cart.setItem({
        productVariantID: item.productVariantID,
        quantity: newQuantity,
      })
      this.context.cart = response.data
    } catch (error) {
      console.error('Failed to update cart:', error)
    }
  }

  render(): void {
    console.clear()

    // Render header
    HeaderView.render(this.context)

    // Render main cart content (includes breadcrumbs, items, and footer)
    CartContentView.render(
      this.context,
      this.selectedItemIndex,
      this.currentStep,
    )
  }

  activate(): void {
    this.attachKeyboardListeners()
  }
}

export namespace CartView {
  export function create(context: Context): CartView {
    const cartView = new CartView(context)
    return cartView
  }
}

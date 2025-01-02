import Terminal from '@terminaldotshop/sdk'
import { getCurrentToken, API_URL } from './auth'
import type { Context, Layout, StyledLine, StyledText, View } from './types'
import { createView, styles, formatPrice } from './render'
import { CartView } from './cart'
import { HeaderView } from './header'

// Split layout view component
const SplitLayoutView = createView({
  name: 'SplitLayoutView',
  getCacheKey: (context: Context, selectedProduct: Terminal.Product | null) => {
    const cartKey = context.cart?.items
      .map((i) => `${i.productVariantID}-${i.quantity}`)
      .join('-')
    return `split-${selectedProduct?.id}-${cartKey}`
  },
  render: (context: Context, selectedProduct: Terminal.Product | null) => {
    const LIST_WIDTH = 20
    const DETAILS_WIDTH = 45
    const lines: StyledLine[] = []

    // Prepare the content for both columns
    const featured = context.products.filter((p) => p.tags?.featured === 'true')
    const staples = context.products.filter((p) => p.tags?.featured !== 'true')

    // Prepare product details content
    const detailsLines: StyledLine[] = []
    if (selectedProduct) {
      const product = selectedProduct
      const variant = product.variants[0]

      detailsLines.push({
        texts: [{ text: product.name, style: styles.white }],
      })
      detailsLines.push({ texts: [{ text: variant.name, style: styles.gray }] })
      detailsLines.push(undefined)
      detailsLines.push({
        texts: [{ text: formatPrice(variant.price), style: styles.orange }],
      })
      detailsLines.push(undefined)

      // Split description into lines
      const maxLineLength = DETAILS_WIDTH
      const words = product.description.split(' ')
      let line = ''
      for (const word of words) {
        if ((line + word).length > maxLineLength) {
          detailsLines.push({
            texts: [{ text: line.trim(), style: styles.gray }],
          })
          line = word + ' '
        } else {
          line += word + ' '
        }
      }
      if (line.trim()) {
        detailsLines.push({
          texts: [{ text: line.trim(), style: styles.gray }],
        })
      }

      // Action button
      detailsLines.push(undefined)
      if (product.subscription === 'required') {
        detailsLines.push({
          texts: [
            {
              text: 'subscribe',
              style: {
                color: 'white',
                background: '#ff4800',
                padding: '2px 5px',
              },
            },
            {
              text: ' enter',
              style: {
                color: 'gray',
                padding: '2px 5px',
              },
            },
          ],
        })
      } else {
        detailsLines.push({
          texts: [
            { text: '- ', style: styles.gray },
            {
              text:
                context.cart?.items
                  .find((i) => i.productVariantID === variant.id)
                  ?.quantity?.toString() ?? '0',
              style: styles.white,
            },
            { text: ' +', style: styles.gray },
          ],
        })
      }
    }

    // Render both columns line by line
    let leftLineIndex = 0
    let rightLineIndex = 0

    while (
      leftLineIndex < featured.length + staples.length + 3 ||
      rightLineIndex < detailsLines.length
    ) {
      let leftTexts: StyledText[] = [{ text: '', pad: LIST_WIDTH }]

      if (leftLineIndex === 0) {
        leftTexts = [{ text: '~ featured ~', style: styles.white }]
      } else if (leftLineIndex === 1 && featured.length > 0) {
        leftTexts = renderProduct(featured[0], selectedProduct, LIST_WIDTH)
      } else if (leftLineIndex > 1 && leftLineIndex < featured.length + 2) {
        const product = featured[leftLineIndex - 1]
        if (product)
          leftTexts = renderProduct(product, selectedProduct, LIST_WIDTH)
      } else if (leftLineIndex === featured.length + 2) {
        leftTexts = [{ text: '~ staples ~', style: styles.white }]
      } else if (leftLineIndex > featured.length + 2) {
        const stapleIndex = leftLineIndex - featured.length - 3
        if (stapleIndex < staples.length) {
          leftTexts = renderProduct(
            staples[stapleIndex],
            selectedProduct,
            LIST_WIDTH,
          )
        }
      }

      // Get right column content
      const rightLine =
        rightLineIndex < detailsLines.length
          ? detailsLines[rightLineIndex]
          : undefined

      // Combine columns
      if (leftTexts || rightLine?.texts) {
        lines.push({
          texts: [
            ...leftTexts.map((t) => ({
              ...t,
              pad: t.pad ?? LIST_WIDTH,
            })),
            ...(rightLine?.texts ?? []),
          ],
        })
      }

      leftLineIndex++
      rightLineIndex++
    }

    // Add padding at the bottom
    for (let i = 0; i < 15 - leftLineIndex; i++) {
      lines.push({ texts: [{ text: ' '.repeat(i), style: {} }] })
    }

    return lines
  },
})

// Compact layout view
const CompactLayoutView = createView({
  name: 'CompactLayoutView',
  getCacheKey: () => 'compact',
  render: () => {
    return [
      {
        texts: [{ text: 'Compact layout coming soon...', style: styles.gray }],
      },
    ]
  },
})

// Footer view
const FooterView = createView({
  name: 'FooterView',
  getCacheKey: () => 'footer',
  render: () => {
    const footer = '↕ products   +/- qty   c cart   q quit'
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
  },
})

function renderProduct(
  product: Terminal.Product,
  selectedProduct: Terminal.Product | null,
  LIST_WIDTH: number,
): StyledText[] {
  const texts: StyledText[] = [
    {
      text: ' ' + product.name,
      style:
        product === selectedProduct
          ? { ...styles.white, background: '#ff4800' }
          : styles.gray,
      pad: product === selectedProduct ? 0 : undefined,
    },
  ]

  if (product === selectedProduct) {
    texts.push({
      text: '',
      style: { ...styles.white, background: '#ff4800' },
      pad: LIST_WIDTH - product.name.length - 4,
    })
    texts.push({
      text: '',
      style: styles.white,
      pad: 3,
    })
  }
  return texts
}

export class TerminalShop {
  private layouts: Record<'narrow' | 'wide', Layout> = {
    narrow: {
      width: 60,
      style: 'compact',
    },
    wide: {
      width: 120,
      style: 'split',
    },
  }

  private context: Context
  private cartView: CartView | null = null
  private currentLayout: 'narrow' | 'wide' = 'wide'
  private selectedProduct: Terminal.Product | null = null
  private allProducts: Terminal.Product[] = []
  private currentProductIndex: number = 0
  private lastCartUpdateID: number | null = null
  private resizeTimeout: number | null = null

  private constructor(context: Context) {
    this.context = context
    window.addEventListener('keydown', this.handleKeyboardNavigation)
  }

  public static async create(): Promise<TerminalShop> {
    const token = getCurrentToken()
    if (!token) throw new Error('No access token available')

    const client = new Terminal({
      bearerToken: token,
      baseURL: API_URL,
    })

    const products = await client.product.list().then((r) => r.data)
    const cart = await client.cart.get().then((r) => r.data)

    const context = {
      client,
      products,
      cart,
      view: 'shop',
    } as const

    return new TerminalShop(context)
  }

  async init(): Promise<void> {
    try {
      if (this.context.cart) {
        this.cartView = CartView.create(this.context)
      }

      this.selectedProduct =
        this.context.products.find((p) => p.tags?.featured === 'true') ??
        this.context.products[0]

      this.determineLayout()
      this.render()

      window.addEventListener('resize', () => {
        if (this.resizeTimeout) {
          window.clearTimeout(this.resizeTimeout)
        }
        this.resizeTimeout = window.setTimeout(() => {
          const previousLayout = this.currentLayout
          this.determineLayout()
          if (previousLayout !== this.currentLayout) {
            this.render()
          }
        }, 150)
      })

      this.allProducts = [...this.context.products]
      this.currentProductIndex =
        this.allProducts.findIndex((p) => p.id === this.selectedProduct?.id) ??
        0
    } catch (error) {
      console.error('Failed to initialize shop:', error)
    }
  }

  private handleKeyboardNavigation = (event: KeyboardEvent): void => {
    if (
      this.context.view !== 'shop' ||
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
        this.updateQuantity(1)
        break
      case 'arrowleft':
      case 'h':
        this.updateQuantity(-1)
        break
      case 'c':
      case 'enter':
        this.navigate('cart')
        break
    }
  }

  moveSelection(direction: 'up' | 'down'): void {
    const increment = direction === 'down' ? 1 : -1
    let newIndex = this.currentProductIndex + increment

    if (newIndex < 0) {
      newIndex = 0
    } else if (newIndex >= this.allProducts.length) {
      newIndex = this.allProducts.length - 1
    }

    this.currentProductIndex = newIndex
    this.selectedProduct = this.allProducts[newIndex]
    this.render()
  }

  async updateQuantity(delta: number): Promise<void> {
    const product = this.selectedProduct
    if (!product) return

    const variant = product.variants[0]
    const item = this.context.cart?.items.find(
      (i) => i.productVariantID === variant.id,
    )
    const currentQuantity = item?.quantity ?? 0
    const newQuantity = Math.max(currentQuantity + delta, 0)

    // Optimistic update
    if (item) {
      item.quantity = newQuantity
      item.subtotal = variant.price * newQuantity
    } else if (this.context.cart) {
      this.context.cart.items.push({
        id: '',
        productVariantID: variant.id,
        quantity: newQuantity,
        subtotal: variant.price * newQuantity,
      })
    }

    if (this.context.cart) {
      this.context.cart.subtotal = this.context.cart.items.reduce(
        (acc, item) => acc + item.subtotal,
        0,
      )
    }

    SplitLayoutView.clearCache()
    this.render()

    const now = Date.now()
    this.lastCartUpdateID = now

    try {
      const response = await this.context.client.cart.setItem({
        productVariantID: variant.id,
        quantity: newQuantity,
      })
      if (this.lastCartUpdateID === now) {
        this.context.cart = response.data
      }
    } catch (error) {
      console.error('Failed to update cart:', error)
    }
  }

  private determineLayout(): void {
    const width = window.innerWidth
    // Invert the width logic since console gets smaller as window gets bigger
    this.currentLayout = width > 1200 ? 'narrow' : 'wide'
  }

  navigate(view: View): void {
    this.context.view = view
    if (view === 'cart' && this.cartView) {
      this.cartView.activate()
    }
    this.render()
  }

  render(): void {
    if (this.context.view === 'cart' && this.cartView) {
      this.cartView.render()
      return
    }

    console.clear()

    // Render header
    HeaderView.render(this.context)

    // Add newline
    console.log('')

    // Render main content based on layout
    if (this.layouts[this.currentLayout].style === 'split') {
      SplitLayoutView.render(this.context, this.selectedProduct)
    } else {
      CompactLayoutView.render(this.context)
    }

    // Render footer
    FooterView.render(this.context)
  }
}

// Create and export an async function to initialize the shop
let shop: TerminalShop | null = null

export async function launch(): Promise<TerminalShop> {
  if (!shop) {
    shop = await TerminalShop.create()

    // Set up navigation shortcuts
    Object.defineProperties(window, {
      s: { get: () => shop?.render() },
      c: { get: () => shop?.navigate('cart') },
      a: { get: () => shop?.render() },
      q: { get: () => shop?.render() },
      j: { get: () => shop?.moveSelection('down') },
      k: { get: () => shop?.moveSelection('up') },
      h: { get: () => shop?.updateQuantity(-1) },
      l: { get: () => shop?.updateQuantity(1) },
    })

    // Add shop to window for debugging
    ;(window as any).shop = shop
  }
  return shop
}

export function getShop(): TerminalShop | null {
  return shop
}

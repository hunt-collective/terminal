import Terminal from '@terminaldotshop/sdk'
import { auth, callback, getCurrentToken, API_URL } from './auth'
import { type Msg } from './events'
import type { View as ViewType } from './types'
import { HeaderView } from './header'
import { ShopView, type ShopState } from './shop'
import { CartView, type CartState } from './cart'
import { SplashView, type SplashState } from './splash'
import { FooterView } from './footer'
import { combineLines, EMPTY_LINE, type View } from './render'

export type Model = {
  view: ViewType
  client: () => Promise<Terminal>
  cart: Terminal.Cart | null
  products: Terminal.Product[]
  selectedProductId: string | null
  dimensions?: { width: number; height: number }
  state: {
    splash: SplashState
    shop: ShopState
    cart: CartState
  }
}

export class App {
  private model: Model
  private last: string = ''

  static async create(): Promise<App> {
    const app = new App()
    await app.initialize()
    return app
  }

  private constructor() {
    // Start with splash view while loading data
    this.model = {
      view: 'splash',
      client: async () => {
        const token = await getCurrentToken()
        if (!token) throw new Error('No access token available')

        const client = new Terminal({
          bearerToken: token,
          baseURL: API_URL,
        })
        return client
      },
      cart: null,
      products: [],
      selectedProductId: null,
      state: {
        splash: {
          cursorVisible: true,
        },
        shop: {
          selected: 0,
        },
        cart: {},
      },
    }

    this.render()

    // Set up global keyboard handling
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement instanceof HTMLSpanElement
      )
        return

      // Global navigation shortcuts
      switch (e.key.toLowerCase()) {
        case 's':
          this.handleMsg({ type: 'app:navigate', view: 'shop' })
          return
        case 'c':
          this.handleMsg({ type: 'app:navigate', view: 'cart' })
          return
        case 'a':
          this.handleMsg({ type: 'app:navigate', view: 'account' })
          return
      }

      // Forward other keyboard events to current view
      this.handleMsg({ type: 'browser:keydown', event: e })
    })
  }

  private async initialize() {
    const cmd = SplashView.init?.(this.model)
    if (cmd) {
      const msg = await cmd()
      await this.handleMsg(msg)
    }

    const client = await this.model.client()

    // Load data in parallel with splash animation
    const dataPromise = Promise.all([
      client.product.list().then((r) => r.data),
      client.cart.get().then((r) => r.data),
    ])

    // Ensure splash shows for at least 3 seconds
    const timerPromise = new Promise((resolve) => setTimeout(resolve, 3000))

    // Wait for both data and minimum splash time
    const [products, cart] = await Promise.all([
      dataPromise,
      timerPromise,
    ]).then(([data]) => data)

    // Switch to shop view with loaded data
    this.update({
      view: 'shop',
      products,
      cart,
      selectedProductId:
        products.find((p) => p.tags?.featured === 'true')?.id ??
        products[0]?.id ??
        null,
    })

    this.render()
  }

  private update(model: Partial<Model>) {
    this.model = { ...this.model, ...model }
    return this.model
  }

  private getCurrentView(): View {
    switch (this.model.view) {
      case 'shop':
        return ShopView
      case 'cart':
        return CartView
      case 'splash':
        return SplashView
      case 'account':
        throw new Error('Account view not implemented')
    }
  }

  private getNextProductId(direction: 'next' | 'prev' = 'next'): string {
    const products = this.model.products
    const currentIndex = products.findIndex(
      (p) => p.id === this.model?.selectedProductId,
    )
    const delta = direction === 'next' ? 1 : -1
    const nextIndex = Math.min(
      Math.max(0, currentIndex + delta),
      products.length - 1,
    )
    return products[nextIndex].id
  }

  private async handleMsg(msg: Msg) {
    switch (msg.type) {
      case 'app:navigate':
        this.model.view = msg.view
        break

      case 'SelectProduct': {
        const nextId =
          msg.productId === 'next'
            ? this.getNextProductId()
            : msg.productId === 'prev'
              ? this.getNextProductId('prev')
              : msg.productId
        this.model.selectedProductId = nextId
        break
      }

      case 'UpdateQuantity': {
        try {
          const client = await this.model.client()
          const response = await client.cart.setItem({
            productVariantID: msg.variantId,
            quantity: msg.delta,
          })
          this.model.cart = response.data
        } catch (error) {
          console.error('Failed to update cart:', error)
        }
        break
      }
    }

    // Forward to current view's update function
    const view = this.getCurrentView()
    if (view.update) {
      const [model, cmd] = view.update?.(msg, this.model)
      this.update(model)

      if (cmd) {
        const nextMsg = await cmd()
        this.handleMsg(nextMsg)
      }
    }

    this.render()
  }

  render() {
    const { view, fullscreen } = this.getCurrentView()

    const lines = []
    if (!fullscreen) lines.push(...HeaderView.view(this.model))

    const viewLines = view(this.model)
    const delta = 15 - viewLines.length
    for (let i = 0; i < delta; i++) {
      viewLines.push(EMPTY_LINE)
    }

    lines.push(...viewLines)

    if (!fullscreen) lines.push(...FooterView.view(this.model))

    const { text, styles } = combineLines(lines)
    if (this.last === text) return

    console.clear()
    console.log(text, ...styles)
    this.last = text
  }
}

// Auto-initialize when script loads
;(async () => {
  // Handle auth callback if present
  const hash = new URLSearchParams(location.search.slice(1))
  const code = hash.get('code')
  const state = hash.get('state')

  if (code && state) {
    await callback(code, state)
  }

  const token = await auth()
  if (!token) {
    console.error('Sign in to access the console shop')
    return
  }

  // Create app instance
  await App.create()
})()

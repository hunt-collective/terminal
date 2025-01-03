import Terminal from '@terminaldotshop/sdk'
import { getCurrentToken, API_URL, callback, auth } from './auth'
import { type Message } from './events'
import type { View as ViewType } from './types'
import { HeaderView } from './header'
import { ShopView, type ShopState } from './shop'
import { CartView, type CartState } from './cart'
import { SplashView, type SplashState } from './splash'
import { FooterView } from './footer'
import { combineLines, EMPTY_LINE, type View } from './render'

export type Model = {
  view: ViewType
  dimensions: { width: number; height: number }
  client: () => Promise<Terminal>
  cart: Terminal.Cart | null
  products: Terminal.Product[]
  updates: {
    cart?: number
  }
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
      dimensions: { width: 75, height: 20 },
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
      updates: {},
      state: {
        splash: {
          cursorVisible: true,
        },
        shop: {
          selected: 0,
        },
        cart: {
          selected: 0,
        },
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
    if (cmd) cmd().then(this.handleMsg.bind(this))

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
    this.model = {
      ...this.model,
      view: 'shop',
      products,
      cart,
      state: {
        ...this.model.state,
        shop: {
          selected: products.findIndex((p) => p.tags?.featured === 'true') ?? 0,
        },
      },
    }

    this.render()
  }

  private handleMsg(msg: Message) {
    // Handle global messages first
    switch (msg.type) {
      case 'app:navigate':
        this.model.view = msg.view
        break

      case 'cart:quantity-updated': {
        try {
          const product = this.model.products.find((p) =>
            p.variants.find((v) => v.id === msg.variantId),
          )
          const variant = product?.variants.find((v) => v.id === msg.variantId)
          if (!variant) return

          const item = this.model.cart?.items.find(
            (i) => i.productVariantID === variant?.id,
          )
          const newQuantity = Math.max(msg.quantity, 0)

          // Optimistic update
          if (item) {
            item.quantity = newQuantity
            item.subtotal = variant.price * newQuantity
          } else if (this.model.cart) {
            this.model.cart.items.push({
              id: '',
              productVariantID: variant.id,
              quantity: newQuantity,
              subtotal: variant.price * newQuantity,
            })
          }
          if (this.model.cart) {
            this.model.cart.subtotal = this.model.cart.items.reduce(
              (acc, item) => acc + item.subtotal,
              0,
            )
          }

          const now = Date.now()
          this.model.updates.cart = now

          this.model
            .client()
            .then((client) =>
              client.cart.setItem({
                productVariantID: msg.variantId,
                quantity: msg.quantity,
              }),
            )
            .then((response) => {
              if (this.model.updates.cart === now) {
                this.model.cart = response.data
                this.render()
              }
            })
        } catch {}
        break
      }
    }

    // Forward to current view's update function
    const view = this.getCurrentView()
    if (view.update) {
      const result = view.update(msg, this.model)

      // Apply local state updates if any
      if (result?.state) {
        const viewName = view.name as keyof Model['state']
        this.model.state = {
          ...this.model.state,
          [viewName]: {
            ...this.model.state[viewName],
            ...result.state,
          },
        }
      }

      // Handle any resulting messages
      if (result?.message) {
        if (Array.isArray(result.message)) {
          result.message.forEach(this.handleMsg.bind(this))
        } else {
          this.handleMsg(result.message)
        }
      }

      // Handle any commands
      if (result?.command) {
        result.command().then(this.handleMsg.bind(this))
      }
    }

    this.render()
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

  render() {
    const { view, fullscreen } = this.getCurrentView()

    const lines = []
    if (!fullscreen) lines.push(...HeaderView.view(this.model))

    const viewLines = view(this.model)

    if (!fullscreen) {
      const delta = 15 - viewLines.length
      for (let i = 0; i < delta; i++) {
        viewLines.push(EMPTY_LINE)
      }
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
  const app = await App.create()
  // @ts-expect-error
  window.app = app

  // TODO: implement these
  // Object.defineProperties(window, {
  //   s: { get: () => app?.render() },
  //   c: { get: () => app?.navigate('cart') },
  //   a: { get: () => app?.render() },
  //   q: { get: () => app?.render() },
  //   j: { get: () => app?.moveSelection('down') },
  //   k: { get: () => app?.moveSelection('up') },
  //   h: { get: () => app?.updateQuantity(-1) },
  //   l: { get: () => app?.updateQuantity(1) },
  // })
})()

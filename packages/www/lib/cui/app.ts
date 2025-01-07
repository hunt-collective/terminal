import Terminal from '@terminaldotshop/sdk'
import { getCurrentToken, API_URL, callback, auth } from './auth'
import { type Message } from './events'
import { ShopPage, type ShopState } from './pages/shop'
import { CartPage, type CartState } from './pages/cart'
import { SplashPage } from './pages/splash'
import { combineLines, type Page } from './render'
import { ShippingPage, type ShippingState } from './pages/shipping'
import { type Component } from './component'
import { setRenderCallback } from './hooks'

export type Model = {
  page:
    | 'shop'
    | 'cart'
    | 'account'
    | 'splash'
    | 'shipping'
    | 'payment'
    | 'confirm'
    | 'final'
  focusLocked: boolean
  dimensions: { width: number; height: number }
  client: () => Promise<Terminal>
  profile?: Terminal.Profile
  cart?: Terminal.Cart
  products: Terminal.Product[]
  addresses: Terminal.Address[]
  updates: {
    cart?: number
  }
  state: {
    shop: ShopState
    cart: CartState
    shipping: ShippingState
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
    this.model = {
      page: 'splash',
      focusLocked: false,
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
      products: [],
      addresses: [],
      updates: {},
      state: {
        shop: {
          selected: 0,
        },
        cart: {
          selected: 0,
        },
        shipping: {
          view: 'list',
          selected: 0,
          busy: false,
        },
      },
    }

    // Register render callback for hooks
    setRenderCallback(this.render.bind(this))

    this.render()

    // Set up global keyboard handling
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement instanceof HTMLSpanElement
      )
        return

      // Forward keyboard events to current view
      this.handleMsg({ type: 'browser:keydown', event: e })

      if (this.model.focusLocked) return

      // Global navigation shortcuts
      switch (e.key.toLowerCase()) {
        case 's':
          this.handleMsg({ type: 'app:navigate', page: 'shop' })
          return
        case 'c':
          this.handleMsg({ type: 'app:navigate', page: 'cart' })
          return
      }
    })
  }

  private async initialize() {
    const client = await this.model.client()

    // Ensure splash shows for at least 3 seconds
    const splashPromise = new Promise((resolve) => setTimeout(resolve, 3000))
    const dataPromise = client.view.init().then((r) => r.data)

    // Wait for both data and minimum splash time
    const { profile, products, cart, addresses } = await Promise.all([
      dataPromise,
      splashPromise,
    ]).then(([data]) => data)

    // Switch to shop view with loaded data
    this.model = {
      ...this.model,
      page: 'shop',
      profile,
      cart,
      products,
      addresses,
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
        this.model.page = msg.page
        break

      case 'app:focus-locked':
        this.model.focusLocked = true
        break

      case 'app:focus-released':
        this.model.focusLocked = false
        break

      case 'cart:updated': {
        this.model.cart = msg.cart
        break
      }

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

            if (item.quantity === 0) {
              const index = this.model.cart?.items.indexOf(item) ?? 0
              this.model.cart?.items.splice(index, 1)
              this.model.state.cart.selected = Math.max(index - 1, 0)
            }
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

    // Forward to current view's update function if it exists
    const page = this.getCurrentPage()
    if ('update' in page && page.update) {
      const result = page.update(msg, this.model)

      // Apply local state updates if any
      if (result?.state) {
        const viewName = page.name as keyof Model['state']
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
        result
          .command()
          .then((r) =>
            (Array.isArray(r) ? r : [r]).forEach(this.handleMsg.bind(this)),
          )
      }
    }

    this.render()
  }

  private getCurrentPage(): Page | Component {
    switch (this.model.page) {
      case 'shop':
        return ShopPage
      case 'cart':
        return CartPage
      case 'splash':
        return SplashPage(this.model)
      case 'shipping':
        return ShippingPage
      default:
        throw new Error(`${this.model.page} page not implemented`)
    }
  }

  render() {
    const page = this.getCurrentPage()
    const lines =
      'view' in page
        ? page.view(this.model)
        : page({ width: this.model.dimensions.width })
    const { text, styles } = combineLines(lines)
    const key = text + JSON.stringify(styles)

    if (key === this.last) return

    console.clear()
    console.log(text, ...styles)
    this.last = key
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
})()

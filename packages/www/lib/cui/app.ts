import Terminal from '@terminaldotshop/sdk'
import { callback, getToken } from './auth'
import { type Message } from './events'
import { ShopPage } from './pages/shop'
import { CartPage } from './pages/cart'
import { SplashPage } from './pages/splash'
import { combineLines, type Page } from './render'
import { ShippingPage, type ShippingState } from './pages/shipping'
import { type Component } from './component'
import { setRenderCallback } from './hooks'
import { createContext } from './context'
import { App as Root } from './root'
import { initializeTerminal } from './terminal'

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
  profile?: Terminal.Profile
  cart?: Terminal.Cart
  products: Terminal.Product[]
  addresses: Terminal.Address[]
  updates: {
    cart?: number
  }
  state: {
    shipping: ShippingState
  }
}

export const ModelContext = createContext<Model>()

export class App {
  private model: Model
  private last: string = ''

  static async create(): Promise<App> {
    const app = new App()
    app.render()
    return app
  }

  private constructor() {
    this.model = {
      page: 'splash',
      focusLocked: false,
      dimensions: { width: 75, height: 20 },
      products: [],
      addresses: [],
      updates: {},
      state: {
        shipping: {
          view: 'list',
          selected: 0,
          busy: false,
        },
      },
    }

    ModelContext.Provider(this.model)

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
      // switch (e.key.toLowerCase()) {
      //   case 's':
      //     this.handleMsg({ type: 'app:navigate', page: 'shop' })
      //     return
      //   case 'c':
      //     this.handleMsg({ type: 'app:navigate', page: 'cart' })
      //     return
      // }
    })
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
        return ShopPage()
      case 'cart':
        return CartPage()
      case 'splash':
        return SplashPage()
      case 'shipping':
        return ShippingPage
      default:
        throw new Error(`${this.model.page} page not implemented`)
    }
  }

  render() {
    const lines = Root()({ width: this.model.dimensions.width })
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

  const token = await getToken()
  if (!token) {
    console.error('Sign in to access the console shop')
    return
  }

  await initializeTerminal()
  // Create app instance
  const app = await App.create()
  // @ts-expect-error
  window.app = app
})()

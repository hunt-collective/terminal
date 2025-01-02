import type Terminal from '@terminaldotshop/sdk'

export type View = 'shop' | 'cart' | 'account' | 'splash'
export type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'confirmation'

export type Context = {
  view: View
  client: Terminal
  cart: Terminal.Cart | null
  products: Terminal.Product[]
}

export interface Layout {
  width: number
  style: 'compact' | 'split'
}

export type StyledText = {
  text: string
  style?: object
  pad?: number
}

export type StyledLine =
  | {
      texts: StyledText[]
      pad?: number
    }
  | undefined

export interface CachedView {
  name: string
  render: (context: Context, ...args: any[]) => void
  clearCache: () => void
}

export type View = 'shop' | 'cart' | 'account' | 'splash'
export type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'confirmation'

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

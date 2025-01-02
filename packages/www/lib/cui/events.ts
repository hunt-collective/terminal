export type Cmd = () => Promise<Msg> | Msg

export const Delay =
  (milliseconds: number, cb: (t: Date) => Msg): Cmd =>
  () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const msg = cb(new Date())
        resolve(msg)
      }, milliseconds)
    })
  }

export type Msg =
  | { type: 'browser:keydown'; event: KeyboardEvent }
  | { type: 'app:navigate'; view: 'shop' | 'cart' | 'account' }
  | { type: 'splash:blink' }
  | { type: 'SelectProduct'; productId: string }
  | { type: 'UpdateQuantity'; variantId: string; delta: number }

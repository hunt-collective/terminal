export type Command = () => Promise<Message>

export const Delay =
  (milliseconds: number, cb: (t: Date) => Message): Command =>
  () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const msg = cb(new Date())
        resolve(msg)
      }, milliseconds)
    })
  }

export type Message =
  | { type: 'browser:keydown'; event: KeyboardEvent }
  | { type: 'app:navigate'; view: 'shop' | 'cart' | 'account' }
  | { type: 'splash:blink' }
  | { type: 'shop:selection-updated'; index: number }
  | { type: 'cart:quantity-updated'; variantId: string; quantity: number }

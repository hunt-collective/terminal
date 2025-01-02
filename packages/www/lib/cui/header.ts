import { createView, styles } from './render'
import type { Context, StyledText } from './types'

export const HeaderView = createView({
  name: 'HeaderView',
  getCacheKey: (context: Context) =>
    `header-${context.view}-${context.cart?.subtotal}-${context.cart?.items.length}`,
  render: (context: Context) => {
    const LIST_WIDTH = 30
    const DETAILS_WIDTH = 45
    const TOTAL_WIDTH = LIST_WIDTH + DETAILS_WIDTH

    const headerParts: StyledText[] = []
    const style = styles.header

    headerParts.push({ text: ' terminal', style, pad: 20 })
    headerParts.push({ text: 's ', style })
    headerParts.push({
      text: 'shop',
      style: {
        ...style,
        color: context.view === 'shop' ? 'white' : 'gray',
      },
      pad: 15,
    })
    headerParts.push({ text: 'a ', style })
    headerParts.push({
      text: 'account',
      style: {
        ...style,
        color: context.view === 'account' ? 'white' : 'gray',
      },
      pad: 15,
    })
    headerParts.push({ text: 'c ', style })
    headerParts.push({
      text: 'cart ',
      style: {
        ...style,
        color: context.view === 'cart' ? 'white' : 'gray',
      },
    })
    headerParts.push({
      text: `$ ${(context.cart?.subtotal ?? 0) / 100} `,
      style,
    })
    const totalItems = context.cart?.items.reduce(
      (acc, item) => acc + item.quantity,
      0,
    )
    headerParts.push({
      text: `[${totalItems}] `,
      style: { ...style, color: 'gray' },
    })

    return [{ texts: headerParts, pad: TOTAL_WIDTH }]
  },
})

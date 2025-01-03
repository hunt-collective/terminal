import { createView, EMPTY_LINE } from './render'

const style = {
  color: 'white',
  background: '#1e1e1e',
  'padding-top': '7px',
  'padding-bottom': '7px',
  'font-family': 'monospace',
  'border-bottom': '1px solid #666',
}

export const HeaderView = createView({
  name: 'header',
  view: (model) => {
    const parts = [
      {
        text: ' terminal',
        style,
        pad: 20,
      },
      {
        text: 's ',
        style,
      },
      {
        text: 'shop',
        style: {
          ...style,
          color: model.view === 'shop' ? 'white' : 'gray',
        },
        pad: 15,
      },
      {
        text: 'a ',
        style,
      },
      {
        text: 'account',
        style: {
          ...style,
          color: model.view === 'account' ? 'white' : 'gray',
        },
        pad: 15,
      },
      {
        text: 'c ',
        style,
      },
      {
        text: 'cart ',
        style: {
          ...style,
          color: model.view === 'cart' ? 'white' : 'gray',
        },
      },
      {
        text: `$ ${(model.cart?.subtotal ?? 0) / 100} `,
        style,
      },
      {
        text: `[${model.cart?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0}] `,
        style: {
          ...style,
          color: 'gray',
        },
      },
    ]

    return [
      {
        texts: parts,
        pad: model.dimensions.width, // Total width for the header
      },
      EMPTY_LINE,
    ]
  },
})

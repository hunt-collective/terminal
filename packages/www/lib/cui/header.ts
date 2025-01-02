import { createView, styles } from './render'

export const HeaderView = createView({
  name: 'header',
  view: (model) => {
    const parts = [
      // Logo
      {
        text: ' terminal',
        style: styles.header,
        pad: 20,
      },

      // Shop section
      {
        text: 's ',
        style: styles.header,
      },
      {
        text: 'shop',
        style: {
          ...styles.header,
          color: model.view === 'shop' ? 'white' : 'gray',
        },
        pad: 15,
      },

      // Account section
      {
        text: 'a ',
        style: styles.header,
      },
      {
        text: 'account',
        style: {
          ...styles.header,
          color: model.view === 'account' ? 'white' : 'gray',
        },
        pad: 15,
      },

      // Cart section
      {
        text: 'c ',
        style: styles.header,
      },
      {
        text: 'cart ',
        style: {
          ...styles.header,
          color: model.view === 'cart' ? 'white' : 'gray',
        },
      },

      // Cart total
      {
        text: `$ ${(model.cart?.subtotal ?? 0) / 100} `,
        style: styles.header,
      },

      // Cart count
      {
        text: `[${model.cart?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0}] `,
        style: {
          ...styles.header,
          color: 'gray',
        },
      },
    ]

    return [
      {
        texts: parts,
        pad: 75, // Total width for the header
      },
    ]
  },
})

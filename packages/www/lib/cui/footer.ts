import { createView, EMPTY_LINE } from './render'

export const FooterView = createView({
  name: 'footer',
  view: (model) => {
    let footerText = ''

    switch (model.view) {
      case 'shop':
        footerText = '↕ products   +/- qty   c cart   q quit'
        break
      case 'cart':
        footerText = '↕ items   +/- qty   esc back'
        break
      case 'account':
        footerText = 'esc back'
        break
    }

    const freeShippingText = 'free shipping on US orders over $40'
    const freeShippingSpace = ' '.repeat(
      (model.dimensions.width - freeShippingText.length) / 2,
    )
    const space = ' '.repeat((model.dimensions.width - footerText.length) / 2)

    return [
      {
        texts: [
          {
            text: freeShippingSpace + freeShippingText + freeShippingSpace,
            style: {
              color: 'gray',
              'border-bottom': '1px solid #666',
              padding: '10px 0px',
            },
          },
          { text: '\n' },
        ],
      },
      {
        texts: [
          { text: space },
          {
            text: footerText,
            style: {
              color: '#666',
              'font-family': 'monospace',
            },
          },
          { text: space },
        ],
      },
    ]
  },
})

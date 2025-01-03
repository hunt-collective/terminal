import { createView } from './render'

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

    const space = ' '.repeat((model.dimensions.width - footerText.length) / 2)

    return [
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

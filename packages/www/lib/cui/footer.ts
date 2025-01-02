import { createView } from './render'

export const FooterView = createView({
  name: 'footer',
  key: (model) => `footer-${model.view}`,
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

    return [
      {
        texts: [
          {
            text: footerText,
            style: {
              color: '#666',
              'font-family': 'monospace',
            },
          },
        ],
      },
    ]
  },
})

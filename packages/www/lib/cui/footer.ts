import { createView } from './render'
import { Box, Stack, Text, Center } from './components'

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

    return Stack([
      Box(
        Center([
          Text('free shipping on US orders over $40', {
            style: {
              color: 'gray',
            },
          }),
        ]),
        {
          style: {
            'border-bottom': '1px solid #666',
            'padding-top': '10px',
            'padding-bottom': '10px',
          },
        },
      ),
      Center([
        Text(footerText, {
          style: {
            color: '#666',
            'font-family': 'monospace',
          },
        }),
      ]),
    ])({ width: model.dimensions.width })
  },
})

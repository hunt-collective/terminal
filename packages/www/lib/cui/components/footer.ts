import { Box, Stack, Text, Center } from '../components'
import type { Component } from '../render'

export function Footer(): Component {
  return (model, parentContext) => {
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
    ])(model, parentContext)
  }
}

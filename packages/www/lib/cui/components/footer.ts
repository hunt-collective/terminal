import type { Model } from '../app'
import { Component } from '../component'
import { Box, Stack, Text, Center } from '../components'

interface FooterProps {
  page: Model['page']
}

export const Footer = Component<FooterProps>((props) => {
  let footerText = ''
  switch (props.page) {
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
    Box({
      style: {
        'border-bottom': '1px solid #666',
        'padding-top': '10px',
        'padding-bottom': '10px',
      },
      child: Center([
        Text('free shipping on US orders over $40', {
          style: {
            color: 'gray',
          },
        }),
      ]),
    }),
    Center([
      Text(footerText, {
        style: {
          color: '#666',
          'font-family': 'monospace',
        },
      }),
    ]),
  ])
})

import type { Model } from '../app'
import { Component } from '../component'
import { Box, Stack, Text, Center, Flex } from '../components'
import { styles } from '../render'

interface FooterProps {
  page: Model['page']
}

export const Footer = Component<FooterProps>((props) => {
  let parts: { hint: string; text: string }[] = []
  switch (props.page) {
    case 'shop':
      parts = [
        { hint: '↑/↓', text: 'products' },
        { hint: '+/-', text: 'qty' },
        { hint: 'c', text: 'cart' },
        { hint: 'q', text: 'quit' },
      ]
      break
    case 'cart':
      parts = [
        { hint: 'esc', text: 'back' },
        { hint: '↑/↓', text: 'items' },
        { hint: '+/-', text: 'qty' },
        { hint: 'c', text: 'checkout' },
      ]
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
          style: styles.gray,
        }),
      ]),
    }),
    Center(
      Flex({
        gap: 3,
        children: parts.map((part) =>
          Flex({
            gap: 1,
            children: [
              Text(part.hint, { style: styles.white }),
              Text(part.text, { style: styles.gray }),
            ],
          }),
        ),
      }),
    ),
  ])
})

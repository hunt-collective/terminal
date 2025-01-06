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
    Box(Center(Text('free shipping on US orders over $40', styles.gray)), {
      display: 'inline-block',
      borderBottom: '1px solid #666',
      paddingTop: '10px',
      paddingBottom: '10px',
    }),
    Center(
      Flex({
        gap: 3,
        children: parts.map((part) =>
          Flex({
            gap: 1,
            children: [
              Text(part.hint, styles.white),
              Text(part.text, styles.gray),
            ],
          }),
        ),
      }),
    ),
  ])
})

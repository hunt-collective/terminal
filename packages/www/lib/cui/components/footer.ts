import { ModelContext } from '../app'
import { Component } from '../component'
import { Box, Stack, Text, Center, Flex } from '../components'
import { styles } from '../render'

export const Footer = Component(() => {
  const [model] = ModelContext.useContext()

  let parts: { hint: string; text: string }[] = []
  switch (model!.page) {
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

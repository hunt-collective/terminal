import { styles } from '../render'
import { Box, Flex, Text } from './'
import type { Model } from '../app'
import { Component } from '../component'

interface HeaderProps {
  model: Model
}

export const Header = Component<HeaderProps>((props) => {
  return Box({
    padding: { x: 2 },
    style: { background: '#1e1e1e', padding: '7px 0px' },
    children: Flex({
      justify: 'between',
      gap: 1,
      children: [
        Flex({
          gap: 5,
          children: [
            Text('terminal', styles.white),
            Flex({
              gap: 1,
              children: [
                Text('s', styles.white),
                Text('shop', {
                  color: props.model.page === 'shop' ? 'white' : 'gray',
                }),
              ],
            }),
            Flex({
              gap: 1,
              children: [
                Text('a', styles.white),
                Text('account', {
                  color: props.model.page === 'account' ? 'white' : 'gray',
                }),
              ],
            }),
          ],
        }),
        Flex({
          gap: 1,
          children: [
            Text('c', styles.white),
            Text('cart', {
              color: props.model.page === 'cart' ? 'white' : 'gray',
            }),
            Text(`$ ${(props.model.cart?.subtotal ?? 0) / 100}`, styles.white),
            Text(
              `[${props.model.cart?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0}]`,
              styles.gray,
            ),
          ],
        }),
      ],
    }),
  })
})

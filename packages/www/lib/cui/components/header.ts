import { styles } from '../render'
import { Box, Flex, Text } from './'
import type { Component, ComponentProps } from '../render'
import type { Model } from '../app'

interface Props extends ComponentProps {
  model: Model
}

export function Header(props: Props): Component {
  return Box(
    Flex(
      [
        Flex(
          [
            Text('terminal', { style: styles.white }),
            Flex(
              [
                Text('s', { style: styles.white }),
                Text('shop', {
                  style: {
                    color: props.model.view === 'shop' ? 'white' : 'gray',
                  },
                }),
              ],
              { gap: 1 },
            ),
            Flex(
              [
                Text('a', { style: styles.white }),
                Text('account', {
                  style: {
                    color: props.model.view === 'account' ? 'white' : 'gray',
                  },
                }),
              ],
              { gap: 1 },
            ),
          ],
          { gap: 5 },
        ),
        Flex(
          [
            Text('c', { style: styles.white }),
            Text('cart', {
              style: {
                color: props.model.view === 'cart' ? 'white' : 'gray',
              },
            }),
            Text(`$ ${(props.model.cart?.subtotal ?? 0) / 100}`, {
              style: styles.white,
            }),
            Text(
              `[${props.model.cart?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0}]`,
              { style: { color: 'gray' } },
            ),
          ],
          { gap: 1 },
        ),
      ],
      { justify: 'between', gap: 1 },
    ),
    {
      padding: { x: 2 },
      style: { background: '#1e1e1e', padding: '7px 0px' },
    },
  )
}

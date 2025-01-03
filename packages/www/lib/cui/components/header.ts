import { styles } from '../render'
import { Box, Flex, Text, Stack, Break } from './'
import type { Component } from '../render'

export function Header(): Component {
  return (model, parentContext) => {
    return Stack([
      Box(
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
                        color: model.view === 'shop' ? 'white' : 'gray',
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
                        color: model.view === 'account' ? 'white' : 'gray',
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
                    color: model.view === 'cart' ? 'white' : 'gray',
                  },
                }),
                Text(`$ ${(model.cart?.subtotal ?? 0) / 100}`, {
                  style: styles.white,
                }),
                Text(
                  `[${model.cart?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0}]`,
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
      ),
      Break(), // Empty line after header
    ])(model, parentContext)
  }
}

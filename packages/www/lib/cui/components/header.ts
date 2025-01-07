import { styles } from '../render'
import { Box, Flex, Text } from './'
import { ModelContext } from '../app'
import { Component } from '../component'

export const Header = Component(() => {
  const [model] = ModelContext.useContext()

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
                  color: model?.page === 'shop' ? 'white' : 'gray',
                }),
              ],
            }),
            Flex({
              gap: 1,
              style: { textDecoration: 'line-through' },
              children: [
                Text('a', styles.white),
                Text('account', {
                  color: model?.page === 'account' ? 'white' : 'gray',
                }),
                Text('(PRs welcome)', {
                  ...styles.gray,
                  textDecoration: 'unset',
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
              color: model?.page === 'cart' ? 'white' : 'gray',
            }),
            Text(`$ ${(model?.cart?.subtotal ?? 0) / 100}`, styles.white),
            Text(
              `[${model?.cart?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0}]`,
              styles.gray,
            ),
          ],
        }),
      ],
    }),
  })
})

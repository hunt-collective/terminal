import { styles } from '../render'
import { Box, Flex, Text } from './'
import { Component } from '../component'
import { useRouter } from '../router'
import { useCart } from '../hooks'

export const Header = Component(() => {
  const { data: cart } = useCart()
  const router = useRouter()

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
                  color: router.route === 'shop' ? 'white' : 'gray',
                }),
              ],
            }),
            Flex({
              gap: 1,
              style: { textDecoration: 'line-through' },
              children: [
                Text('a', styles.white),
                Text('account', {
                  color: router.route === 'account' ? 'white' : 'gray',
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
              color: router.route === 'cart' ? 'white' : 'gray',
            }),
            Text(`$ ${(cart?.subtotal ?? 0) / 100}`, styles.white),
            Text(
              `[${cart?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0}]`,
              styles.gray,
            ),
          ],
        }),
      ],
    }),
  })
})

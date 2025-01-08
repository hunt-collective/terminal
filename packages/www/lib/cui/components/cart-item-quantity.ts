import type Terminal from '@terminaldotshop/sdk'
import { Component } from '../component'
import { Flex, Text } from '.'
import { styles } from '../render'

export const CartItemQuantity = Component<{
  item: Terminal.Cart.Item
}>((props) => {
  return Flex({
    gap: 1,
    children: [
      Text('-', styles.gray),
      Text(props.item.quantity.toString(), styles.white),
      Text('+', styles.gray),
    ],
  })
})

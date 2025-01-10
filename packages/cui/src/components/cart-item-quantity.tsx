import { styles } from "@/styles"
import type Terminal from "@terminaldotshop/sdk"
import { Flex, Text } from "@textjs/core/components"

type CartItemQuantityProps = {
  item: Terminal.Cart.Item
}

export const CartItemQuantity = (props: CartItemQuantityProps) => {
  return (
    <Flex gap={1}>
      <Text style={styles.gray}>-</Text>
      <Text style={styles.white}>{props.item.quantity.toString()}</Text>
      <Text style={styles.gray}>+</Text>
    </Flex>
  )
}

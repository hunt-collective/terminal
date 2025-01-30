import type Terminal from '@terminaldotshop/sdk'

type CartItemQuantityProps = {
  item: Terminal.Cart.Item
}

export const CartItemQuantity = (props: CartItemQuantityProps) => {
  return (
    <div className="flex gap-1">
      <span className="text-gray">-</span>
      <span className="text-white">{props.item.quantity.toString()}</span>
      <span className="text-gray">+</span>
    </div>
  )
}

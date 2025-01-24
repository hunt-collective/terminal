import { useCart, useProducts, useUpdateCartItem } from '../hooks'
import { CheckoutLayout } from '../layouts/checkout'
import type Terminal from '@terminaldotshop/sdk'
import { CartItemQuantity } from '../components'
import { formatPrice } from '../styles'
import { useRouter } from '@textjs/core/router'
import { useKeyboardHandlers } from '@textjs/core/keyboard'
import cn from 'classnames'
import React from 'react'

interface CartItemProps {
  item: Terminal.Cart.Item
  product: Terminal.Product
  variant: Terminal.ProductVariant
  selected: boolean
}

const CartItem = ({ item, product, variant, selected }: CartItemProps) => {
  return (
    <div
      className="border border-double"
      style={{ borderColor: selected ? 'white' : 'gray' }}
    >
      <div>
        <div className="flex justify-between">
          <span className={cn({ 'text-white': selected })}>{product.name}</span>
          <div className="flex gap-1">
            <CartItemQuantity item={item} />
            <span className="text-gray">
              {formatPrice(item.subtotal).padStart(5)}
            </span>
          </div>
        </div>
        {variant && <span className="text-gray">{variant.name}</span>}
      </div>
    </div>
  )
}

export const CartPage = () => {
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const { data: cart } = useCart()
  const { data: products } = useProducts()
  const { navigate } = useRouter()
  const { mutate: updateItem } = useUpdateCartItem()

  useKeyboardHandlers('cart', [
    {
      keys: ['ArrowDown', 'j'],
      handler: () => {
        if (!cart) return
        setSelectedIndex((prev) =>
          Math.min(prev + 1, Math.max(0, cart.items.length - 1)),
        )
      },
    },
    {
      keys: ['ArrowUp', 'k'],
      handler: () => {
        setSelectedIndex((prev) => Math.max(0, prev - 1))
      },
    },
    {
      keys: ['+', 'ArrowRight', 'l'],
      handler: () => {
        if (!cart) return
        const item = cart.items[selectedIndex]
        if (item) {
          updateItem({
            variantId: item.productVariantID,
            quantity: item.quantity + 1,
          })
        }
      },
    },
    {
      keys: ['-', 'ArrowLeft', 'h'],
      handler: () => {
        if (!cart) return
        const item = cart.items[selectedIndex]
        if (item) {
          updateItem({
            variantId: item.productVariantID,
            quantity: Math.max(0, item.quantity - 1),
          })
        }
      },
    },
    {
      keys: ['Escape'],
      handler: () => navigate('shop'),
    },
    {
      keys: ['Enter', 'c'],
      handler: () => navigate('shipping'),
    },
  ])

  if (!cart || !products) {
    return <span className="text-gray">Loading...</span>
  }

  return (
    <CheckoutLayout current="cart">
      {!cart.items.length ? (
        <span className="text-gray">Your cart is empty</span>
      ) : (
        <div className="gap-1">
          {cart.items.map((item, index) => {
            const product = products.find((p) =>
              p.variants.find((v) => v.id === item.productVariantID),
            )
            if (!product) return null

            const variant = product.variants.find(
              (v) => v.id === item.productVariantID,
            )
            if (!variant) return null

            return (
              <CartItem
                key={variant.id}
                item={item}
                product={product}
                variant={variant}
                selected={index === selectedIndex}
              />
            )
          })}
        </div>
      )}
    </CheckoutLayout>
  )
}

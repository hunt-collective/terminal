import type Terminal from '@terminaldotshop/sdk'
import type { Model } from './app'
import { createView, styles, formatPrice } from './render'
import { Box, Break, Flex, Stack, Text } from './components'

export type ShopState = {
  selected: number
}

function ProductListItem(
  product: Terminal.Product,
  isSelected: boolean,
  highlightColor: string,
) {
  const style = isSelected
    ? { ...styles.white, background: highlightColor }
    : styles.gray

  return Box(Text(product.name, { style }), {
    padding: { x: 1, y: 0 },
    style: isSelected ? { background: highlightColor } : undefined,
  })
}

function ProductSection(
  title: string,
  products: Terminal.Product[],
  selectedIndex: number,
  allProducts: Terminal.Product[],
  highlightColor: string,
) {
  return Stack([
    Text(`~ ${title} ~`, { style: styles.white }),
    ...products.map((product) => {
      const index = allProducts.findIndex((p) => p.id === product.id)
      return ProductListItem(product, index === selectedIndex, highlightColor)
    }),
  ])
}

function QuantityControl(currentQuantity: number) {
  return Flex(
    [
      Text('-', { style: styles.gray }),
      Text(currentQuantity.toString(), { style: styles.white }),
      Text('+', { style: styles.gray }),
    ],
    { gap: 1 },
  )
}

function SubscriptionButton() {
  return Flex(
    [
      Text('subscribe', {
        style: {
          color: 'white',
          background: '#ff4800',
          padding: '0px 5px',
        },
      }),
      Text('enter', {
        style: styles.gray,
      }),
    ],
    { gap: 1 },
  )
}

function ProductDetails(
  product: Terminal.Product,
  cart: Terminal.Cart | null,
  detailsWidth: number,
  highlightColor: string,
) {
  const variant = product.variants[0]
  const currentQuantity =
    cart?.items.find((i) => i.productVariantID === variant.id)?.quantity ?? 0

  return Box(
    Stack([
      Text(product.name, { style: styles.white }),
      Stack(
        [
          Text(variant.name, { style: styles.gray }),
          Text(formatPrice(variant.price), {
            style: { color: highlightColor },
          }),
          Text(product.description, {
            style: styles.gray,
            maxWidth: detailsWidth - 2,
          }),
          product.subscription === 'required'
            ? SubscriptionButton()
            : QuantityControl(currentQuantity),
        ],
        { gap: 1 },
      ),
    ]),
    {
      padding: { x: 1, y: 0 },
      width: detailsWidth,
    },
  )
}

function updateSelectedProduct(model: Model, previous: boolean) {
  const next = previous
    ? model.state.shop.selected - 1
    : model.state.shop.selected + 1

  return Math.max(0, Math.min(next, model.products.length - 1))
}

export const ShopView = createView({
  name: 'shop',
  view: (model, state) => {
    const gap = 2
    const third = Math.floor(model.dimensions.width / 3)
    const listWidth = third
    const detailsWidth = third * 2 - gap

    const featured = model.products.filter((p) => p.tags?.featured === 'true')
    const staples = model.products.filter((p) => p.tags?.featured !== 'true')
    const selectedProduct = model.products[state.selected]

    let highlightColor = 'orange'
    switch (selectedProduct.name) {
      case 'segfault':
        highlightColor = '#169FC1'
        break
      case 'dark mode':
        highlightColor = '#118B39'
        break
      case '[object Object]':
        highlightColor = '#F5BB1D'
        break
      case '404':
        highlightColor = '#D53C81'
        break
      case 'artisan':
        highlightColor = '#EB4432'
        break
      default:
        highlightColor = '#FF5C00'
    }

    return Flex(
      [
        Stack(
          [
            ProductSection(
              'featured',
              featured,
              state.selected,
              model.products,
              highlightColor,
            ),
            Break(),
            ProductSection(
              'staples',
              staples,
              state.selected,
              model.products,
              highlightColor,
            ),
          ],
          { width: listWidth },
        ),
        ProductDetails(
          selectedProduct,
          model.cart,
          detailsWidth,
          highlightColor,
        ),
      ],
      { gap },
    )({ width: model.dimensions.width })
  },
  update: (msg, model) => {
    if (msg.type !== 'browser:keydown') return

    const { key } = msg.event
    const product = model.products[model.state.shop.selected]
    const variant = product?.variants[0]

    switch (key.toLowerCase()) {
      case 'arrowdown':
      case 'j':
        return { state: { selected: updateSelectedProduct(model, false) } }

      case 'arrowup':
      case 'k':
        return { state: { selected: updateSelectedProduct(model, true) } }

      case 'arrowright':
      case 'l':
      case '+':
        if (variant) {
          const currentQty =
            model.cart?.items.find((i) => i.productVariantID === variant.id)
              ?.quantity ?? 0
          return {
            message: {
              type: 'cart:quantity-updated',
              variantId: variant.id,
              quantity: currentQty + 1,
            },
          }
        }
        break

      case 'arrowleft':
      case 'h':
      case '-':
        if (variant) {
          const currentQty =
            model.cart?.items.find((i) => i.productVariantID === variant.id)
              ?.quantity ?? 0
          if (currentQty > 0) {
            return {
              message: {
                type: 'cart:quantity-updated',
                variantId: variant.id,
                quantity: currentQty - 1,
              },
            }
          }
        }
        break
    }
  },
})

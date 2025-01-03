import type Terminal from '@terminaldotshop/sdk'
import type { Model } from './app'
import { createView, styles, formatPrice } from './render'
import { box, empty, flex, stack, text } from './components'

export type ShopState = {
  selected: number
}

function ProductListItem(product: Terminal.Product, isSelected: boolean) {
  const style = isSelected
    ? { ...styles.white, background: '#ff4800' }
    : styles.gray

  return box(text(product.name, { style }), {
    padding: { x: 1, y: 0 },
    style: isSelected ? { background: '#ff4800' } : undefined,
  })
}

function ProductSection(
  title: string,
  products: Terminal.Product[],
  selectedIndex: number,
  allProducts: Terminal.Product[],
) {
  return stack([
    text(`~ ${title} ~`, { style: styles.white }),
    ...products.map((product) => {
      const index = allProducts.findIndex((p) => p.id === product.id)
      return ProductListItem(product, index === selectedIndex)
    }),
  ])
}

function QuantityControl(currentQuantity: number) {
  return flex(
    [
      text('-', { style: styles.gray }),
      text(currentQuantity.toString(), { style: styles.white }),
      text('+', { style: styles.gray }),
    ],
    { gap: 1 },
  )
}

function SubscriptionButton() {
  return flex(
    [
      text('subscribe', {
        style: {
          color: 'white',
          background: '#ff4800',
          padding: '0px 5px',
        },
      }),
      text('enter', {
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
) {
  const variant = product.variants[0]
  const currentQuantity =
    cart?.items.find((i) => i.productVariantID === variant.id)?.quantity ?? 0

  return box(
    stack([
      text(product.name, { style: styles.white }),
      stack(
        [
          text(variant.name, { style: styles.gray }),
          text(formatPrice(variant.price), { style: styles.orange }),
          text(product.description, {
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

    return flex(
      [
        stack(
          [
            ProductSection(
              'featured',
              featured,
              state.selected,
              model.products,
            ),
            empty(),
            ProductSection('staples', staples, state.selected, model.products),
          ],
          { width: listWidth },
        ),
        ProductDetails(selectedProduct, model.cart, detailsWidth),
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

import type Terminal from '@terminaldotshop/sdk'
import type { Model } from './app'
import type { Cmd, Msg } from './events'
import type { StyledText } from './types'
import { createView, styles, formatPrice } from './render'

export type ShopState = {
  selected: number | undefined
}

function renderProduct(
  product: Terminal.Product,
  selectedId: string | null,
  LIST_WIDTH: number,
) {
  const texts = [
    {
      text: ' ' + product.name,
      style:
        product.id === selectedId
          ? { ...styles.white, background: '#ff4800' }
          : styles.gray,
      pad: product.id === selectedId ? 0 : undefined,
    },
  ]

  if (product.id === selectedId) {
    texts.push({
      text: '',
      style: { ...styles.white, background: '#ff4800' },
      pad: LIST_WIDTH - product.name.length - 4,
    })
    texts.push({
      text: '',
      style: styles.white,
      pad: 3,
    })
  }
  return texts
}

export const ShopView = createView({
  name: 'shop',
  key: (model) => {
    const cartKey = model.cart?.items
      .map((i) => `${i.productVariantID}-${i.quantity}`)
      .join('-')
    return `split-${model.selectedProductId}-${cartKey}`
  },
  view: (model) => {
    const LIST_WIDTH = 20
    const DETAILS_WIDTH = 45
    const lines = []

    // Prepare the content for both columns
    const featured = model.products.filter((p) => p.tags?.featured === 'true')
    const staples = model.products.filter((p) => p.tags?.featured !== 'true')
    const selectedProduct = model.products.find(
      (p) => p.id === model.selectedProductId,
    )

    // Prepare product details content
    const detailsLines = []
    if (selectedProduct) {
      const variant = selectedProduct.variants[0]

      detailsLines.push({
        texts: [{ text: selectedProduct.name, style: styles.white }],
      })
      detailsLines.push({
        texts: [{ text: variant.name, style: styles.gray }],
      })
      detailsLines.push(undefined)
      detailsLines.push({
        texts: [{ text: formatPrice(variant.price), style: styles.orange }],
      })
      detailsLines.push(undefined)

      // Split description into lines
      const maxLineLength = DETAILS_WIDTH
      const words = selectedProduct.description.split(' ')
      let line = ''
      for (const word of words) {
        if ((line + word).length > maxLineLength) {
          detailsLines.push({
            texts: [{ text: line.trim(), style: styles.gray }],
          })
          line = word + ' '
        } else {
          line += word + ' '
        }
      }
      if (line.trim()) {
        detailsLines.push({
          texts: [{ text: line.trim(), style: styles.gray }],
        })
      }

      // Quantity indicator
      const currentQuantity =
        model.cart?.items.find((i) => i.productVariantID === variant.id)
          ?.quantity ?? 0

      detailsLines.push(undefined)
      detailsLines.push({
        texts: [
          { text: '- ', style: styles.gray },
          { text: currentQuantity.toString(), style: styles.white },
          { text: ' +', style: styles.gray },
        ],
      })
    }

    // Combine both columns
    let leftLineIndex = 0
    let rightLineIndex = 0

    while (
      leftLineIndex < featured.length + staples.length + 3 ||
      rightLineIndex < detailsLines.length
    ) {
      let leftTexts = [{ text: '', pad: LIST_WIDTH }] as StyledText[]

      // Left column content
      if (leftLineIndex === 0) {
        leftTexts = [{ text: '\n~ featured ~', style: styles.white }]
      } else if (leftLineIndex === 1 && featured.length > 0) {
        leftTexts = renderProduct(
          featured[0],
          model.selectedProductId,
          LIST_WIDTH,
        )
      } else if (leftLineIndex > 1 && leftLineIndex < featured.length + 2) {
        const product = featured[leftLineIndex - 1]
        if (product) {
          leftTexts = renderProduct(
            product,
            model.selectedProductId,
            LIST_WIDTH,
          )
        }
      } else if (leftLineIndex === featured.length + 2) {
        leftTexts = [{ text: '~ staples ~', style: styles.white }]
      } else if (leftLineIndex > featured.length + 2) {
        const stapleIndex = leftLineIndex - featured.length - 3
        if (stapleIndex < staples.length) {
          leftTexts = renderProduct(
            staples[stapleIndex],
            model.selectedProductId,
            LIST_WIDTH,
          )
        }
      }

      // Right column content
      const rightLine =
        rightLineIndex < detailsLines.length
          ? detailsLines[rightLineIndex]
          : undefined

      // Combine columns
      if (leftTexts || rightLine?.texts) {
        lines.push({
          texts: [
            ...leftTexts.map((t) => ({
              ...t,
              pad: t.pad ?? LIST_WIDTH,
            })),
            ...(rightLine?.texts ?? []),
          ],
        })
      }

      leftLineIndex++
      rightLineIndex++
    }

    return lines
  },
  update: (msg, model) => {
    if (msg.type !== 'browser:keydown') return [model, undefined]

    const { key } = msg.event
    const selectedProduct = model.products.find(
      (p) => p.id === model.selectedProductId,
    )
    const variant = selectedProduct?.variants[0]

    const simple = (msg: Msg): [Model, Cmd | undefined] => [model, () => msg]

    switch (key.toLowerCase()) {
      case 'arrowdown':
      case 'j':
        return simple({ type: 'SelectProduct', productId: 'next' })

      case 'arrowup':
      case 'k':
        return simple({ type: 'SelectProduct', productId: 'prev' })

      case 'arrowright':
      case 'l':
      case '+':
        if (variant) {
          const currentQty =
            model.cart?.items.find((i) => i.productVariantID === variant.id)
              ?.quantity ?? 0
          return simple({
            type: 'UpdateQuantity',
            variantId: variant.id,
            delta: currentQty + 1,
          })
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
            return simple({
              type: 'UpdateQuantity',
              variantId: variant.id,
              delta: currentQty - 1,
            })
          }
        }
        break
    }

    return [model, undefined]
  },
})

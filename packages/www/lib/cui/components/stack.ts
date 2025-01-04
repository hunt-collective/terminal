import {
  type AlignItems,
  type LayoutNode,
  type Component,
  normalizeNode,
  createSpanningLine,
  type StyledLine,
} from '../render'

export type StackOptions = {
  gap?: number
  width?: number
  minHeight?: number
  align?: AlignItems
}

export function Stack(
  nodes: LayoutNode[],
  options: StackOptions = {},
): Component {
  return (parentContext) => {
    const width = options.width ?? parentContext.width
    const context = { width }
    const { gap = 0, align = 'start' } = options

    const lines: StyledLine[] = []

    nodes.forEach((node, index) => {
      // Convert node to component and evaluate it with our context
      const nodeLines = normalizeNode(node)(context)

      nodeLines.forEach((line) => {
        if (!line) {
          lines.push({ texts: [{ text: '' }], pad: width })
          return
        }

        if (width) {
          const contentWidth = line.texts.reduce(
            (w, t) => w + (t.text?.length || 0),
            0,
          )
          if (contentWidth < width) {
            lines.push(createSpanningLine(width, align, line.texts))
          } else {
            lines.push(line)
          }
        } else {
          lines.push(line)
        }
      })

      // Add gap if not last item
      if (index < nodes.length - 1 && gap > 0) {
        for (let i = 0; i < gap; i++) {
          lines.push({ texts: [{ text: '' }], pad: width })
        }
      }
    })

    if (options.minHeight && lines.length < options.minHeight) {
      const delta = options.minHeight - lines.length
      for (let i = 0; i < delta; i++) {
        lines.push({ texts: [{ text: '' }], pad: width })
      }
    }

    return lines
  }
}

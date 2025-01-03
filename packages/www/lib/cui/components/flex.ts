import {
  createSpanningLine,
  normalizeNode,
  type AlignItems,
  type Component,
  type JustifyContent,
  type LayoutContext,
  type LayoutNode,
} from '../layout'
import type { StyledLine, StyledText } from '../types'

export type FlexOptions = {
  gap?: number
  justify?: JustifyContent
  align?: AlignItems
  width?: number
}

export function Flex(
  nodes: LayoutNode[],
  options: FlexOptions = {},
): Component {
  return (parentContext: LayoutContext) => {
    const { justify = 'start', align = 'start', gap = 0 } = options
    const width = options.width ?? parentContext.width
    const context = { width }

    // Convert nodes to components and evaluate them
    const componentLines = nodes.map((node) => normalizeNode(node)(context))

    const maxLines = Math.max(...componentLines.map((lines) => lines.length))
    const result: StyledLine[] = []

    // Process each line across all components
    for (let lineIndex = 0; lineIndex < maxLines; lineIndex++) {
      const currentLineTexts: StyledText[] = []

      // Gather texts from each component for this line
      componentLines.forEach((lines, componentIndex) => {
        const line = lines[lineIndex]

        // Add spacing between components if not first component
        if (componentIndex > 0 && gap > 0) {
          currentLineTexts.push({ text: ' '.repeat(gap) })
        }

        // If this component has no line at this index, add empty space matching its width
        if (!line) {
          // Find the maximum width of this component
          const componentWidth = Math.max(
            ...lines.map(
              (l) =>
                l?.texts.reduce((w, t) => w + (t.text?.length || 0), 0) || 0,
            ),
            0,
          )
          currentLineTexts.push({ text: ' '.repeat(componentWidth) })
        } else {
          currentLineTexts.push(...line.texts)
        }
      })

      if (currentLineTexts.length === 0) {
        result.push({ texts: [{ text: '' }] })
        continue
      }

      if (!width) {
        result.push({ texts: currentLineTexts })
        continue
      }

      const totalContentWidth = currentLineTexts.reduce(
        (acc, text) => acc + (text.text?.length || 0),
        0,
      )

      if (justify === 'between' && componentLines.length > 1) {
        const remainingSpace = Math.max(0, width - totalContentWidth)
        const spaceBetween = Math.floor(
          remainingSpace / (componentLines.length - 1),
        )
        const adjustedTexts: StyledText[] = []

        componentLines.forEach((_, index) => {
          const componentTexts = componentLines[index][lineIndex]?.texts
          if (componentTexts) {
            adjustedTexts.push(...componentTexts)
            if (index < componentLines.length - 1) {
              adjustedTexts.push({ text: ' '.repeat(spaceBetween) })
            }
          }
        })

        result.push(createSpanningLine(width, align, adjustedTexts))
      } else {
        result.push(createSpanningLine(width, align, currentLineTexts))
      }
    }

    return result
  }
}

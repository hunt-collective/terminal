import {
  createSpanningLine,
  normalizeNode,
  type AlignItems,
  type Children,
  type Component,
  type JustifyContent,
  type ParentProps,
  type StyledLine,
} from '../render'

export type FlexOptions = {
  gap?: number
  justify?: JustifyContent
  align?: AlignItems
  width?: number
}

interface PropsWithOptions extends ParentProps, FlexOptions {}

export function Flex(props: PropsWithOptions | Children): Component {
  return (parentContext) => {
    const nodes = Array.isArray(props) ? props : props.children
    const options: FlexOptions = Array.isArray(props) ? {} : props

    const { justify = 'start', align = 'start', gap = 0 } = options
    const width =
      options.width ?? (justify === 'between' ? parentContext.width : undefined)
    const context = { width }

    // Convert nodes to components and evaluate them
    const componentLines = nodes.map((node) => normalizeNode(node)(context))
    const maxLines = Math.max(...componentLines.map((lines) => lines.length))
    const result: StyledLine[] = []

    // Calculate component widths for consistent spacing
    const componentWidths = componentLines.map((lines) =>
      Math.max(
        ...lines.map(
          (l) => l?.texts.reduce((w, t) => w + (t.text?.length || 0), 0) || 0,
        ),
      ),
    )

    // Process each line
    for (let lineIndex = 0; lineIndex < maxLines; lineIndex++) {
      const currentLines = componentLines.map((lines, componentIndex) => {
        const line = lines[lineIndex]
        if (!line) {
          return componentWidths[componentIndex] > 0
            ? { texts: [{ text: ' '.repeat(componentWidths[componentIndex]) }] }
            : undefined
        }
        return line
      })

      const validLines = currentLines
        .map((line, index) => ({ line, index }))
        .filter(
          (entry): entry is { line: StyledLine; index: number } =>
            entry.line !== undefined,
        )

      if (validLines.length === 0) {
        result.push({ texts: [{ text: '' }] })
        continue
      }

      // Handle justification
      if (!width) {
        const texts = validLines.flatMap((entry, i) => {
          const lineTexts = [...entry.line!.texts]
          if (i < validLines.length - 1 && gap > 0) {
            lineTexts.push({ text: ' '.repeat(gap) })
          }
          return lineTexts
        })
        result.push({ texts })
        continue
      }

      if (justify === 'between' && validLines.length > 1) {
        const totalContentWidth = validLines.reduce(
          (acc, entry) =>
            acc +
            entry.line!.texts.reduce((w, t) => w + (t.text?.length || 0), 0),
          0,
        )
        const gapWidth = (validLines.length - 1) * gap
        const remainingSpace = Math.max(0, width - totalContentWidth - gapWidth)
        const spaceBetween = Math.floor(
          remainingSpace / (validLines.length - 1),
        )

        const texts = validLines.flatMap((entry, i) => {
          const lineTexts = [...entry.line!.texts]
          if (i < validLines.length - 1) {
            lineTexts.push({ text: ' '.repeat(gap + spaceBetween) })
          }
          return lineTexts
        })
        result.push({ texts })
      } else {
        // For subsequent lines in non-between cases, or any other justification
        const texts = validLines.flatMap((entry, i) => {
          const lineTexts = [...entry.line!.texts]
          if (i < validLines.length - 1 && gap > 0) {
            lineTexts.push({ text: ' '.repeat(gap) })
          }
          return lineTexts
        })
        result.push(createSpanningLine(width, align, texts))
      }
    }

    return result
  }
}

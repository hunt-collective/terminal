import { ParentComponent } from "../component"
import {
  type AlignItems,
  normalizeNode,
  createSpanningLine,
  type StyledLine,
} from "../render"

type StackProps = {
  gap?: number
  width?: number
  minHeight?: number
  align?: AlignItems
}

export const Stack = ParentComponent<StackProps>((props) => {
  return (parentContext) => {
    const width = props.width ?? parentContext.width
    const context = { ...parentContext, parentType: "stack", width }
    const { gap = 0, align = "start" } = props

    const lines: StyledLine[] = []

    props.children.forEach((node, index) => {
      // Convert node to component and evaluate it with our context
      const nodeLines = normalizeNode(node)(context)

      nodeLines.forEach((line) => {
        if (!line) {
          lines.push({ texts: [{ text: " ".repeat(width ?? 0) }] })
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
      if (index < props.children.length - 1 && gap > 0) {
        for (let i = 0; i < gap; i++) {
          lines.push({ texts: [{ text: " ".repeat(width ?? 0) }] })
        }
      }
    })

    if (props.minHeight && lines.length < props.minHeight) {
      const delta = props.minHeight - lines.length
      for (let i = 0; i < delta; i++) {
        lines.push({ texts: [{ text: " ".repeat(width ?? 0) }] })
      }
    }

    return lines
  }
})

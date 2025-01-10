import { ParentComponent } from "../component"
import { normalizeNode, type StyledLine } from "../render"

type BoxProps = {
  padding?: number | { x?: number; y?: number }
  width?: number
  border?: boolean
  borderStyle?: {
    color?: object
    chars?: {
      topLeft?: string
      topRight?: string
      bottomLeft?: string
      bottomRight?: string
      horizontal?: string
      vertical?: string
    }
  }
}

const defaultBorderChars = {
  topLeft: "┌",
  topRight: "┐",
  bottomLeft: "└",
  bottomRight: "┘",
  horizontal: "─",
  vertical: "│",
}

export const Box = ParentComponent<BoxProps>((props) => {
  return (parentContext) => {
    if (props.children.length > 1)
      throw new Error("Box can only have one child")

    const width = props.width ?? parentContext.width
    const { border = false, borderStyle = {} } = props

    // Handle padding options
    const padding =
      typeof props.padding === "number"
        ? { x: props.padding, y: props.padding }
        : { x: props.padding?.x ?? 0, y: props.padding?.y ?? 0 }

    const chars = {
      ...defaultBorderChars,
      ...borderStyle.chars,
    }

    const borderColor = borderStyle.color || {}

    // Calculate available content width
    const borderWidth = border ? 2 : 0
    const availableWidth = width
      ? width - padding.x * 2 - borderWidth
      : undefined

    const childContext = {
      ...parentContext,
      parentType: "box",
      width: availableWidth,
    }

    // Convert node to component and evaluate it with our child context
    let lines = normalizeNode(props.children[0])(childContext)

    if (availableWidth) {
      lines = lines.map((line) => {
        if (!line) return line

        const lineWidth = line.texts.reduce(
          (w, t) => w + (t.text?.length || 0),
          0,
        )

        if (lineWidth > availableWidth) {
          return {
            texts: line.texts.map((t) => ({
              ...t,
              text: t.text?.slice(0, availableWidth),
            })),
          }
        }
        return line
      })
    }

    const contentWidth =
      availableWidth ??
      Math.max(
        ...lines.map((line) =>
          line ? line.texts.reduce((w, t) => w + (t.text?.length || 0), 0) : 0,
        ),
      )

    const horizontalPad = " ".repeat(Math.max(0, padding.x))
    const fullWidth = contentWidth + padding.x * 2 + borderWidth

    const resultLines: StyledLine[] = []

    if (border) {
      resultLines.push({
        texts: [
          {
            text:
              chars.topLeft +
              chars.horizontal.repeat(
                Math.max(0, contentWidth + padding.x * 2),
              ) +
              chars.topRight,
            style: { ...props.style, ...borderColor },
          },
        ],
      })
    }

    // Top padding
    for (let i = 0; i < padding.y; i++) {
      resultLines.push({
        texts: border
          ? [
              {
                text: chars.vertical,
                style: { ...props.style, ...borderColor },
              },
              {
                text: " ".repeat(Math.max(0, contentWidth + padding.x * 2)),
                style: props.style,
              },
              {
                text: chars.vertical,
                style: { ...props.style, ...borderColor },
              },
            ]
          : [
              {
                text: " ".repeat(Math.max(0, fullWidth)),
                style: props.style,
              },
            ],
      })
    }

    // Content lines
    lines.forEach((line) => {
      if (!line) {
        resultLines.push({
          texts: border
            ? [
                { text: chars.vertical, style: borderColor },
                { text: " ".repeat(Math.max(0, contentWidth + padding.x * 2)) },
                { text: chars.vertical, style: borderColor },
              ]
            : [{ text: " ".repeat(Math.max(0, fullWidth)) }],
        })
        return
      }

      const remainingSpace = Math.max(
        0,
        contentWidth -
          line.texts.reduce((w, t) => w + (t.text?.length || 0), 0),
      )

      resultLines.push({
        texts: [
          ...(border
            ? [
                {
                  text: chars.vertical,
                  style: { ...props.style, ...borderColor },
                },
              ]
            : []),
          { text: horizontalPad, style: props.style },
          ...line.texts.map((t) => ({
            ...t,
            style: { ...props.style, ...t.style },
          })),
          { text: " ".repeat(remainingSpace), style: props.style },
          { text: horizontalPad, style: props.style },
          ...(border
            ? [
                {
                  text: chars.vertical,
                  style: { ...props.style, ...borderColor },
                },
              ]
            : []),
        ],
      })
    })

    // Bottom padding
    for (let i = 0; i < padding.y; i++) {
      resultLines.push({
        texts: border
          ? [
              { text: chars.vertical, style: borderColor },
              { text: " ".repeat(Math.max(0, contentWidth + padding.x * 2)) },
              { text: chars.vertical, style: borderColor },
            ]
          : [{ text: " ".repeat(Math.max(0, fullWidth)) }],
      })
    }

    if (border) {
      resultLines.push({
        texts: [
          {
            text:
              chars.bottomLeft +
              chars.horizontal.repeat(
                Math.max(0, contentWidth + padding.x * 2),
              ) +
              chars.bottomRight,
            style: borderColor,
          },
        ],
      })
    }

    return resultLines
  }
})

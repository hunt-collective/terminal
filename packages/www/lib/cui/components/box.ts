import {
  normalizeNode,
  type Component,
  type LayoutNode,
  type StyledLine,
} from '../render'

export type BoxOptions = {
  padding?: number | { x?: number; y?: number }
  width?: number
  border?: boolean
  style?: object
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
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
}

export function Box(node: LayoutNode, options: BoxOptions = {}): Component {
  return (model, parentContext) => {
    const width = options.width ?? parentContext.width
    const { border = false, borderStyle = {} } = options

    // Handle padding options
    const padding =
      typeof options.padding === 'number'
        ? { x: options.padding, y: options.padding }
        : { x: options.padding?.x ?? 0, y: options.padding?.y ?? 0 }

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

    const childContext = { width: availableWidth }

    // Convert node to component and evaluate it with our child context
    let lines = normalizeNode(node)(model, childContext)

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

    const horizontalPad = ' '.repeat(Math.max(0, padding.x))
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
            style: { ...options.style, ...borderColor },
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
                style: { ...options.style, ...borderColor },
              },
              {
                text: ' '.repeat(Math.max(0, contentWidth + padding.x * 2)),
                style: options.style,
              },
              {
                text: chars.vertical,
                style: { ...options.style, ...borderColor },
              },
            ]
          : [
              {
                text: ' '.repeat(Math.max(0, fullWidth)),
                style: options.style,
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
                { text: ' '.repeat(Math.max(0, contentWidth + padding.x * 2)) },
                { text: chars.vertical, style: borderColor },
              ]
            : [{ text: ' '.repeat(Math.max(0, fullWidth)) }],
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
                  style: { ...options.style, ...borderColor },
                },
              ]
            : []),
          { text: horizontalPad, style: options.style },
          ...line.texts.map((t) => ({
            ...t,
            style: { ...options.style, ...t.style },
          })),
          { text: ' '.repeat(remainingSpace), style: options.style },
          { text: horizontalPad, style: options.style },
          ...(border
            ? [
                {
                  text: chars.vertical,
                  style: { ...options.style, ...borderColor },
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
              { text: ' '.repeat(Math.max(0, contentWidth + padding.x * 2)) },
              { text: chars.vertical, style: borderColor },
            ]
          : [{ text: ' '.repeat(Math.max(0, fullWidth)) }],
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
}

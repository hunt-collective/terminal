import type { StyledText, StyledLine } from './types'

// Layout context to track parent dimensions
type LayoutContext = {
  width?: number
}

// A Component is a function that takes a context and returns StyledLine[]
type Component = (context: LayoutContext) => StyledLine[]

// Core types for the layout system
export type LayoutNode = Component | StyledLine[] | StyledText | string

type JustifyContent = 'start' | 'center' | 'end' | 'between'
type AlignItems = 'start' | 'center' | 'end'

export type FlexOptions = {
  gap?: number
  justify?: JustifyContent
  align?: AlignItems
  width?: number
}

export type StackOptions = {
  gap?: number
  width?: number
  align?: AlignItems
}

export type TextOptions = {
  style?: object
  pad?: number
  maxWidth?: number
}

export type BoxOptions = {
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

export type SpacerOptions = {
  size?: number
}

// Helper to normalize nodes into Components
function normalizeNode(node: LayoutNode): Component {
  if (typeof node === 'function') {
    return node
  }

  if (Array.isArray(node)) {
    return () => node
  }

  if (typeof node === 'string') {
    return () => [{ texts: [{ text: node }] }]
  }

  return () => [{ texts: [node] }]
}

// Helper to wrap text into lines
function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  words.forEach((word) => {
    if (currentLine.length + word.length + 1 <= maxWidth) {
      currentLine += (currentLine.length > 0 ? ' ' : '') + word
    } else {
      if (currentLine.length > 0) {
        lines.push(currentLine)
      }
      currentLine = word.length > maxWidth ? word.slice(0, maxWidth) : word
    }
  })

  if (currentLine.length > 0) {
    lines.push(currentLine)
  }

  return lines
}

// Create a line of text that spans a width
function createSpanningLine(
  width: number,
  align: AlignItems,
  content: StyledText[],
): StyledLine {
  const contentWidth = content.reduce(
    (acc, text) => acc + (text.text?.length || 0),
    0,
  )
  const remainingSpace = Math.max(0, width - contentWidth)

  switch (align) {
    case 'end':
      return {
        texts: [{ text: ' '.repeat(remainingSpace) }, ...content],
      }
    case 'center': {
      const leftPad = Math.max(0, Math.floor(remainingSpace / 2))
      const rightPad = Math.max(0, remainingSpace - leftPad)
      return {
        texts: [
          { text: ' '.repeat(leftPad) },
          ...content,
          { text: ' '.repeat(rightPad) },
        ],
      }
    }
    default: // 'start'
      return {
        texts: [...content, { text: ' '.repeat(remainingSpace) }],
      }
  }
}

// Core layout components with nodes as first parameter
export function flex(
  nodes: LayoutNode[],
  options: FlexOptions = {},
): Component {
  return (parentContext: LayoutContext) => {
    const { justify = 'start', align = 'start', gap = 0 } = options
    const width =
      (options.width ?? options.justify === 'between')
        ? parentContext.width
        : undefined
    const context = { width }

    // Convert nodes to components and evaluate them with our context
    const lines = nodes.map((node) => normalizeNode(node)(context))
    const firstLines = lines.map((line) => line[0])
    let validLines = firstLines.filter(
      (line): line is StyledLine => line !== undefined,
    )
    if (gap) {
      const spacing = Math.max(0, gap)
      const spacer = { text: ' '.repeat(spacing) }
      validLines = validLines.map((line, i) =>
        i < validLines.length - 1
          ? { ...line, texts: [...line!.texts, spacer] }
          : line,
      )
    }

    if (!width) {
      return [{ texts: validLines.flatMap((line) => line!.texts) }]
    }

    const totalContentWidth = validLines.reduce((acc, line) => {
      return acc + line!.texts.reduce((w, t) => w + (t.text?.length || 0), 0)
    }, 0)

    if (justify === 'between' && validLines.length > 1) {
      const raw = Math.floor(
        (width - totalContentWidth) / (validLines.length - 1),
      )
      const spacing = Math.max(0, raw)
      const spacer = { text: ' '.repeat(spacing) }
      const result = validLines.flatMap((line, i) =>
        i < validLines.length - 1 ? [...line!.texts, spacer] : line!.texts,
      )
      return [createSpanningLine(width, align, result)]
    }

    return [
      createSpanningLine(
        width,
        align,
        validLines.flatMap((line) => line!.texts),
      ),
    ]
  }
}

export function stack(
  nodes: LayoutNode[],
  options: StackOptions = {},
): Component {
  return (parentContext: LayoutContext) => {
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

    return lines
  }
}

export function text(content: string, options: TextOptions = {}): Component {
  return (parentContext: LayoutContext) => {
    const maxWidth = options.maxWidth ?? parentContext.width
    const { style, pad: padding } = options

    if (!maxWidth) {
      return [
        {
          texts: [
            {
              text: content,
              style,
              pad: padding,
            },
          ],
        },
      ]
    }

    const wrappedLines = wrapText(content, maxWidth)

    return wrappedLines.map((line) => ({
      texts: [
        {
          text: line,
          style,
          pad: padding,
        },
      ],
    }))
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

export function box(node: LayoutNode, options: BoxOptions = {}): Component {
  return (parentContext: LayoutContext) => {
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
    let lines = normalizeNode(node)(childContext)

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
            style: borderColor,
          },
        ],
      })
    }

    // Top padding
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
          ...(border ? [{ text: chars.vertical, style: borderColor }] : []),
          { text: horizontalPad },
          ...line.texts,
          { text: ' '.repeat(remainingSpace) },
          { text: horizontalPad },
          ...(border ? [{ text: chars.vertical, style: borderColor }] : []),
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

// Utility components
export function spacer(options: SpacerOptions = {}): Component {
  return (parentContext: LayoutContext) => {
    const { size = 1 } = options
    const width = parentContext.width
    return Array(size).fill({
      texts: [{ text: width ? ' '.repeat(Math.max(0, width)) : '' }],
    })
  }
}

export function center(nodes: LayoutNode[], width?: number): Component {
  return (parentContext: LayoutContext) => {
    const context = { width: width ?? parentContext.width }
    return flex(nodes, {
      justify: 'center',
      align: 'center',
      width: context.width,
    })(context)
  }
}

export function rightAlign(nodes: LayoutNode[], width?: number): Component {
  return (parentContext: LayoutContext) => {
    const context = { width: width ?? parentContext.width }
    return flex(nodes, {
      justify: 'end',
      align: 'center',
      width: context.width,
    })(context)
  }
}

export function title(content: string): Component {
  return (parentContext: LayoutContext) => {
    return text(content.toUpperCase(), {
      style: { color: 'white', 'font-weight': 'bold' },
    })(parentContext)
  }
}

export function subtitle(content: string): Component {
  return (parentContext: LayoutContext) => {
    return text(content, {
      style: { color: 'gray', 'font-style': 'italic' },
    })(parentContext)
  }
}

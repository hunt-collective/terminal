import type { StyledText, StyledLine } from './types'
import { pad } from './render'

// Core types for the layout system
export type LayoutNode = StyledLine[] | StyledText | string

type JustifyContent = 'start' | 'center' | 'end' | 'between'
type AlignItems = 'start' | 'center' | 'end'

export type FlexOptions = {
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

// Helper to normalize nodes into StyledLines
function normalizeNode(node: LayoutNode) {
  if (Array.isArray(node)) {
    return node
  }

  if (typeof node === 'string') {
    return [{ texts: [{ text: node }] }]
  }

  return [{ texts: [node] }]
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
      const leftPad = Math.floor(remainingSpace / 2)
      const rightPad = remainingSpace - leftPad
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
): StyledLine[] {
  const { justify = 'start', align = 'start', width } = options

  // Normalize all nodes to StyledLines
  const lines = nodes.map(normalizeNode)

  // For now, we'll just handle single line flex layouts
  const firstLines = lines.map((line) => line[0])
  const validLines = firstLines.filter(
    (line): line is StyledLine => line !== undefined,
  )

  if (!width) {
    return [
      {
        texts: validLines.flatMap((line) => line!.texts),
      },
    ]
  }

  const totalContentWidth = validLines.reduce((acc, line) => {
    return acc + line!.texts.reduce((w, t) => w + (t.text?.length || 0), 0)
  }, 0)

  const allContent = validLines.flatMap((line) => line!.texts)

  if (justify === 'between' && validLines.length > 1) {
    const spacing = Math.floor(
      (width - totalContentWidth) / (validLines.length - 1),
    )
    const spacer = { text: ' '.repeat(spacing) }

    const result = validLines.flatMap((line, i) =>
      i < validLines.length - 1 ? [...line!.texts, spacer] : line!.texts,
    )

    return [createSpanningLine(width, align, result)]
  }

  return [createSpanningLine(width, align, allContent)]
}

export function stack(
  nodes: LayoutNode[],
  options: StackOptions = {},
): StyledLine[] {
  const { gap = 0, width, align = 'start' } = options

  const lines: StyledLine[] = []

  nodes.forEach((node, index) => {
    const nodeLines = normalizeNode(node)

    nodeLines.forEach((line) => {
      if (!line) {
        lines.push({ texts: [{ text: '' }], pad: width })
        return
      }

      if (width) {
        lines.push(createSpanningLine(width, align, line.texts))
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

export function text(content: string, options: TextOptions = {}): StyledLine[] {
  const { style, pad: padding, maxWidth } = options

  if (!maxWidth) {
    // Simple single-line text
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

  // Handle text wrapping
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

const defaultBorderChars = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
}

export function box(nodes: LayoutNode, options: BoxOptions = {}): StyledLine[] {
  const { border = false, borderStyle = {}, width: totalWidth } = options

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
  const availableWidth = totalWidth
    ? totalWidth - padding.x * 2 - borderWidth
    : undefined

  // Normalize content
  let lines = normalizeNode(nodes)

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

  const horizontalPad = ' '.repeat(padding.x)
  const fullWidth = contentWidth + padding.x * 2 + borderWidth

  const resultLines: StyledLine[] = []

  if (border) {
    resultLines.push({
      texts: [
        {
          text:
            chars.topLeft +
            chars.horizontal.repeat(contentWidth + padding.x * 2) +
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
            { text: ' '.repeat(contentWidth + padding.x * 2) },
            { text: chars.vertical, style: borderColor },
          ]
        : [{ text: ' '.repeat(fullWidth) }],
    })
  }

  // Content
  lines.forEach((line) => {
    if (!line) {
      resultLines.push({
        texts: border
          ? [
              { text: chars.vertical, style: borderColor },
              { text: ' '.repeat(contentWidth + padding.x * 2) },
              { text: chars.vertical, style: borderColor },
            ]
          : [{ text: ' '.repeat(fullWidth) }],
      })
      return
    }

    const innerContent = line.texts
    const remainingSpace =
      contentWidth - innerContent.reduce((w, t) => w + (t.text?.length || 0), 0)

    resultLines.push({
      texts: [
        ...(border ? [{ text: chars.vertical, style: borderColor }] : []),
        { text: horizontalPad },
        ...innerContent,
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
            { text: ' '.repeat(contentWidth + padding.x * 2) },
            { text: chars.vertical, style: borderColor },
          ]
        : [{ text: ' '.repeat(fullWidth) }],
    })
  }

  if (border) {
    resultLines.push({
      texts: [
        {
          text:
            chars.bottomLeft +
            chars.horizontal.repeat(contentWidth + padding.x * 2) +
            chars.bottomRight,
          style: borderColor,
        },
      ],
    })
  }

  return resultLines
}

// New utility components
export function spacer(options: SpacerOptions = {}): StyledLine[] {
  const { size = 1 } = options
  return Array(size).fill({ texts: [{ text: '' }] })
}

// Container that centers its content horizontally
export function center(nodes: LayoutNode[], width?: number): StyledLine[] {
  return flex(nodes, { justify: 'center', align: 'center', width })
}

// Container that right-aligns its content
export function rightAlign(nodes: LayoutNode[], width?: number): StyledLine[] {
  return flex(nodes, { justify: 'end', align: 'center', width })
}

// Shorthand for common text styles
export function title(content: string): StyledLine[] {
  return text(content.toUpperCase(), {
    style: { color: 'white', 'font-weight': 'bold' },
  })
}

export function subtitle(content: string): StyledLine[] {
  return text(content, {
    style: { color: 'gray', 'font-style': 'italic' },
  })
}

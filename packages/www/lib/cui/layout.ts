export type StyledText = {
  text: string
  style?: object
  pad?: number
}

export type StyledLine =
  | {
      texts: StyledText[]
      pad?: number
    }
  | undefined

// Layout context to track parent dimensions
export type LayoutContext = {
  width?: number
}

// A Component is a function that takes a context and returns StyledLine[]
export type Component = (context: LayoutContext) => StyledLine[]

// Core types for the layout system
export type LayoutNode = Component | StyledLine[] | StyledText | string

export type JustifyContent = 'start' | 'center' | 'end' | 'between'
export type AlignItems = 'start' | 'center' | 'end'

// Helper to normalize nodes into Components
export function normalizeNode(node: LayoutNode): Component {
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

// Create a line of text that spans a width
export function createSpanningLine(
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

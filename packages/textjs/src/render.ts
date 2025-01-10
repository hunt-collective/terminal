import type { Component } from "./component"
import { styleObjectToString, type Style } from "./style"

export type StyledText = {
  text: string
  style?: Style
}

export type StyledLine =
  | {
      texts: StyledText[]
    }
  | undefined

export type Node = Component | StyledLine[] | StyledText | string

export type JustifyContent = "start" | "center" | "end" | "between"
export type AlignItems = "start" | "center" | "end"

export function combineLines(lines: StyledLine[]): {
  text: string
  styles: string[]
} {
  const combinedText: string[] = []
  const combinedStyles: string[] = []

  lines.forEach((line) => {
    if (!line) {
      combinedText.push("\n")
      return
    }

    const { texts } = line
    let lineText = ""

    texts.forEach((p) => {
      const style = p.style ?? {}
      lineText += "%c"
      combinedStyles.push(styleObjectToString(style))
      lineText += p.text
    })

    combinedText.push(lineText)
  })

  return {
    text: combinedText.join("\n"),
    styles: combinedStyles,
  }
}

// Helper to normalize nodes into Components
export function normalizeNode(node: Node): Component {
  if (typeof node === "function") {
    return node
  }

  if (Array.isArray(node)) {
    return () => node
  }

  if (typeof node === "string") {
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
    case "end":
      return {
        texts: [{ text: " ".repeat(remainingSpace) }, ...content],
      }
    case "center": {
      const leftPad = Math.max(0, Math.floor(remainingSpace / 2))
      const rightPad = Math.max(0, remainingSpace - leftPad)
      return {
        texts: [
          { text: " ".repeat(leftPad) },
          ...content,
          { text: " ".repeat(rightPad) },
        ],
      }
    }
    default: // 'start'
      return {
        texts: [...content, { text: " ".repeat(remainingSpace) }],
      }
  }
}

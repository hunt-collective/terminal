import { ContentComponent } from '../component'

export type TextProps = {
  pad?: number
  maxWidth?: number
}

export const Text = ContentComponent<TextProps>((content, props) => {
  return (parentContext) => {
    const maxWidth = props.maxWidth ?? parentContext.width
    const { style, pad } = props

    if (!maxWidth) {
      return [
        {
          texts: [
            {
              text: content,
              style,
              pad,
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
          pad,
        },
      ],
    }))
  }
})

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

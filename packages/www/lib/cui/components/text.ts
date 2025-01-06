import { mergeStyles, ParentComponent } from '../component'

export type TextProps = {
  pad?: number
  maxWidth?: number
}

export const Text = ParentComponent<TextProps>((props) => {
  return (parentContext) => {
    if (props.children.length > 1)
      throw new Error('Text component only accepts a single child')

    const content = props.children[0]
    if (typeof content !== 'string')
      throw new Error('Text component only accepts a string')

    const maxWidth = props.maxWidth ?? parentContext.width
    const { pad } = props
    const style = mergeStyles(parentContext.parentStyle, props.style)

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

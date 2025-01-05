import type { Command, Message } from './events'
import type { Model } from './app'
import type { Component } from './component'

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

export type LayoutContext = {
  width?: number
}

export type Node = Component | StyledLine[] | StyledText | string

export type JustifyContent = 'start' | 'center' | 'end' | 'between'
export type AlignItems = 'start' | 'center' | 'end'

export const styles = {
  white: { color: 'white' },
  gray: { color: '#666' },
  orange: { color: '#ff4800' },
}

export type UpdateResult<T> =
  | {
      state?: Partial<T> // Direct local state updates
      message?: Message | Message[] // Messages for global state changes
      command?: Command // Side effects
    }
  | undefined

export interface Page {
  name: string
  init?: (model: Model) => Command | undefined
  update?: (msg: Message, model: Model) => UpdateResult<any>
  view: (model: Model) => StyledLine[]
}

export function createPage<
  T extends keyof Model['state'] | (string & {}),
>(options: {
  name: T
  init?: (model: Model) => Command | undefined
  view: T extends keyof Model['state']
    ? (model: Model, state: Model['state'][T]) => Component
    : (model: Model) => Component
  update?: (
    msg: Message,
    model: Model,
  ) => UpdateResult<T extends keyof Model['state'] ? Model['state'][T] : never>
}) {
  return {
    ...options,
    view: (model) => {
      const state =
        options.name in model.state
          ? model.state[options.name as keyof Model['state']]
          : undefined
      const component = ((model, state) => options.view(model, state as any))(
        model,
        state,
      )
      return component({ width: model.dimensions.width })
    },
  } satisfies Page
}

export function pad(str: string | undefined, length: number): string {
  const value = str || ''
  const renderedLength = value.replaceAll('%c', '').replaceAll('\n', '').length
  const delta = value.length - renderedLength
  return value.padEnd(length + delta)
}

export function formatPrice(price: number): string {
  return `$${(price / 100).toFixed(2)}`
}

function formatStyle(style: object): string {
  return Object.entries(style)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ')
}

export function combineLines(lines: StyledLine[]): {
  text: string
  styles: string[]
} {
  const combinedText: string[] = []
  const combinedStyles: string[] = []

  lines.forEach((line) => {
    if (!line) {
      combinedText.push('\n')
      return
    }

    const { texts, pad: padding } = line
    let lineText = ''

    texts.forEach((p) => {
      const style = p.style ?? {}
      lineText += '%c'
      combinedStyles.push(formatStyle(style))
      lineText += pad(p.text, p.pad ?? 0)
    })

    combinedText.push(pad(lineText, padding ?? 0))
  })

  return {
    text: combinedText.join('\n'),
    styles: combinedStyles,
  }
}

// Helper to normalize nodes into Components
export function normalizeNode(node: Node): Component {
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

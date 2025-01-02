import type { Model, ModelUpdate } from './app'
import type { Cmd, Msg } from './events'
import type { StyledLine } from './types'

export const EMPTY_LINE = { texts: [{ text: '' }] }

export const styles = {
  white: { color: 'white' },
  gray: { color: '#666' },
  orange: { color: '#ff4800' },
  header: {
    color: 'white',
    background: '#1e1e1e',
    'padding-top': '7px',
    'padding-bottom': '7px',
    'font-family': 'monospace',
  },
}

export interface View {
  name: string
  init?: (model: Model) => Cmd | undefined
  update?: (msg: Msg, model: Model) => [ModelUpdate, Cmd | undefined]
  view: (model: Model) => StyledLine[]
  fullscreen?: boolean
}

export function createView<
  T extends keyof Model['state'] | (string & {}),
>(options: {
  name: T
  init?: (model: Model) => Cmd | undefined
  view: T extends keyof Model['state']
    ? (model: Model, state: Model['state'][T]) => StyledLine[]
    : (model: Model) => StyledLine[]
  update?: (msg: Msg, model: Model) => [ModelUpdate, Cmd | undefined]
  fullscreen?: boolean
}) {
  return {
    name: options.name,
    init: options.init,
    view: (model) => {
      // Generate new content
      const local =
        options.name in model.state
          ? model.state[options.name as keyof Model['state']]
          : undefined
      const lines = ((model, state) => options.view(model, state as any))(
        model,
        local,
      )

      return lines
    },
    update: (msg, model) => {
      if (options.update) return options.update(msg, model)
      return [model, undefined]
    },
    fullscreen: options.fullscreen,
  } satisfies View
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
      if (p.style) {
        lineText += '%c'
        combinedStyles.push(formatStyle(p.style))
      }
      lineText += pad(p.text, p.pad ?? 0)
    })

    combinedText.push(pad(lineText, padding ?? 0))
  })

  return {
    text: combinedText.join('\n'),
    styles: combinedStyles,
  }
}

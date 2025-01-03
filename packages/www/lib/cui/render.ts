import type { Model } from './app'
import type { Command, Message } from './events'
import type { StyledLine } from './types'

export const EMPTY_LINE = { texts: [{ text: '', style: {} }] }

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

export interface View {
  name: string
  init?: (model: Model) => Command | undefined
  update?: (msg: Message, model: Model) => UpdateResult<any>
  view: (model: Model) => StyledLine[]
  fullscreen?: boolean
}

export function createView<
  T extends keyof Model['state'] | (string & {}),
>(options: {
  name: T
  init?: (model: Model) => Command | undefined
  view: T extends keyof Model['state']
    ? (model: Model, state: Model['state'][T]) => StyledLine[]
    : (model: Model) => StyledLine[]
  update?: (
    msg: Message,
    model: Model,
  ) => UpdateResult<T extends keyof Model['state'] ? Model['state'][T] : never>
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
    update: options.update,
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

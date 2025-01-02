import { Delay } from './events'
import { createView } from './render'

export type SplashState = {
  cursorVisible: boolean
}

export const SplashView = createView({
  name: 'splash',
  fullscreen: true,
  init: () => {
    return () => {
      return { type: 'splash:blink' }
    }
  },
  view: (_, local) => {
    const width = 80
    const height = 20

    const cursor = '█'
    const logoText = 'terminal'
    const logoWithCursor = logoText + (local?.cursorVisible ? cursor : ' ')
    const lines = []

    // Calculate vertical padding
    const contentHeight = 1
    const verticalPadding = Math.max(
      0,
      Math.floor((height - contentHeight) / 2),
    )

    // Add top padding
    for (let i = 0; i < verticalPadding; i++) {
      lines.push({ texts: [{ text: ' '.repeat(width) }] })
    }

    // Create the logo line with cursor
    const textPadding = Math.max(
      0,
      Math.floor((width - logoWithCursor.length) / 2),
    )
    lines.push({
      texts: [
        {
          text: ' '.repeat(textPadding),
          style: { 'font-family': 'monospace', color: 'white' },
        },
        {
          text: logoText,
          style: { 'font-family': 'monospace', color: 'white' },
        },
        {
          text: local?.cursorVisible ? cursor : ' ',
          style: { 'font-family': 'monospace', color: '#FF6600' },
        },
        {
          text: ' '.repeat(width - textPadding - logoWithCursor.length),
          style: { 'font-family': 'monospace', color: 'white' },
        },
      ],
    })

    // Add bottom padding
    for (let i = 0; i < height - contentHeight - verticalPadding; i++) {
      lines.push({ texts: [{ text: ' '.repeat(width) }] })
    }

    return lines
  },
  update: (msg, model) => {
    switch (msg.type) {
      case 'splash:blink':
        return [
          {
            ...model,
            state: {
              ...model.state,
              splash: { cursorVisible: !model.state.splash.cursorVisible },
            },
          },
          Delay(700, () => {
            return { type: 'splash:blink' }
          }),
        ]
    }
    return [model, undefined]
  },
})

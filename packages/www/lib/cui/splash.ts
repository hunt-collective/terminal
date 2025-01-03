import { Delay } from './events'
import { createView } from './render'

export type SplashState = {
  cursorVisible: boolean
}

export const SplashView = createView({
  name: 'splash',
  fullscreen: true,
  init: () => {
    return async () => {
      return { type: 'splash:blink' }
    }
  },
  view: (model, state) => {
    const cursor = '█'
    const logoText = 'terminal'
    const logoWithCursor = logoText + (state?.cursorVisible ? cursor : ' ')
    const lines = []

    // Calculate vertical padding
    const contentHeight = 1
    const verticalPadding = Math.max(
      0,
      Math.floor((model.dimensions.height - contentHeight) / 2),
    )

    // Add top padding
    for (let i = 0; i < verticalPadding; i++) {
      lines.push({ texts: [{ text: ' '.repeat(model.dimensions.width) }] })
    }

    // Create the logo line with cursor
    const textPadding = Math.max(
      0,
      Math.floor((model.dimensions.width - logoWithCursor.length) / 2),
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
          text: state?.cursorVisible ? cursor : ' ',
          style: { 'font-family': 'monospace', color: '#FF6600' },
        },
        {
          text: ' '.repeat(
            model.dimensions.width - textPadding - logoWithCursor.length,
          ),
          style: { 'font-family': 'monospace', color: 'white' },
        },
      ],
    })

    // Add bottom padding
    for (
      let i = 0;
      i < model.dimensions.height - contentHeight - verticalPadding;
      i++
    ) {
      lines.push({ texts: [{ text: ' '.repeat(model.dimensions.width) }] })
    }

    return lines
  },
  update: (msg, model) => {
    switch (msg.type) {
      case 'splash:blink':
        return {
          state: { cursorVisible: !model.state.splash.cursorVisible },
          command: Delay(700, () => {
            return { type: 'splash:blink' }
          }),
        }
    }
  },
})

import { Delay } from './events'
import { createView } from './render'
import { Stack, Text, Center, Spacer, Flex } from './components'

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

    return Stack([
      Spacer({ size: Math.floor(model.dimensions.height / 2) - 1 }),
      Center([
        Flex([
          Text(logoText, {
            style: {
              'font-family': 'monospace',
              color: 'white',
            },
          }),
          Text(state?.cursorVisible ? cursor : ' ', {
            style: {
              'font-family': 'monospace',
              color: '#FF6600',
            },
          }),
        ]),
      ]),
      Spacer({ size: Math.floor(model.dimensions.height / 2) }),
    ])({ width: model.dimensions.width })
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

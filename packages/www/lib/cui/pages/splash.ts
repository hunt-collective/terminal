import { Stack, Text, Center, Spacer, Flex } from '../components'
import { useState, useEffect } from '../hooks'
import { Component } from '../component'

type SplashProps = {
  dimensions: { height: number }
}

export const SplashPage = Component<SplashProps>((props) => {
  const [cursorVisible, setCursorVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((visible) => !visible)
    }, 700)
    return () => clearInterval(interval)
  })

  const cursor = '█'
  const logoText = 'terminal'

  return Stack([
    Spacer({ size: Math.floor(props.dimensions.height / 2) - 1 }),
    Center([
      Flex([
        Text(logoText, {
          fontFamily: 'monospace',
          color: 'white',
        }),
        Text(cursorVisible ? cursor : ' ', {
          fontFamily: 'monospace',
          color: '#FF6600',
        }),
      ]),
    ]),
    Spacer({ size: Math.floor(props.dimensions.height / 2) }),
  ])
})

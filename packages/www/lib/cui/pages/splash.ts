import { Stack, Text, Center, Spacer, Flex } from '../components'
import { useState, useEffect } from '../hooks'
import { Component } from '../component'
import { dimensions } from '../render'

export const SplashPage = Component(() => {
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
    Spacer({ size: Math.floor(dimensions.height / 2) - 1 }),
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
    Spacer({ size: Math.floor(dimensions.height / 2) }),
  ])
})

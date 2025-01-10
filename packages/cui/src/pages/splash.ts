import { dimensions } from "@/styles"
import { Component, useEffect, useState } from "@textjs/core"
import { Stack, Text, Center, Spacer, Flex } from "@textjs/core/components"

export const SplashPage = Component(() => {
  const [cursorVisible, setCursorVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((visible) => !visible)
    }, 700)
    return () => clearInterval(interval)
  })

  const cursor = "█"
  const logoText = "terminal"

  return Stack([
    Spacer({ size: Math.floor(dimensions.height / 2) - 1 }),
    Center([
      Flex([
        Text(logoText, {
          fontFamily: "monospace",
          color: "white",
        }),
        Text(cursorVisible ? cursor : " ", {
          fontFamily: "monospace",
          color: "#FF6600",
        }),
      ]),
    ]),
    Spacer({ size: Math.floor(dimensions.height / 2) }),
  ])
})

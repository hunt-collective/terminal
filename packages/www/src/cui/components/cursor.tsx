import React from 'react'

export const Cursor = () => {
  const [cursorVisible, setCursorVisible] = React.useState(true)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((visible) => !visible)
    }, 700)
    return () => clearInterval(interval)
  }, [])

  const cursor = '█'

  return <span className="text-[#FF6600]">{cursorVisible ? cursor : ' '}</span>
}

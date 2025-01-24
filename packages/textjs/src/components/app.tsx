import { PropsWithChildren } from "react"
import { createKeyboardManager, KeyboardContext } from "../keyboard"

const keyboardManager = createKeyboardManager()

export default function App(props: PropsWithChildren) {
  return (
    <KeyboardContext.Provider value={keyboardManager}>
      {props.children}
    </KeyboardContext.Provider>
  )
}

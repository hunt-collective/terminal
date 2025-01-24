import React, { PureComponent, type ReactNode } from "react"
import { createKeyboardManager, KeyboardContext } from "../keyboard"

type Props = {
  readonly children: ReactNode
}
type State = {}

const keyboardManager = createKeyboardManager()

export default class App extends PureComponent<Props, State> {
  static displayName = "TextjsApp"

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  override state = {}

  override render() {
    return (
      <KeyboardContext.Provider value={keyboardManager}>
        {this.props.children}
      </KeyboardContext.Provider>
    )
  }

  override componentDidMount() {}

  override componentWillUnmount() {}

  override componentDidCatch(error: Error) {}
}

import { combineLines } from "./render"
import { setRenderCallback } from "./hooks/index"
import { logger } from "./logging"
import { Component, ParentComponent } from "./component"
import {
  createKeyboardManager,
  KeyboardContext,
  KeyboardManager,
  useKeyboardManager,
} from "./keyboard"
import { Stack } from "./components/stack"
import { createRouter, Route, RouterContext } from "./router"

export class TextjsApp<T extends Route> {
  private started: boolean = false

  private last: string = ""
  private renderScheduled: boolean = false
  private root: () => Component
  private initialRoute: T
  private dimensions: { width: number; height: number }
  private keyboardManager: KeyboardManager

  private Wrapper = ParentComponent((props) => {
    return (context) => {
      const router = createRouter<T>(this.initialRoute)
      RouterContext.Provider(router)

      return Stack(props.children)(context)
    }
  })

  constructor(
    initialRoute: T,
    root: () => Component,
    dimensions: { width: number; height: number } = { width: 75, height: 20 },
  ) {
    this.initialRoute = initialRoute
    this.root = root
    this.dimensions = dimensions

    this.keyboardManager = createKeyboardManager()
    KeyboardContext.Provider(this.keyboardManager)

    setRenderCallback(this.scheduleRender.bind(this))
  }

  private scheduleRender() {
    if (this.renderScheduled) return
    this.renderScheduled = true
    requestAnimationFrame(() => {
      this.render()
      this.renderScheduled = false
    })
  }

  private render() {
    const lines = this.Wrapper(this.root())({ width: this.dimensions.width })
    const { text, styles } = combineLines(lines)
    const key = text + JSON.stringify(styles)

    if (key === this.last) return

    console.clear()
    console.log(text + logger.formatLogs(), ...styles)
    this.last = key
  }

  start() {
    if (this.started) return
    this.started = true
    this.render()
  }
}

export * from "./hooks/index"
export * from "./context"
export * from "./style"
export * from "./component"

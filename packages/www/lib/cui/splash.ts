import { launch } from './shop'
import { createView } from './render'
import type { StyledLine } from './types'

const SplashView = createView({
  name: 'SplashView',
  getCacheKey: (
    context,
    cursorVisible: boolean,
    width: number,
    height: number,
  ) => `splash-${cursorVisible}-${width}-${height}`,
  render: (context, cursorVisible: boolean, width: number, height: number) => {
    const cursor = '█'
    const logoText = 'terminal'
    const logoWithCursor = logoText + (cursorVisible ? cursor : ' ')
    const lines: StyledLine[] = []

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
          text: cursorVisible ? cursor : ' ',
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
})

export class TerminalSplash {
  private isVisible: boolean = true
  private intervalId: number | null = null
  private displayWidth: number = 80
  private displayHeight: number = 20

  constructor(private duration: number = 3000) {}

  private clearConsole(): void {
    console.clear()
  }

  private refreshDisplay(): void {
    this.clearConsole()
    SplashView.render(
      {} as any,
      this.isVisible,
      this.displayWidth,
      this.displayHeight,
    )
  }

  public start(): void {
    this.refreshDisplay()

    this.intervalId = window.setInterval(() => {
      this.isVisible = !this.isVisible
      this.refreshDisplay()
    }, 500)

    setTimeout(() => {
      this.stop()
    }, this.duration)
  }

  public async stop(): Promise<void> {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isVisible = true
    this.refreshDisplay()

    const shop = await launch()
    await shop.init()
  }

  public setDimensions(width: number, height: number): void {
    this.displayWidth = width
    this.displayHeight = height
    SplashView.clearCache()
  }
}

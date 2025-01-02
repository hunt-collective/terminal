import type { Context, StyledLine, StyledText } from './types'

export const styles = {
  white: { color: 'white' },
  gray: { color: '#666' },
  orange: { color: '#ff4800' },
  header: {
    color: 'white',
    background: '#1e1e1e',
    'padding-top': '7px',
    'padding-bottom': '7px',
    'font-family': 'monospace',
  },
}

// Type for view render functions
type ViewRenderer = (context: Context, ...args: any[]) => StyledLine[]

interface CacheEntry {
  lines: StyledLine[]
  timestamp: number
}

class ViewCache {
  private cache = new Map<string, CacheEntry>()
  private maxAge: number

  constructor(maxAgeMs: number = 5000) {
    this.maxAge = maxAgeMs
  }

  get(key: string): StyledLine[] | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key)
      return null
    }

    return entry.lines
  }

  set(key: string, lines: StyledLine[]): void {
    this.cache.set(key, {
      lines,
      timestamp: Date.now(),
    })
  }

  clear(): void {
    this.cache.clear()
  }
}

export function createView(options: {
  name: string
  getCacheKey: (context: Context, ...args: any[]) => string
  render: ViewRenderer
  maxAge?: number
}) {
  const cache = new ViewCache(options.maxAge)

  return {
    name: options.name,
    render: (context: Context, ...args: any[]) => {
      const cacheKey = options.getCacheKey(context, ...args)

      // Try to get from cache
      const cached = cache.get(cacheKey)
      if (cached) {
        renderConsole(cached)
        return
      }

      // Generate new content
      const lines = options.render(context, ...args)

      // Cache the result
      cache.set(cacheKey, lines)

      // Render
      renderConsole(lines)
    },
    clearCache: () => cache.clear(),
  }
}

export function pad(str: string | undefined, length: number): string {
  const value = str || ''
  const renderedLength = value.replaceAll('%c', '').length
  const delta = value.length - renderedLength
  return value.padEnd(length + delta)
}

export function formatPrice(price: number): string {
  return `$${(price / 100).toFixed(2)}`
}

export function formatStyle(style: object): string {
  return Object.entries(style)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ')
}

export function combineLines(lines: StyledLine[]): {
  text: string
  styles: string[]
} {
  const combinedText: string[] = []
  const combinedStyles: string[] = []

  lines.forEach((line) => {
    if (!line) {
      combinedText.push('\n')
      return
    }

    const { texts, pad: padding } = line
    let lineText = ''

    texts.forEach((p) => {
      if (p.style) {
        lineText += '%c'
        combinedStyles.push(formatStyle(p.style))
      }
      lineText += pad(p.text, p.pad ?? 0)
    })

    combinedText.push(pad(lineText, padding ?? 0))
  })

  return {
    text: combinedText.join('\n'),
    styles: combinedStyles,
  }
}

export function renderConsole(lines: StyledLine[]): void {
  const { text, styles } = combineLines(lines)
  console.log(text, ...styles)
}

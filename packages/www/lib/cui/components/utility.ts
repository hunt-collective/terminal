import type { Component, LayoutContext, LayoutNode } from '../layout'
import { flex } from './flex'
import { text } from './text'

export type SpacerOptions = {
  size?: number
}

export function spacer(options: SpacerOptions = {}): Component {
  return (parentContext: LayoutContext) => {
    const { size = 1 } = options
    const width = parentContext.width
    return Array(size).fill({
      texts: [{ text: width ? ' '.repeat(Math.max(0, width)) : '' }],
    })
  }
}

export function center(nodes: LayoutNode[], width?: number): Component {
  return (parentContext: LayoutContext) => {
    const context = { width: width ?? parentContext.width }
    return flex(nodes, {
      justify: 'center',
      align: 'center',
      width: context.width,
    })(context)
  }
}

export function rightAlign(nodes: LayoutNode[], width?: number): Component {
  return (parentContext: LayoutContext) => {
    const context = { width: width ?? parentContext.width }
    return flex(nodes, {
      justify: 'end',
      align: 'center',
      width: context.width,
    })(context)
  }
}

export function title(content: string): Component {
  return (parentContext: LayoutContext) => {
    return text(content.toUpperCase(), {
      style: { color: 'white', 'font-weight': 'bold' },
    })(parentContext)
  }
}

export function subtitle(content: string): Component {
  return (parentContext: LayoutContext) => {
    return text(content, {
      style: { color: 'gray', 'font-style': 'italic' },
    })(parentContext)
  }
}

export function empty(): Component {
  return (parentContext: LayoutContext) => {
    const width = parentContext.width
    return [
      {
        texts: [{ text: width ? ' '.repeat(width) : '' }],
      },
    ]
  }
}

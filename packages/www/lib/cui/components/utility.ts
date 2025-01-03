import type { Component, LayoutNode } from '../render'
import { Flex } from './flex'
import { Text } from './text'

export type SpacerOptions = {
  size?: number
}

export function Spacer(options: SpacerOptions = {}): Component {
  return (_model, parentContext) => {
    const { size = 1 } = options
    const width = parentContext.width
    return Array(size).fill({
      texts: [{ text: width ? ' '.repeat(Math.max(0, width)) : '' }],
    })
  }
}

export function Center(nodes: LayoutNode[], width?: number): Component {
  return (model, parentContext) => {
    const context = { width: width ?? parentContext.width }
    return Flex(nodes, {
      justify: 'center',
      align: 'center',
      width: context.width,
    })(model, context)
  }
}

export function Title(content: string): Component {
  return (model, parentContext) => {
    return Text(content.toUpperCase(), {
      style: { color: 'white', 'font-weight': 'bold' },
    })(model, parentContext)
  }
}

export function Subtitle(content: string): Component {
  return (model, parentContext) => {
    return Text(content, {
      style: { color: 'gray', 'font-style': 'italic' },
    })(model, parentContext)
  }
}

export function Break(): Component {
  return (_model, parentContext) => {
    const width = parentContext.width
    return [
      {
        texts: [{ text: width ? ' '.repeat(width) : '' }],
      },
    ]
  }
}

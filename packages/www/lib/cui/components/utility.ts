import type { Children, Component, ParentProps } from '../render'
import { Flex } from './flex'
import { Text } from './text'

export type SpacerOptions = {
  size?: number
}

export function Spacer(options: SpacerOptions = {}): Component {
  return (parentContext) => {
    const { size = 1 } = options
    const width = parentContext.width
    return Array(size).fill({
      texts: [{ text: width ? ' '.repeat(Math.max(0, width)) : '' }],
    })
  }
}

type CenterOptions = { width?: number }
interface CenterPropsWithOptions extends ParentProps, CenterOptions {}

export function Center(props: CenterPropsWithOptions | Children): Component {
  return (parentContext) => {
    const nodes = Array.isArray(props) ? props : props.children
    const options: CenterOptions = Array.isArray(props) ? {} : props

    const context = { width: options.width ?? parentContext.width }
    return Flex({
      justify: 'center',
      align: 'center',
      width: context.width,
      children: nodes,
    })(context)
  }
}

export function Title(content: string): Component {
  return (parentContext) => {
    return Text(content.toUpperCase(), {
      style: { color: 'white', 'font-weight': 'bold' },
    })(parentContext)
  }
}

export function Subtitle(content: string): Component {
  return (parentContext) => {
    return Text(content, {
      style: { color: 'gray', 'font-style': 'italic' },
    })(parentContext)
  }
}

export function Break(): Component {
  return (parentContext) => {
    const width = parentContext.width
    return [
      {
        texts: [{ text: width ? ' '.repeat(width) : '' }],
      },
    ]
  }
}

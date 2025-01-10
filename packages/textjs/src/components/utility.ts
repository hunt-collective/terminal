import { ParentComponent, type Component } from "../component"
import { Flex } from "./flex"
import { Text } from "./text"

export type SpacerOptions = {
  size?: number
}

export function Spacer(options: SpacerOptions = {}): Component {
  return (parentContext) => {
    const { size = 1 } = options
    const width = parentContext.width
    return Array(size).fill({
      texts: [{ text: width ? " ".repeat(Math.max(0, width)) : "" }],
    })
  }
}

type CenterProps = { width?: number }
export const Center = ParentComponent<CenterProps>((props) => {
  return (parentContext) => {
    const context = {
      ...parentContext,
      width: props.width ?? parentContext.width,
    }
    return Flex({
      justify: "center",
      align: "center",
      width: context.width,
      children: props.children,
    })(context)
  }
})

export function Title(content: string): Component {
  return Text(content.toUpperCase(), {
    color: "white",
    fontWeight: "bold",
  })
}

export function Subtitle(content: string): Component {
  return Text(content, {
    color: "gray",
    fontStyle: "italic",
  })
}

export function Break(): Component {
  return (parentContext) => {
    const width = parentContext.width
    return [
      {
        texts: [{ text: width ? " ".repeat(width) : "" }],
      },
    ]
  }
}

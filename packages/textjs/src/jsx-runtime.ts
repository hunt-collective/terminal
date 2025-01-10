import { normalizeNode, StyledText, type Node } from "./render"
import { Component as ComponentFn, ComponentProps } from "./component"

// JSX namespace configuration
declare global {
  namespace JSX {
    interface Element extends ComponentFn {}
    interface ElementChildrenAttribute {
      children: {}
    }
    interface IntrinsicElements {
      // Empty - we don't support intrinsic elements
    }
  }
}

// Helper to normalize children
function normalizeChildren(children: any[]): Node[] {
  return children.flat().filter(Boolean)
}

// JSX Factory function
export function jsx(
  type: (props: any) => ComponentFn,
  props: Record<string, any>,
  ...children: any[]
): ComponentFn {
  return type({
    ...props,
    children: normalizeChildren(children),
  })
}

// JSX Fragment support
export function Fragment({ children }: { children: Node[] }): ComponentFn {
  return (context) => {
    const texts = children
      .map(normalizeNode)
      .flatMap((c) => c(context))
      .filter(Boolean)
      .flatMap((c) => c!.texts)

    const withSpacers: StyledText[] = []
    if (context.parentType === "flex") {
      const gap = context.parentProps?.gap ?? 0
      const spacer = { text: " ".repeat(Math.max(0, gap)) }

      for (const [index, text] of texts.entries()) {
        withSpacers.push(text)

        if (index < texts.length - 1) {
          withSpacers.push(spacer)
        }
      }
    }

    return [{ texts: withSpacers && withSpacers.length ? withSpacers : texts }]
  }
}

// Component HOC that handles both JSX and regular usage
export function Component<P = {}>(
  render: (props: P & ComponentProps) => ComponentFn | JSX.Element,
): (props: P & ComponentProps) => ComponentFn {
  return (props) => {
    const result = render(props)
    if (typeof result === "function") {
      return result
    }
    // If JSX Element is returned, it's already a ComponentFn
    return result as unknown as ComponentFn
  }
}

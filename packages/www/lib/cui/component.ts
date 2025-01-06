import type { Node, StyledLine } from './render'
import { isStyleObject, type Style } from './style'

// Base props that all components can accept
export interface BaseProps {
  style?: Style
}

// Props for components that contain children
export interface ParentProps extends BaseProps {
  children: Node[]
}

export type ComponentContext = {
  width?: number
}

// Core component type definition
export type Component = (context: ComponentContext) => StyledLine[]

// Helper type for creating component-specific props with no children
export type ComponentProps<P = {}> = P & BaseProps

// Helper type for creating component-specific props with children
export type ParentComponentProps<P = {}> = P & ParentProps

// Helper to check if something is a LayoutNode array vs StyledLine array
function isNodeArray(value: Node | Node[]): value is Node[] {
  return (
    Array.isArray(value) &&
    (!value.length || // Empty array is a child array
      !(value[0] && typeof value[0] === 'object' && 'texts' in value[0]))
  ) // Not a StyledLine array
}

// Helper to normalize children to array
function normalizeChildren(children: Node | Node[] | undefined): Node[] {
  if (!children) return []
  if (isNodeArray(children)) return children
  return [children]
}

// Helper to create a component that doesn't accept children
export function Component<P>(
  render: (props: ComponentProps<P>) => Component,
): (props: ComponentProps<P>) => Component {
  return render
}

export function ParentComponent<P>(
  render: (props: ParentComponentProps<P>) => Component,
): {
  (props: ComponentProps<P> & { children: Node | Node[] }): Component

  (child: Node): Component
  (child: Node, style: Style): Component
  (child: Node, props: ComponentProps<P>): Component

  (children: Node[]): Component
  (children: Node[], style: Style): Component
  (children: Node[], props: ComponentProps<P>): Component
} {
  return function (...args: any[]): Component {
    if (args.length === 0)
      return render({ children: [] } as ParentComponentProps<P>)

    if (args.length === 1) {
      if (typeof args[0] === 'object' && 'children' in args[0]) {
        return render({
          ...args[0],
          children: normalizeChildren(args[0].children),
        })
      }

      return render({
        children: normalizeChildren(args[0]),
      } as ParentComponentProps<P>)
    }

    const children = normalizeChildren(args[0])
    const props = isStyleObject(args[1]) ? { style: args[1] } : args[1]
    return render({ ...props, children })
  }
}

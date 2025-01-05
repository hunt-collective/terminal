import type { Node, StyledLine } from './render'

// Base props that all components can accept
export interface BaseProps {
  style?: object
}

// Props for components that can contain multiple children
export interface ParentProps extends BaseProps {
  children: Node[]
}

// Props for components that accept exactly one child
export interface ContainerProps extends BaseProps {
  child: Node
}

// Core component type definition
export type Component = (context: { width?: number }) => StyledLine[]

// Helper type for creating component-specific props with no children
export type ComponentProps<P = {}> = P & BaseProps

// Helper type for creating component-specific props with multiple children
export type ParentComponentProps<P = {}> = P & ParentProps

// Helper type for creating component-specific props with single child
export type ContainerComponentProps<P = {}> = P & ContainerProps

// Helper to create a component that doesn't accept children
export function Component<P>(
  render: (props: ComponentProps<P>) => Component,
): (props: ComponentProps<P>) => Component {
  return render
}

// Helper to create a component that accepts multiple children
export function ParentComponent<P>(
  render: (props: ParentComponentProps<P>) => Component,
): (props: ParentComponentProps<P> | Node[]) => Component {
  return (rawProps) => {
    const props = Array.isArray(rawProps)
      ? ({ children: rawProps } as ParentComponentProps<P>)
      : rawProps
    return render(props)
  }
}

// Helper to create a component that accepts a single child
export function ContainerComponent<P>(
  render: (props: ContainerComponentProps<P>) => Component,
): (props: ContainerComponentProps<P> | Node) => Component {
  return (rawProps) => {
    const props =
      typeof rawProps !== 'string' && 'child' in rawProps
        ? rawProps
        : ({ child: rawProps } as ContainerComponentProps<P>)
    return render(props)
  }
}

// Helper to create a component that takes content directly or with props
export function ContentComponent<P>(
  render: (content: string, props: ComponentProps<P>) => Component,
): {
  (content: string): Component
  (content: string, props: ComponentProps<P>): Component
  (props: ComponentProps<P> & { content: string }): Component
} {
  return function (...args: any[]): Component {
    if (typeof args[0] === 'string' && args.length === 1) {
      return render(args[0], {} as any)
    }
    if (typeof args[0] === 'string' && typeof args[1] === 'object') {
      return render(args[0], args[1])
    }
    if (typeof args[0] === 'object' && 'content' in args[0]) {
      const { content, ...props } = args[0]
      return render(content, props)
    }
    throw new Error('Invalid arguments')
  }
}

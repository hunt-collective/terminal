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

export function ParentComponent<P>(
  render: (props: ParentComponentProps<P>) => Component,
): {
  (children: Node[]): Component
  (child: Node): Component
  (props: ParentComponentProps<P>): Component
} {
  return (rawProps: ParentComponentProps<P> | Node | Node[]): Component => {
    const props =
      Array.isArray(rawProps) ||
      typeof rawProps === 'string' ||
      typeof rawProps === 'function' ||
      (rawProps && typeof rawProps === 'object' && 'texts' in rawProps) ||
      (rawProps && typeof rawProps === 'object' && 'text' in rawProps)
        ? ({ children: rawProps } as ParentComponentProps<P>)
        : rawProps

    // Normalize children to array before passing to render
    return render({
      ...props,
      children: normalizeChildren(props.children),
    })
  }
}

export function ContainerComponent<P extends object>(
  render: (props: ContainerComponentProps<P>) => Component,
): {
  (child: Node): Component
  // (child: Node, style: object): Component
  (child: Node, props: Omit<P, 'child'>): Component
  (props: ContainerComponentProps<P>): Component
} {
  return function (
    childOrProps: Node | ContainerComponentProps<P>,
    propsOrStyle?: object,
  ): Component {
    if (
      typeof childOrProps === 'string' ||
      typeof childOrProps === 'function' ||
      Array.isArray(childOrProps) ||
      (childOrProps &&
        typeof childOrProps === 'object' &&
        'texts' in childOrProps) ||
      (childOrProps &&
        typeof childOrProps === 'object' &&
        'text' in childOrProps)
    ) {
      // No props/style provided
      if (!propsOrStyle) {
        return render({ child: childOrProps } as ContainerComponentProps<P>)
      }

      // // Style object provided
      // if (!('child' in propsOrStyle)) {
      //   return render({
      //     child: childOrProps,
      //     style: propsOrStyle,
      //   } as ContainerComponentProps<P>)
      // }

      // Props object provided
      return render({
        ...propsOrStyle,
        child: childOrProps,
      } as ContainerComponentProps<P>)
    }

    // Full props object
    return render(childOrProps)
  }
}

// Helper to create a component that takes content directly or with props
export function ContentComponent<P>(
  render: (content: string, props: ComponentProps<P>) => Component,
): {
  (content: string): Component
  (content: string, style: object): Component
  (content: string, props: ComponentProps<P>): Component
  (props: ComponentProps<P> & { content: string }): Component
} {
  return function (...args: any[]): Component {
    // Just content
    if (typeof args[0] === 'string' && args.length === 1) {
      return render(args[0], {} as any)
    }

    // Content and style object
    if (
      typeof args[0] === 'string' &&
      typeof args[1] === 'object' &&
      !('content' in args[1]) &&
      !('style' in args[1])
    ) {
      return render(args[0], { style: args[1] } as any)
    }

    // Content and props
    if (typeof args[0] === 'string' && typeof args[1] === 'object') {
      return render(args[0], args[1])
    }

    // Props object with content
    if (typeof args[0] === 'object' && 'content' in args[0]) {
      const { content, ...props } = args[0]
      return render(content, props)
    }

    throw new Error('Invalid arguments')
  }
}

// Helper to check if something is a LayoutNode array vs StyledLine array
function isChildArray(value: Node | Node[]): value is Node[] {
  return (
    Array.isArray(value) &&
    (!value.length || // Empty array is a child array
      !(value[0] && typeof value[0] === 'object' && 'texts' in value[0]))
  ) // Not a StyledLine array
}

// Helper to normalize children to array
function normalizeChildren(children: Node | Node[] | undefined): Node[] {
  if (!children) return []
  if (isChildArray(children)) return children
  return [children]
}

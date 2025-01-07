import type { Node, StyledLine } from './render'
import { isStyleObject, type Style } from './style'
import { prepareForRender } from './hooks'

let nextComponentId = 1

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
  parentStyle?: Style
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

// Merge parent and component styles, with component styles taking precedence
export function mergeStyles(
  parentStyle?: Style,
  componentStyle?: Style,
): Style | undefined {
  if (!parentStyle) return componentStyle
  if (!componentStyle) return parentStyle
  return { ...parentStyle, ...componentStyle }
}

// Helper to create a component that doesn't accept children
export function Component<P>(
  render: (props: ComponentProps<P>) => Component | StyledLine[],
): (props: ComponentProps<P>) => Component {
  const componentId = nextComponentId++

  return (props) => (context: ComponentContext) => {
    prepareForRender(componentId)
    const mergedStyle = mergeStyles(context.parentStyle, props.style)
    const childContext = {
      ...context,
      parentStyle: mergedStyle,
    }
    const result = render(props)
    if (typeof result === 'function') {
      return result(childContext)
    }
    return result
  }
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
  const componentId = nextComponentId++

  return function (...args: any[]): Component {
    if (args.length === 0)
      return (context) => {
        prepareForRender(componentId)
        return render({ children: [] } as ParentComponentProps<P>)(context)
      }

    if (args.length === 1) {
      if (typeof args[0] === 'object' && 'children' in args[0]) {
        const props = args[0]
        return (context: ComponentContext) => {
          prepareForRender(componentId)
          const mergedStyle = mergeStyles(context.parentStyle, props.style)
          const childContext = {
            ...context,
            parentStyle: mergedStyle,
          }
          return render({
            ...props,
            children: normalizeChildren(props.children),
          })(childContext)
        }
      }

      return (context) => {
        prepareForRender(componentId)
        return render({
          children: normalizeChildren(args[0]),
        } as ParentComponentProps<P>)(context)
      }
    }

    const children = normalizeChildren(args[0])
    const props = isStyleObject(args[1]) ? { style: args[1] } : args[1]
    return (context: ComponentContext) => {
      prepareForRender(componentId)
      const mergedStyle = mergeStyles(context.parentStyle, props.style)
      const childContext = {
        ...context,
        parentStyle: mergedStyle,
      }
      return render({ ...props, children })(childContext)
    }
  }
}

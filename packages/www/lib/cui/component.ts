import type { Node, StyledLine } from './render'
import { isStyleObject, type Style } from './style'
import { prepareForRender } from './hooks'

let nextComponentId = 1

export interface BaseProps {
  style?: Style
}

export interface ParentProps extends BaseProps {
  children: Node[]
}

export type ComponentContext = {
  width?: number
  parentStyle?: Style
}

export type Component = (context: ComponentContext) => StyledLine[]

export type ComponentProps<P = {}> = P & BaseProps

export type ParentComponentProps<P = {}> = P & ParentProps

function isNodeArray(value: Node | Node[]): value is Node[] {
  return (
    Array.isArray(value) &&
    (!value.length ||
      !(value[0] && typeof value[0] === 'object' && 'texts' in value[0]))
  )
}

function normalizeChildren(children: Node | Node[] | undefined): Node[] {
  if (!children) return []
  if (isNodeArray(children)) return children
  return [children]
}

export function mergeStyles(
  parentStyle?: Style,
  componentStyle?: Style,
): Style | undefined {
  if (!parentStyle) return componentStyle
  if (!componentStyle) return parentStyle
  return { ...parentStyle, ...componentStyle }
}

type ComponentFunction<P> =
  P extends Record<string, never>
    ? (props?: ComponentProps<P>) => Component | StyledLine[]
    : (props: ComponentProps<P>) => Component | StyledLine[]

type ComponentReturn<P> =
  P extends Record<string, never>
    ? (props?: ComponentProps<P>) => Component
    : (props: ComponentProps<P>) => Component

export function Component<P = {}>(
  render: ComponentFunction<P>,
): ComponentReturn<P> {
  const componentId = nextComponentId++

  function createComponent(props?: ComponentProps<P>): Component {
    return (context: ComponentContext): StyledLine[] => {
      prepareForRender(componentId)
      const mergedStyle = mergeStyles(context.parentStyle, props?.style)
      const childContext = {
        ...context,
        parentStyle: mergedStyle,
      }
      const result = render(props as ComponentProps<P>)
      if (typeof result === 'function') {
        return result(childContext)
      }
      return result
    }
  }

  return createComponent as ComponentReturn<P>
}

type ParentComponentOverloads<P> = {
  (props: ComponentProps<P> & { children: Node | Node[] }): Component
  (props?: { children: Node | Node[] }): Component
  (child: Node): Component
  (children: Node[]): Component
  (child: Node, style: Style): Component
  (children: Node[], style: Style): Component
  (child: Node, props: ComponentProps<P>): Component
  (children: Node[], props: ComponentProps<P>): Component
}

export function ParentComponent<P = {}>(
  render: (props: ParentComponentProps<P>) => Component,
): ParentComponentOverloads<P> {
  const componentId = nextComponentId++

  function createComponent(...args: any[]): Component {
    return (context: ComponentContext): StyledLine[] => {
      prepareForRender(componentId)

      if (args.length === 0) {
        return render({ children: [] } as ParentComponentProps<P>)(context)
      }

      if (args.length === 1) {
        if (typeof args[0] === 'object' && 'children' in args[0]) {
          const props = args[0]
          const mergedStyle = mergeStyles(context.parentStyle, props.style)
          const childContext = {
            ...context,
            parentStyle: mergedStyle,
          }
          return render({
            ...props,
            children: normalizeChildren(props.children),
          } as ParentComponentProps<P>)(childContext)
        }

        return render({
          children: normalizeChildren(args[0]),
        } as ParentComponentProps<P>)(context)
      }

      const children = normalizeChildren(args[0])
      const props = isStyleObject(args[1])
        ? ({ style: args[1] } as ComponentProps<P>)
        : (args[1] as ComponentProps<P>)

      const mergedStyle = mergeStyles(context.parentStyle, props?.style)
      const childContext = {
        ...context,
        parentStyle: mergedStyle,
      }
      return render({ ...props, children } as ParentComponentProps<P>)(
        childContext,
      )
    }
  }

  return createComponent
}

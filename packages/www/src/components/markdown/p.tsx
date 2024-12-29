import Line from './line'
import { type Component, type ParentProps } from 'solid-js'

const P: Component<ParentProps> = (props) => {
  const { children } = props

  if ('data-inner' in props && props['data-inner']) {
    return children
  }

  // @ts-expect-error
  if ((children?.t as string).includes('<figure')) {
    return children
  }

  return (
    <Line>
      <p
        {...props}
        class="[&>code]:text-gray-11 [&>code]:inline-block [&>code]:bg-gray-1 [&>code]:italic [&>code]:before:content-['`'] [&>code]:after:content-['`']"
      >
        {props.children}
      </p>
    </Line>
  )
}

export default P

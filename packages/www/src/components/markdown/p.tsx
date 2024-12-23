import Line from './line'
import { type Component, type ParentProps } from 'solid-js'

const P: Component<ParentProps> = (props) => {
  return (
    <Line>
      <p
        {...props}
        class="[&>code]:text-white [&>code]:inline-block [&>code]:bg-gray-1 [&>code]:italic [&>code]:before:content-['`'] [&>code]:after:content-['`']"
      >
        {props.children}
      </p>
    </Line>
  )
}

export default P

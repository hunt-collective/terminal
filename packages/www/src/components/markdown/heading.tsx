import Line from './line'
import { type Component, type ParentProps } from 'solid-js'

const Heading: Component<ParentProps> = (props) => {
  return (
    <Line>
      <h2 {...props} class="text-gray-11">
        {props.children}
      </h2>
    </Line>
  )
}

export default Heading

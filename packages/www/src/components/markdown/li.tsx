import { type Component, type ParentProps } from 'solid-js'
import Line from './line'

const LI: Component<ParentProps> = (props) => {
  return (
    <Line>
      <li {...props} class="text-gray-11 [&>p]:inline">
        {props.children}
      </li>
    </Line>
  )
}

export default LI

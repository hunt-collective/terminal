import Line from '@components/line'
import { type Component, type ParentProps } from 'solid-js'

const LineComponent: Component<ParentProps> = (props) => {
  return (
    <Line class="!px-20">
      <div class="max-w-[65ch]">{props.children}</div>
    </Line>
  )
}

export default LineComponent

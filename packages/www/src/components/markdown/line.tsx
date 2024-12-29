import Line, { type State } from '@components/line'
import { type Component, type ParentProps } from 'solid-js'

const LineComponent: Component<{ state?: State } & ParentProps> = (props) => {
  return (
    <Line class="!px-20" {...props}>
      <div class="max-w-[65ch]">{props.children}</div>
    </Line>
  )
}

export default LineComponent

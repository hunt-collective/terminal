import EmptyLine from './empty-line'
import Line from './line'
import { type Component, type ParentProps } from 'solid-js'

const H1: Component<ParentProps> = (props) => {
  return (
    <>
      <Line>
        <h1 {...props} class="text-white">
          {props.children}
        </h1>
      </Line>
      <EmptyLine />
      <EmptyLine />
    </>
  )
}

export default H1

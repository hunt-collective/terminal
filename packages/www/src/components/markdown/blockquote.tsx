import { type Component, type ParentProps } from 'solid-js'
import EmptyLine from './empty-line'

const Blockquote: Component<ParentProps> = (props) => {
  return (
    <>
      <EmptyLine />
      <blockquote class="px-0 m-0 border-l-2 border-orange bg-gray-1">
        {props.children}
      </blockquote>
      <EmptyLine />
    </>
  )
}

export default Blockquote

import { type Component, type ParentProps } from 'solid-js'

const Blockquote: Component<ParentProps> = (props) => {
  return (
    <blockquote class="px-0 m-0 border-l-2 border-orange bg-gray-1">
      {props.children}
    </blockquote>
  )
}

export default Blockquote

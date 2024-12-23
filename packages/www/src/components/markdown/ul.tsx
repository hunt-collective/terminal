import { type Component, type ParentProps } from 'solid-js'

const UL: Component<ParentProps> = (props) => {
  return (
    <ul {...props} class="list-disc list-inside">
      {props.children}
    </ul>
  )
}

export default UL

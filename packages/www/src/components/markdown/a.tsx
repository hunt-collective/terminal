import { type Component, type ParentProps } from 'solid-js'

const A: Component<ParentProps> = (props) => {
  return (
    <a
      {...props}
      class="text-orange no-underline [&>code]:text-white [&>code]:italic [&>code]:before:content-['`'] [&>code]:after:content-['`']"
    >
      {props.children}
    </a>
  )
}

export default A

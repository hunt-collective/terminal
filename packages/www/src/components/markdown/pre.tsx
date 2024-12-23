import { type Component, type ParentProps } from 'solid-js'

const Pre: Component<ParentProps> = (props) => {
  return (
    <div class="bg-gray-1">
      <pre
        {...props}
        // class="[&>code]:text-white [&>code]:italic [&>code]:before:content-['`'] [&>code]:after:content-['`']"
      >
        {props.children}
      </pre>
    </div>
  )
}

export default Pre

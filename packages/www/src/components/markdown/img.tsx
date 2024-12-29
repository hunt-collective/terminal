// import Line from './line'
import { type Component, type ParentProps } from 'solid-js'

const Img: Component<ParentProps> = (props) => {
  return (
    <div class="flex items-center bg-gray-1 justify-center border-y">
      <img {...props} class="">
        {props.children}
      </img>
    </div>
  )
}

export default Img

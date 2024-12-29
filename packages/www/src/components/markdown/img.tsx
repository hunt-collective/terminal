import { type Component, type ParentProps } from 'solid-js'
import EmptyLine from './empty-line'

const Img: Component<{ alt?: string } & ParentProps> = (props) => {
  return (
    <>
      <EmptyLine />
      <figure class="flex flex-col items-center bg-gray-1 justify-center border-y">
        <img {...props} class="">
          {props.children}
        </img>
        {props.alt && (
          <figcaption class="text-gray-10 italic lowercase">
            {props.alt}
          </figcaption>
        )}
      </figure>
      <EmptyLine />
    </>
  )
}

export default Img

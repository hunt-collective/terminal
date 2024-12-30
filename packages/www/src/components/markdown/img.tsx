import { type Component, type ParentProps } from 'solid-js'
import EmptyLine from './empty-line'
import Line from './line'

const Img: Component<{ alt?: string } & ParentProps> = (props) => {
  return (
    <>
      <EmptyLine />
      <figure class="">
        <div class="bg-gray-1 border-y">
          <img {...props} class="mx-auto">
            {props.children}
          </img>
        </div>
        {props.alt && (
          <figcaption class="text-gray-10 italic lowercase text-center">
            <Line>
              <span class="w-full text-center">{props.alt}</span>
            </Line>
          </figcaption>
        )}
      </figure>
      <EmptyLine />
    </>
  )
}

export default Img

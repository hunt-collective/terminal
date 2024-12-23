import { type Component, type ParentProps } from 'solid-js'
import Line from './line'

const Code: Component<ParentProps> = (props) => {
  const lines = props.children?.t
    .replace('<astro-static-slot>', '')
    .replace('</astro-static-slot>', '')
    .split('\n')
  console.log({ lines })

  return (
    <code {...props} class="text-white italic">
      <astro-static-slot>
        {lines.map((line) => (
          <Line>
            <span innerHTML={line} />
          </Line>
        ))}
      </astro-static-slot>
    </code>
  )
}

export default Code

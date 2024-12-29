import { type Component, type ParentProps } from 'solid-js'
import Line from './line'
import EmptyLine from './empty-line'

const Code: Component<ParentProps> = (props) => {
  const lines = props.children?.t
    .replace('<astro-static-slot>', '')
    .replace('</astro-static-slot>', '')
    .split('\n')
  if (lines.length === 1) {
    return <code {...props} innerHTML={lines[0]} />
  }

  return (
    <>
      <EmptyLine />
      <code {...props}>
        <astro-static-slot>
          {lines.map((line) => (
            <Line>
              <span innerHTML={line} />
            </Line>
          ))}
        </astro-static-slot>
      </code>
      <EmptyLine />
    </>
  )
}

export default Code
